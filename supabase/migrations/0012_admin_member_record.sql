-- Allow administrators to correct another member's directory fields.
-- Privilege columns stay blocked by grants and protect_profile_privileges.
-- Apply after 0011_member_join_month.sql.

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
	on public.profiles
	for update
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- apply_member_dues_start is only for admin_update_member. Members must not
-- be able to mark their own outstanding months as not applicable.
revoke all on function public.apply_member_dues_start(uuid, date) from public, anon, authenticated;

notify pgrst, 'reload schema';
