-- Treasurer records a received bank transfer and allocates it to whole months.
-- Members no longer submit payment confirmations.
-- Apply after 0006_events_admin.sql.

revoke execute on function public.submit_member_payment(uuid, integer, date, text, text) from authenticated, anon, public;

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

revoke all on function public.admin_record_payment(uuid, integer, date, text, text, text[]) from public, anon;
grant execute on function public.admin_record_payment(uuid, integer, date, text, text, text[]) to authenticated;

notify pgrst, 'reload schema';
