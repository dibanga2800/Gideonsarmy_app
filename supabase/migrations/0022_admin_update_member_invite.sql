create or replace function public.admin_update_member_invite(
	p_invite_id uuid,
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
	updated public.member_invites;
begin
	if auth.uid() is null then
		raise exception 'Not authenticated';
	end if;

	if not public.is_admin() then
		raise exception 'Only an administrator can edit an invitation';
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

	select *
	into existing
	from public.member_invites
	where id = p_invite_id
	for update;

	if not found or existing.accepted_at is not null then
		raise exception 'That invitation has already been used or no longer exists';
	end if;

	if exists (
		select 1
		from public.profiles
		where lower(email) = invite_email
	) or exists (
		select 1
		from public.member_invites
		where lower(email) = invite_email
			and id <> p_invite_id
	) then
		raise exception 'A member or invitation already uses that email address';
	end if;

	update public.member_invites
	set
		email = invite_email,
		first_name = given_name,
		last_name = family_name
	where id = p_invite_id
		and accepted_at is null
	returning * into updated;

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
		'member.invite.update',
		'member_invites',
		updated.id,
		jsonb_build_object(
			'email_domain', split_part(existing.email, '@', 2),
			'email_changed', existing.email is distinct from updated.email,
			'first_name_changed', existing.first_name is distinct from updated.first_name,
			'last_name_changed', existing.last_name is distinct from updated.last_name
		),
		jsonb_build_object(
			'email_domain', split_part(updated.email, '@', 2),
			'email_changed', existing.email is distinct from updated.email,
			'first_name_changed', existing.first_name is distinct from updated.first_name,
			'last_name_changed', existing.last_name is distinct from updated.last_name
		)
	);

	return updated;
exception
	when unique_violation then
		raise exception 'A member or invitation already uses that email address'
			using errcode = '23505';
end;
$$;

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
	invite_email text := lower(nullif(trim(coalesce(new.email, '')), ''));
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

	if invite_email is not null then
		select *
		into invite
		from public.member_invites
		where lower(email) = invite_email
		limit 1
		for update;

		if found then
			given_name := coalesce(nullif(trim(coalesce(invite.first_name, '')), ''), given_name);
			family_name := coalesce(nullif(trim(coalesce(invite.last_name, '')), ''), family_name);

			update public.member_invites
			set accepted_at = coalesce(accepted_at, now())
			where id = invite.id;
		end if;
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

revoke all on function public.admin_update_member_invite(uuid, text, text, text) from public, anon;
grant execute on function public.admin_update_member_invite(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
