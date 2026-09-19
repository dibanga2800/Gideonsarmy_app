-- Generate dues from January 2026 through the current month for every active member.
-- Apply after 0008_member_invites.sql.

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

revoke all on function public.ensure_own_current_month_dues() from public, anon;
revoke all on function public.admin_ensure_dues_range(date, date) from public, anon;
grant execute on function public.ensure_own_current_month_dues() to authenticated;
grant execute on function public.admin_ensure_dues_range(date, date) to authenticated;

notify pgrst, 'reload schema';
