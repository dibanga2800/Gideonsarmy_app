-- Optional private portrait for birthday and anniversary lists.
-- Apply after 0019_prevent_admin_deactivation.sql.

alter table public.profiles
	add column if not exists photo_storage_path text;

alter table public.profiles
	drop constraint if exists profiles_photo_path_shape;

alter table public.profiles
	add constraint profiles_photo_path_shape check (
		photo_storage_path is null
		or (
			split_part(photo_storage_path, '/', 1) = id::text
			and photo_storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
		)
	);

grant update (photo_storage_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'member-photos',
	'member-photos',
	false,
	1048576,
	array['image/jpeg']
)
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists member_photos_select_own on storage.objects;
drop policy if exists member_photos_insert_own on storage.objects;
drop policy if exists member_photos_delete_own on storage.objects;

create policy member_photos_select_own
	on storage.objects
	for select
	to authenticated
	using (
		bucket_id = 'member-photos'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy member_photos_insert_own
	on storage.objects
	for insert
	to authenticated
	with check (
		bucket_id = 'member-photos'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy member_photos_delete_own
	on storage.objects
	for delete
	to authenticated
	using (
		bucket_id = 'member-photos'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

drop function if exists public.list_month_celebrants(integer);

create or replace function public.list_month_celebrants(p_month integer default null)
returns table (
	id uuid,
	first_name text,
	last_name text,
	birth_month integer,
	birth_day integer,
	anniversary_month integer,
	anniversary_day integer,
	spouse_name text,
	photo_storage_path text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
	target_month integer := coalesce(
		p_month,
		extract(month from timezone('Europe/London', now()))::integer
	);
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_active_member() and not public.is_admin() then
		raise exception 'Only an approved member can view celebrations';
	end if;

	if target_month < 1 or target_month > 12 then
		raise exception 'Invalid celebration month';
	end if;

	return query
	select
		profiles.id,
		profiles.first_name,
		profiles.last_name,
		profiles.birth_month::integer,
		profiles.birth_day::integer,
		case
			when profiles.wedding_anniversary is null then null
			else extract(month from profiles.wedding_anniversary)::integer
		end,
		case
			when profiles.wedding_anniversary is null then null
			else extract(day from profiles.wedding_anniversary)::integer
		end,
		profiles.spouse_name,
		profiles.photo_storage_path
	from public.profiles
	where profiles.membership_status = 'ACTIVE'
		and (
			profiles.birth_month = target_month
			or (
				profiles.wedding_anniversary is not null
				and extract(month from profiles.wedding_anniversary)::integer = target_month
			)
		);
end;
$$;

revoke all on function public.list_month_celebrants(integer) from public, anon;
grant execute on function public.list_month_celebrants(integer) to authenticated;
