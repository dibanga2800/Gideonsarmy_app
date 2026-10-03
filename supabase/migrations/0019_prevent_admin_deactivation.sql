-- Administrators must be changed to MEMBER before they can be made inactive.
-- Apply after 0018_mark_invites_accepted.sql.

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

	if current_profile.role = 'ADMIN'
		and current_profile.membership_status <> 'INACTIVE'
		and p_role = 'ADMIN'
		and p_membership_status = 'INACTIVE'
	then
		raise exception 'Make the administrator a member before disabling the account';
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

notify pgrst, 'reload schema';