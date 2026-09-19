-- Dues generation, member payment submission, and audited admin confirmation.
-- Apply after 0004_birthday_month_day.sql.
--
-- Members cannot mark dues as confirmed. Authenticated clients have no UPDATE
-- grant on dues or payment_submissions. Mutations go through audited
-- SECURITY DEFINER functions.

insert into public.app_settings (key, value)
values (
	'payment_account',
	jsonb_build_object(
		'accountName', '',
		'sortCode', '',
		'accountNumber', '',
		'referenceNote', 'Use your full name as the payment reference.'
	)
)
on conflict (key) do nothing;

create unique index if not exists payment_submissions_one_open_per_dues
	on public.payment_submissions (dues_id)
	where status = 'SUBMITTED';

create index if not exists payment_submissions_status_idx
	on public.payment_submissions (status);

create or replace function public.current_fellowship_due_month()
returns date
language sql
stable
as $$
	select date_trunc('month', timezone('Europe/London', now()))::date;
$$;

create or replace function public.monthly_dues_amount_pence()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
	configured integer;
begin
	select (value #>> '{}')::integer
	into configured
	from public.app_settings
	where key = 'monthly_dues_pence';

	if configured is null or configured < 0 then
		return 1000;
	end if;

	return configured;
end;
$$;

create or replace function public.ensure_own_current_month_dues()
returns public.dues
language plpgsql
security definer
set search_path = public
as $$
declare
	due_month date := public.current_fellowship_due_month();
	amount integer := public.monthly_dues_amount_pence();
	record public.dues;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_active_member() then
		raise exception 'Only an approved member can view dues';
	end if;

	insert into public.dues (
		member_id,
		due_month,
		amount_due_pence,
		amount_paid_pence,
		status
	)
	values (
		auth.uid(),
		due_month,
		amount,
		0,
		'OUTSTANDING'
	)
	on conflict (member_id, due_month) do nothing;

	select *
	into record
	from public.dues
	where member_id = auth.uid()
		and due_month = due_month;

	return record;
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

create or replace function public.submit_member_payment(
	p_dues_id uuid,
	p_amount_pence integer,
	p_payment_date date,
	p_transaction_reference text,
	p_notes text
)
returns public.payment_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
	current_dues public.dues;
	created public.payment_submissions;
	reference text := nullif(trim(p_transaction_reference), '');
	notes text := nullif(trim(coalesce(p_notes, '')), '');
	today_london date := timezone('Europe/London', now())::date;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_active_member() then
		raise exception 'Only an approved member can submit a payment';
	end if;

	if p_amount_pence is null or p_amount_pence <= 0 or p_amount_pence > 100000 then
		raise exception 'Enter a valid payment amount';
	end if;

	if reference is null or char_length(reference) > 64 then
		raise exception 'Enter a valid transaction reference';
	end if;

	if notes is not null and char_length(notes) > 500 then
		raise exception 'The note is too long';
	end if;

	if p_payment_date is null or p_payment_date > today_london then
		raise exception 'Enter a payment date that is not in the future';
	end if;

	select *
	into current_dues
	from public.dues
	where id = p_dues_id
	for update;

	if not found then
		raise exception 'Dues record not found';
	end if;

	if current_dues.member_id <> auth.uid() then
		raise exception 'You can only submit a payment for your own dues';
	end if;

	if current_dues.status <> 'OUTSTANDING' then
		raise exception 'This month is not waiting for a payment submission';
	end if;

	insert into public.payment_submissions (
		dues_id,
		member_id,
		amount_pence,
		payment_date,
		transaction_reference,
		notes,
		status
	)
	values (
		current_dues.id,
		auth.uid(),
		p_amount_pence,
		p_payment_date,
		reference,
		notes,
		'SUBMITTED'
	)
	returning * into created;

	update public.dues
	set status = 'PAYMENT_SUBMITTED'
	where id = current_dues.id;

	return created;
end;
$$;

create or replace function public.admin_review_payment(
	p_submission_id uuid,
	p_decision public.payment_submission_status,
	p_reviewer_note text
)
returns public.payment_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
	current_submission public.payment_submissions;
	updated_submission public.payment_submissions;
	current_dues public.dues;
	remaining_submitted integer := 0;
	note text := nullif(trim(coalesce(p_reviewer_note, '')), '');
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can confirm or reject a payment';
	end if;

	if p_decision not in ('CONFIRMED', 'REJECTED') then
		raise exception 'A payment review must confirm or reject';
	end if;

	select *
	into current_submission
	from public.payment_submissions
	where id = p_submission_id
	for update;

	if not found then
		raise exception 'Payment submission not found';
	end if;

	if current_submission.status <> 'SUBMITTED' then
		raise exception 'Only a submitted payment can be reviewed';
	end if;

	select *
	into current_dues
	from public.dues
	where id = current_submission.dues_id
	for update;

	if current_dues.status <> 'PAYMENT_SUBMITTED' then
		raise exception 'This month is not waiting for payment confirmation';
	end if;

	update public.payment_submissions
	set
		status = p_decision,
		reviewed_at = now(),
		reviewed_by = auth.uid(),
		reviewer_note = note
	where id = p_submission_id
	returning * into updated_submission;

	if p_decision = 'CONFIRMED' then
		update public.dues
		set
			status = 'CONFIRMED',
			amount_paid_pence = current_submission.amount_pence
		where id = current_dues.id;
	else
		select count(*)
		into remaining_submitted
		from public.payment_submissions
		where dues_id = current_dues.id
			and status = 'SUBMITTED'
			and id <> p_submission_id;

		if remaining_submitted = 0 then
			update public.dues
			set status = 'OUTSTANDING'
			where id = current_dues.id;
		end if;
	end if;

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
		'payment.review',
		'payment_submissions',
		p_submission_id,
		jsonb_build_object(
			'status', current_submission.status,
			'dues_status', current_dues.status,
			'amount_pence', current_submission.amount_pence
		),
		jsonb_build_object(
			'status', updated_submission.status,
			'dues_status', case
				when p_decision = 'CONFIRMED' then 'CONFIRMED'
				when remaining_submitted = 0 then 'OUTSTANDING'
				else 'PAYMENT_SUBMITTED'
			end
		)
	);

	return updated_submission;
