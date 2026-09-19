-- Repair dues generation and admin payment recording.
-- Apply after 0009_dues_year_ledger.sql, even if 0007 and 0009 already ran.
--
-- Dues tables use FORCE ROW LEVEL SECURITY. Policies that are only granted
-- to `authenticated` do not apply when SECURITY DEFINER runs as the function
-- owner. Recreate the write and select policies so the audited functions can
-- insert, lock, and update rows. Authenticated clients still have no
-- INSERT/UPDATE grants on dues.

drop policy if exists dues_select_own_or_admin on public.dues;
create policy dues_select_own_or_admin
	on public.dues
	for select
	using (member_id = auth.uid() or public.is_admin());

drop policy if exists dues_insert_member_or_admin on public.dues;
create policy dues_insert_member_or_admin
	on public.dues
	for insert
	with check (
		public.is_admin()
		or (member_id = auth.uid() and public.is_active_member())
	);

drop policy if exists dues_update_admin on public.dues;
create policy dues_update_admin
	on public.dues
	for update
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists payment_submissions_select_own_or_admin on public.payment_submissions;
create policy payment_submissions_select_own_or_admin
	on public.payment_submissions
	for select
	using (member_id = auth.uid() or public.is_admin());

drop policy if exists payment_submissions_insert_own on public.payment_submissions;
create policy payment_submissions_insert_own
	on public.payment_submissions
	for insert
	with check (
		public.is_admin()
		or (
			member_id = auth.uid()
			and public.is_active_member()
			and status = 'SUBMITTED'
		)
	);

drop policy if exists payment_submissions_update_admin on public.payment_submissions;
create policy payment_submissions_update_admin
	on public.payment_submissions
	for update
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists audit_logs_insert_actor on public.audit_logs;
create policy audit_logs_insert_actor
	on public.audit_logs
	for insert
	with check (public.is_admin() or public.is_active_member());

create or replace function public.ensure_own_current_month_dues()
returns public.dues
language plpgsql
security definer
set search_path = public
as $$
declare
	start_month date := date '2026-01-01';
	due_month date := public.current_fellowship_due_month();
	amount integer := public.monthly_dues_amount_pence();
	month_cursor date;
	dues_row public.dues;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_active_member() then
		raise exception 'Only an approved member can view dues';
	end if;

	if due_month < start_month then
		due_month := start_month;
	end if;

	month_cursor := start_month;
	while month_cursor <= due_month loop
		insert into public.dues (
			member_id,
			due_month,
			amount_due_pence,
			amount_paid_pence,
			status
		)
		values (
			auth.uid(),
			month_cursor,
			amount,
			0,
			'OUTSTANDING'
		)
		on conflict (member_id, due_month) do nothing;

		month_cursor := (month_cursor + interval '1 month')::date;
	end loop;

	select *
	into dues_row
	from public.dues
	where member_id = auth.uid()
		and due_month = public.current_fellowship_due_month();

	return dues_row;
end;
$$;

