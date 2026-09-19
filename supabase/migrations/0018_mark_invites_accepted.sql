-- Ensure signup marks invites accepted, and clear invites already joined.

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
		limit 1;

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

update public.member_invites as invites
set accepted_at = coalesce(invites.accepted_at, now())
from public.profiles as profiles
where lower(invites.email) = lower(profiles.email)
	and invites.accepted_at is null;

notify pgrst, 'reload schema';
