-- Member invites (Google sign-in, not passwords). Apply after 0007.

create table public.member_invites (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	first_name text,
	last_name text,
	invited_by uuid not null references public.profiles (id),
	accepted_at timestamptz,
	created_at timestamptz not null default now(),
	constraint member_invites_email_len check (char_length(email) <= 254)
);

create unique index member_invites_email_idx
	on public.member_invites (lower(email));

alter table public.member_invites enable row level security;
alter table public.member_invites force row level security;

create policy member_invites_admin_select
	on public.member_invites
	for select
	to authenticated
	using (public.is_admin());

revoke all on public.member_invites from anon, authenticated;
grant select on public.member_invites to authenticated;

create or replace function public.admin_create_member_invite(
	p_email text,
	p_first_name text,
	p_last_name text
)
returns public.member_invites
language plpgsql
security definer
set search_path = public
as $$
declare
	invite_email text := lower(nullif(trim(p_email), ''));
	given_name text := nullif(trim(coalesce(p_first_name, '')), '');
	family_name text := nullif(trim(coalesce(p_last_name, '')), '');
	created public.member_invites;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can invite a member';
	end if;

	if invite_email is null or invite_email !~ '^[^@]+@[^@]+\.[^@]+$' or char_length(invite_email) > 254 then
		raise exception 'Enter a valid email address';
	end if;

	if given_name is not null and char_length(given_name) > 80 then
		raise exception 'Enter a valid first name';
	end if;

	if family_name is not null and char_length(family_name) > 80 then
		raise exception 'Enter a valid last name';
	end if;

	if exists (select 1 from public.profiles where lower(email) = invite_email) then
		raise exception 'A member with that email already exists';
	end if;

	insert into public.member_invites (
		email,
		first_name,
		last_name,
		invited_by
	)
	values (
		invite_email,
		given_name,
		family_name,
		auth.uid()
	)
	returning * into created;

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
		'member.invite',
		'member_invites',
		created.id,
		null,
		jsonb_build_object('email_domain', split_part(created.email, '@', 2))
	);

	return created;
end;
$$;

revoke all on function public.admin_create_member_invite(text, text, text) from public, anon;
grant execute on function public.admin_create_member_invite(text, text, text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	given_name text;
	family_name text;
	full_name text;
	invite public.member_invites;
begin
	given_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'given_name', '')), '');
	family_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'family_name', '')), '');
	full_name := nullif(trim(coalesce(
		new.raw_user_meta_data ->> 'full_name',
		new.raw_user_meta_data ->> 'name',
		''
	)), '');

	if given_name is null and full_name is not null then
		given_name := split_part(full_name, ' ', 1);
		family_name := nullif(trim(substr(full_name, length(given_name) + 1)), '');
	end if;

	select *
	into invite
	from public.member_invites
	where lower(email) = lower(coalesce(new.email, ''))
	limit 1;

	if found then
		given_name := coalesce(nullif(trim(coalesce(invite.first_name, '')), ''), given_name);
		family_name := coalesce(nullif(trim(coalesce(invite.last_name, '')), ''), family_name);
		update public.member_invites
		set accepted_at = now()
		where id = invite.id
			and accepted_at is null;
	end if;

	insert into public.profiles (
		id,
		email,
		first_name,
		last_name,
		role,
		membership_status
	)
	values (
		new.id,
		coalesce(new.email, ''),
		coalesce(given_name, 'Member'),
		coalesce(family_name, 'Pending'),
		'MEMBER',
		'PENDING'
	)
	on conflict (id) do nothing;

	return new;
end;
$$;

create or replace function public.list_month_celebrants()
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
	london_month integer := extract(month from timezone('Europe/London', now()))::integer;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_active_member() and not public.is_admin() then
		raise exception 'Only an approved member can view celebrations';
	end if;

	return query
	select
		profiles.id,
		profiles.first_name,
		profiles.last_name,
		profiles.birth_month,
		profiles.birth_day,
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
			profiles.birth_month = london_month
			or (
				profiles.wedding_anniversary is not null
				and extract(month from profiles.wedding_anniversary)::integer = london_month
			)
		);
end;
$$;

revoke all on function public.list_month_celebrants() from public, anon;
grant execute on function public.list_month_celebrants() to authenticated;
