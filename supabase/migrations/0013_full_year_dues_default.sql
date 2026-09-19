-- Full-year dues from January 2026 unless an administrator sets a later start
-- for a new member. Creating missing months when that start is moved earlier.
-- Apply after 0012_admin_member_record.sql.

create or replace function public.apply_member_dues_start(p_member_id uuid, p_start date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	start_month date := p_start;
	due_month date := public.current_fellowship_due_month();
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
		and due_month < start_month
		and status = 'OUTSTANDING';

	update public.dues
	set status = 'OUTSTANDING'
	where member_id = p_member_id
		and due_month >= start_month
		and status = 'NOT_APPLICABLE';

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
	full_year_start timestamp with time zone := timestamp '2026-01-01' at time zone 'Europe/London';
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
			when p_membership_status = 'ACTIVE' then coalesce(current_profile.joined_at, full_year_start)
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

revoke all on function public.apply_member_dues_start(uuid, date) from public, anon, authenticated;

notify pgrst, 'reload schema';