end;
$$;

create or replace function public.admin_waive_dues(p_dues_id uuid)
returns public.dues
language plpgsql
security definer
set search_path = public
as $$
declare
	current_dues public.dues;
	updated_dues public.dues;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can waive dues';
	end if;

	select *
	into current_dues
	from public.dues
	where id = p_dues_id
	for update;

	if not found then
		raise exception 'Dues record not found';
	end if;

	if current_dues.status <> 'OUTSTANDING' then
		raise exception 'Only outstanding dues can be waived';
	end if;

	update public.dues
	set status = 'WAIVED'
	where id = p_dues_id
	returning * into updated_dues;

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
		'dues.waive',
		'dues',
		p_dues_id,
		jsonb_build_object('status', current_dues.status),
		jsonb_build_object('status', updated_dues.status)
	);

	return updated_dues;
end;
$$;

create or replace function public.admin_update_payment_account(p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	updated jsonb;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can update payment instructions';
	end if;

	if p_value is null
		or jsonb_typeof(p_value -> 'accountName') <> 'string'
		or jsonb_typeof(p_value -> 'sortCode') <> 'string'
		or jsonb_typeof(p_value -> 'accountNumber') <> 'string'
		or jsonb_typeof(p_value -> 'referenceNote') <> 'string'
	then
		raise exception 'Payment instructions are incomplete';
	end if;

	insert into public.app_settings (key, value, updated_by)
	values ('payment_account', p_value, auth.uid())
	on conflict (key) do update
		set
			value = excluded.value,
			updated_by = excluded.updated_by
	returning value into updated;

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
		'settings.payment_account.update',
		'app_settings',
		null,
		jsonb_build_object('key', 'payment_account'),
		jsonb_build_object('key', 'payment_account', 'changed', true)
	);

	return updated;
end;
$$;

revoke all on function public.current_fellowship_due_month() from public, anon;
revoke all on function public.monthly_dues_amount_pence() from public, anon;
revoke all on function public.ensure_own_current_month_dues() from public, anon;
revoke all on function public.admin_generate_month_dues(date) from public, anon;
revoke all on function public.submit_member_payment(uuid, integer, date, text, text) from public, anon;
revoke all on function public.admin_review_payment(uuid, public.payment_submission_status, text) from public, anon;
revoke all on function public.admin_waive_dues(uuid) from public, anon;
revoke all on function public.admin_update_payment_account(jsonb) from public, anon;

grant execute on function public.current_fellowship_due_month() to authenticated;
grant execute on function public.monthly_dues_amount_pence() to authenticated;
grant execute on function public.ensure_own_current_month_dues() to authenticated;
grant execute on function public.admin_generate_month_dues(date) to authenticated;
grant execute on function public.submit_member_payment(uuid, integer, date, text, text) to authenticated;
grant execute on function public.admin_review_payment(uuid, public.payment_submission_status, text) to authenticated;
grant execute on function public.admin_waive_dues(uuid) to authenticated;
grant execute on function public.admin_update_payment_account(jsonb) to authenticated;

revoke insert on public.payment_submissions from authenticated;
grant select on public.payment_submissions to authenticated;
