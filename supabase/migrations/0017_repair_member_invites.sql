-- Repair member invites RPC (missing in some environments) and keep invites upsertable.

create table if not exists public.member_invites (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	first_name text,
	last_name text,
	invited_by uuid not null references public.profiles (id),
	accepted_at timestamptz,
	created_at timestamptz not null default now(),
	constraint member_invites_email_len check (char_length(email) <= 254)
);

create unique index if not exists member_invites_email_idx
	on public.member_invites (lower(email));

alter table public.member_invites
	drop constraint if exists member_invites_email_unique;

alter table public.member_invites
	add constraint member_invites_email_unique unique (email);

alter table public.member_invites enable row level security;
alter table public.member_invites force row level security;

drop policy if exists member_invites_admin_select on public.member_invites;
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
	existing public.member_invites;
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

	select *
	into existing
	from public.member_invites
	where lower(email) = invite_email
	limit 1;

	if found then
		if existing.accepted_at is not null then
			raise exception 'That invitation has already been used';
		end if;

		update public.member_invites
		set
			first_name = coalesce(given_name, first_name),
			last_name = coalesce(family_name, last_name)
		where id = existing.id
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
			'member.invite.resend',
			'member_invites',
			created.id,
			null,
			jsonb_build_object('email_domain', split_part(created.email, '@', 2))
		);

		return created;
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

notify pgrst, 'reload schema';
