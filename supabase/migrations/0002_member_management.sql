-- Member profile updates, RBAC protections, and audited admin privilege changes.
-- Apply after 0001_init.sql.
--
-- Role and membership_status must not be changed by a normal UPDATE.
-- Administrators change another member through admin_update_member, which
-- writes an audit row in the same transaction.

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
as $$
begin
	-- SQL editor / migrations have no JWT. API requests still need RLS.
	if auth.uid() is null then
		return new;
	end if;

	if new.id = auth.uid() then
		if new.role is distinct from old.role then
			raise exception 'You cannot change your own role';
		end if;

		if new.membership_status is distinct from old.membership_status then
			raise exception 'You cannot change your own membership status';
		end if;
	end if;

	if new.role is distinct from old.role
		or new.membership_status is distinct from old.membership_status
	then
		if current_setting('app.allow_member_privilege_update', true) is distinct from 'on' then
			raise exception 'Role and membership status must be changed through the audited membership function';
		end if;

		if not public.is_admin() then
			raise exception 'Role changes must be performed by an administrator';
		end if;
	end if;

	return new;
end;
$$;

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;

create policy profiles_update_own
	on public.profiles
	for update
	to authenticated
	using (id = auth.uid())
	with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (
	first_name,
	last_name,
	phone,
	date_of_birth,
	wedding_anniversary,
	spouse_name
) on public.profiles to authenticated;

create or replace function public.admin_update_member(
	p_member_id uuid,
	p_role public.member_role,
	p_membership_status public.membership_status
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
	current_profile public.profiles;
	updated_profile public.profiles;
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

	perform set_config('app.allow_member_privilege_update', 'on', true);

	update public.profiles
	set
		role = p_role,
		membership_status = p_membership_status,
		joined_at = case
			when p_membership_status = 'ACTIVE' and current_profile.joined_at is null then now()
			else current_profile.joined_at
		end
	where id = p_member_id
	returning * into updated_profile;

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
			'membership_status', current_profile.membership_status
		),
		jsonb_build_object(
			'role', updated_profile.role,
			'membership_status', updated_profile.membership_status
		)
	);

	return updated_profile;
end;
$$;

revoke all on function public.admin_update_member(uuid, public.member_role, public.membership_status) from public, anon;
grant execute on function public.admin_update_member(uuid, public.member_role, public.membership_status) to authenticated;
