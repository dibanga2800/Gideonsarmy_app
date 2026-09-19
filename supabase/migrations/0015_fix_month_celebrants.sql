-- Fix list_month_celebrants: smallint columns must be returned as integer,
-- and allow a specific month so this month and next month can be listed.
-- Apply after 0014_in_app_notifications.sql.

drop function if exists public.list_month_celebrants();
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
	spouse_name text
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
		profiles.spouse_name
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

notify pgrst, 'reload schema';
