-- Fix apply_member_dues_start: variable due_month shadowed the dues.due_month
-- column and caused PostgreSQL 42702 (ambiguous column) when changing a
-- member's payment start. Apply after 0015_fix_month_celebrants.sql.

create or replace function public.apply_member_dues_start(p_member_id uuid, p_start date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	start_month date := p_start;
	through_month date := public.current_fellowship_due_month();
	amount integer := public.monthly_dues_amount_pence();
	month_cursor date;
begin
	if p_member_id is null then
		return;
	end if;

	if start_month is null or start_month < date '2026-01-01' then
		start_month := date '2026-01-01';
	end if;

	update public.dues
	set
		status = 'NOT_APPLICABLE',
		amount_paid_pence = 0
	where member_id = p_member_id
		and public.dues.due_month < start_month
		and status = 'OUTSTANDING';

	update public.dues
	set status = 'OUTSTANDING'
	where member_id = p_member_id
		and public.dues.due_month >= start_month
		and status = 'NOT_APPLICABLE';

	month_cursor := start_month;
	while month_cursor <= through_month loop
		insert into public.dues (
			member_id,
			due_month,
			amount_due_pence,
			amount_paid_pence,
			status
		)
		values (
			p_member_id,
			month_cursor,
			amount,
			0,
			'OUTSTANDING'
		)
		on conflict (member_id, due_month) do nothing;

		month_cursor := (month_cursor + interval '1 month')::date;
	end loop;
end;
$$;

revoke all on function public.apply_member_dues_start(uuid, date) from public, anon, authenticated;

notify pgrst, 'reload schema';