create or replace function public.admin_generate_month_dues(p_due_month date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	due_month date;
	amount integer := public.monthly_dues_amount_pence();
	inserted_count integer;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can generate dues';
	end if;

	due_month := date_trunc('month', p_due_month::timestamp)::date;

	insert into public.dues (
		member_id,
		due_month,
		amount_due_pence,
		amount_paid_pence,
		status
	)
	select
		profiles.id,
		due_month,
		amount,
		0,
		'OUTSTANDING'
	from public.profiles
	where profiles.membership_status = 'ACTIVE'
	on conflict (member_id, due_month) do nothing;

	get diagnostics inserted_count = row_count;
	return inserted_count;
end;
$$;

create or replace function public.admin_ensure_dues_range(p_from date, p_to date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	start_month date := date_trunc('month', coalesce(p_from, date '2026-01-01')::timestamp)::date;
	end_month date := date_trunc('month', coalesce(p_to, public.current_fellowship_due_month())::timestamp)::date;
	current_month date := public.current_fellowship_due_month();
	amount integer := public.monthly_dues_amount_pence();
	month_cursor date;
	inserted_count integer := 0;
	batch_count integer;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can generate dues';
	end if;

	if start_month < date '2026-01-01' then
		start_month := date '2026-01-01';
	end if;

	if end_month > current_month then
		end_month := current_month;
	end if;

	if end_month < start_month then
		return 0;
	end if;

	month_cursor := start_month;
	while month_cursor <= end_month loop
		insert into public.dues (
			member_id,
			due_month,
			amount_due_pence,
			amount_paid_pence,
			status
		)
		select
			profiles.id,
			month_cursor,
			amount,
			0,
			'OUTSTANDING'
		from public.profiles
		where profiles.membership_status = 'ACTIVE'
		on conflict (member_id, due_month) do nothing;

		get diagnostics batch_count = row_count;
		inserted_count := inserted_count + batch_count;
		month_cursor := (month_cursor + interval '1 month')::date;
	end loop;

	return inserted_count;
end;
$$;

drop function if exists public.admin_record_payment(uuid, integer, date, text, text, uuid[]);

create or replace function public.admin_record_payment(
	p_member_id uuid,
	p_amount_pence integer,
	p_payment_date date,
	p_transaction_reference text,
	p_notes text,
	p_dues_ids text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	reference text := nullif(trim(p_transaction_reference), '');
	note text := nullif(trim(coalesce(p_notes, '')), '');
	today_london date := timezone('Europe/London', now())::date;
	expected_total integer := 0;
	allocated_count integer := 0;
	current_dues public.dues;
	dues_id uuid;
	selected_ids uuid[];
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can record a payment';
	end if;

	if p_member_id is null then
		raise exception 'Select a member';
	end if;

	if not exists (
		select 1
		from public.profiles
		where id = p_member_id
			and membership_status = 'ACTIVE'
	) then
		raise exception 'Payments can only be recorded for an active member';
	end if;

	if p_dues_ids is null or cardinality(p_dues_ids) < 1 then
		raise exception 'Select at least one month';
	end if;

	if (
		select count(distinct selected_id)
		from unnest(p_dues_ids) as selected_id
	) <> cardinality(p_dues_ids) then
		raise exception 'Each month can only be selected once';
	end if;

	if p_amount_pence is null or p_amount_pence <= 0 or p_amount_pence > 100000 then
		raise exception 'Enter a valid payment amount';
	end if;

	if reference is null or char_length(reference) > 64 then
		raise exception 'Enter a valid transaction reference';
	end if;

	if note is not null and char_length(note) > 500 then
		raise exception 'The note is too long';
	end if;

	if p_payment_date is null or p_payment_date > today_london then
		raise exception 'Enter a payment date that is not in the future';
	end if;

	selected_ids := array(
		select selected_id::uuid
		from unnest(p_dues_ids) as selected_id
		order by selected_id
	);

	for dues_id in
		select unnest(selected_ids)
		order by 1
	loop
		select *
		into current_dues
		from public.dues
		where id = dues_id
		for update;

		if not found then
			raise exception 'Dues record not found';
		end if;

		if current_dues.member_id <> p_member_id then
			raise exception 'Every month must belong to the selected member';
		end if;

		if current_dues.status <> 'OUTSTANDING' then
			raise exception 'Only outstanding months can be allocated';
		end if;

		expected_total := expected_total + current_dues.amount_due_pence;
	end loop;

	if expected_total <> p_amount_pence then
		raise exception 'The amount must equal the total of the selected months';
	end if;

	foreach dues_id in array selected_ids
	loop
		select *
		into current_dues
		from public.dues
		where id = dues_id;

		insert into public.payment_submissions (
			dues_id,
			member_id,
			amount_pence,
			payment_date,
			transaction_reference,
			notes,
			status,
			reviewed_at,
			reviewed_by,
			reviewer_note
		)
		values (
			current_dues.id,
			p_member_id,
			current_dues.amount_due_pence,
			p_payment_date,
			reference,
			note,
			'CONFIRMED',
			now(),
			auth.uid(),
			'Recorded by an administrator'
		);

		update public.dues
		set
			status = 'CONFIRMED',
			amount_paid_pence = current_dues.amount_due_pence
		where id = current_dues.id;

		allocated_count := allocated_count + 1;
	end loop;

	insert into public.audit_logs (
		actor_id,
		action,
		entity_type,
		entity_id,
		old_data,
		new_data
	)
	values (
		auth.uid(),
		'payment.record',
		'profiles',
		p_member_id,
		null,
		jsonb_build_object(
			'amount_pence', p_amount_pence,
			'month_count', allocated_count,
			'payment_date', p_payment_date
		)
	);

	return allocated_count;
end;
$$;

revoke all on function public.ensure_own_current_month_dues() from public, anon;
revoke all on function public.admin_generate_month_dues(date) from public, anon;
revoke all on function public.admin_ensure_dues_range(date, date) from public, anon;
revoke all on function public.admin_record_payment(uuid, integer, date, text, text, text[]) from public, anon;

grant execute on function public.ensure_own_current_month_dues() to authenticated;
grant execute on function public.admin_generate_month_dues(date) to authenticated;
grant execute on function public.admin_ensure_dues_range(date, date) to authenticated;
grant execute on function public.admin_record_payment(uuid, integer, date, text, text, text[]) to authenticated;

notify pgrst, 'reload schema';
