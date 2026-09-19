-- In-app notices: members may mark their own rows as read.
-- Apply after 0013_full_year_dues_default.sql.

alter table public.notifications
	add column if not exists read_at timestamptz;

drop policy if exists notifications_update_own_read on public.notifications;
create policy notifications_update_own_read
	on public.notifications
	for update
	to authenticated
	using (member_id = auth.uid())
	with check (member_id = auth.uid());

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

notify pgrst, 'reload schema';
