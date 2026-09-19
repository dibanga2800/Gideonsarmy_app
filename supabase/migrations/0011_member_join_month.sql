-- First month a brother owes dues is the month of profiles.joined_at.
-- Administrators set that month so a September joiner is not charged for
-- January to August. Apply after 0010_repair_dues_writes.sql.

create or replace function public.member_dues_start_month(p_joined_at timestamptz)
returns date
language sql
stable
as $$
	select greatest(
		date '2026-01-01',
		date_trunc(
			'month',
			timezone('Europe/London', coalesce(p_joined_at, timestamptz '2026-01-01 00:00:00+00'))
		)::date
	);
$$;

create or replace function public.apply_member_dues_start(p_member_id uuid, p_start date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if p_member_id is null or p_start is null then
		return;
	end if;

	update public.dues
	set
		status = 'NOT_APPLICABLE',
		amount_paid_pence = 0
	where member_id = p_member_id
		and due_month < p_start
		and status = 'OUTSTANDING';

	update public.dues
	set status = 'OUTSTANDING'
	where member_id = p_member_id
		and due_month >= p_start
		and status = 'NOT_APPLICABLE';
end;
$$;

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
	joined_at timestamptz;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_active_member() then
		raise exception 'Only an approved member can view dues';
	end if;

	select profiles.joined_at
	into joined_at
	from public.profiles
	where id = auth.uid();

	start_month := public.member_dues_start_month(joined_at);

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
		and public.member_dues_start_month(profiles.joined_at) <= due_month
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
			and public.member_dues_start_month(profiles.joined_at) <= month_cursor
		on conflict (member_id, due_month) do nothing;

		get diagnostics batch_count = row_count;
		inserted_count := inserted_count + batch_count;
		month_cursor := (month_cursor + interval '1 month')::date;
	end loop;

	return inserted_count;
end;
$$;

drop function if exists public.admin_update_member(uuid, public.member_role, public.membership_status);

create or replace function public.admin_update_member(
	p_member_id uuid,
	p_role public.member_role,
	p_membership_status public.membership_status,
	p_joined_on date
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
	current_profile public.profiles;
	updated_profile public.profiles;
	join_on date := p_joined_on;
	today_london date := timezone('Europe/London', now())::date;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can change membership or role';
	end if;

	if p_member_id = auth.uid() then
		raise exception 'You cannot change your own role or membership status';
	end if;

	select *
	into current_profile
	from public.profiles
	where id = p_member_id
	for update;

	if not found then
		raise exception 'Member not found';
	end if;

	if join_on is not null then
		join_on := date_trunc('month', join_on::timestamp)::date;

		if join_on < date '2026-01-01' then
			raise exception 'Join month cannot be before January 2026';
		end if;

		if join_on > date_trunc('month', today_london::timestamp)::date then
			raise exception 'Join month cannot be in the future';
		end if;
	end if;

	perform set_config('app.allow_member_privilege_update', 'on', true);

	update public.profiles
	set
		role = p_role,
		membership_status = p_membership_status,
		joined_at = case
			when join_on is not null then join_on::timestamp at time zone 'Europe/London'
			when p_membership_status = 'ACTIVE' and current_profile.joined_at is null then now()
			else current_profile.joined_at
		end
	where id = p_member_id
	returning * into updated_profile;

	if updated_profile.membership_status = 'ACTIVE' then
		perform public.apply_member_dues_start(
			p_member_id,
			public.member_dues_start_month(updated_profile.joined_at)
		);
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
		'member.privileges.update',
		'profiles',
		p_member_id,
		jsonb_build_object(
			'role', current_profile.role,
			'membership_status', current_profile.membership_status,
			'join_month', public.member_dues_start_month(current_profile.joined_at)
		),
		jsonb_build_object(
			'role', updated_profile.role,
			'membership_status', updated_profile.membership_status,
			'join_month', public.member_dues_start_month(updated_profile.joined_at)
		)
	);

	return updated_profile;
end;
$$;

revoke all on function public.member_dues_start_month(timestamptz) from public, anon;
revoke all on function public.apply_member_dues_start(uuid, date) from public, anon, authenticated;
revoke all on function public.ensure_own_current_month_dues() from public, anon;
revoke all on function public.admin_generate_month_dues(date) from public, anon;
revoke all on function public.admin_ensure_dues_range(date, date) from public, anon;
revoke all on function public.admin_update_member(uuid, public.member_role, public.membership_status, date) from public, anon;

grant execute on function public.member_dues_start_month(timestamptz) to authenticated;
grant execute on function public.ensure_own_current_month_dues() to authenticated;
grant execute on function public.admin_generate_month_dues(date) to authenticated;
grant execute on function public.admin_ensure_dues_range(date, date) to authenticated;
grant execute on function public.admin_update_member(uuid, public.member_role, public.membership_status, date) to authenticated;

notify pgrst, 'reload schema';
