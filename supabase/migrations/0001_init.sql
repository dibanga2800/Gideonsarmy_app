-- Apply this after creating the Supabase project.
-- RLS is enabled and forced on every member-data table.

create extension if not exists pgcrypto;

create type public.member_role as enum ('MEMBER', 'ADMIN');
create type public.membership_status as enum ('PENDING', 'ACTIVE', 'INACTIVE');
create type public.dues_status as enum (
	'OUTSTANDING',
	'PAYMENT_SUBMITTED',
	'CONFIRMED',
	'WAIVED',
	'NOT_APPLICABLE'
);
create type public.payment_submission_status as enum ('SUBMITTED', 'CONFIRMED', 'REJECTED');
create type public.notification_status as enum ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	email text not null unique,
	first_name text not null,
	last_name text not null,
	phone text,
	date_of_birth date,
	wedding_anniversary date,
	spouse_name text,
	role public.member_role not null default 'MEMBER',
	membership_status public.membership_status not null default 'PENDING',
	joined_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.dues (
	id uuid primary key default gen_random_uuid(),
	member_id uuid not null references public.profiles (id) on delete cascade,
	due_month date not null,
	amount_due_pence integer not null check (amount_due_pence >= 0),
	amount_paid_pence integer not null default 0 check (amount_paid_pence >= 0),
	status public.dues_status not null default 'OUTSTANDING',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (member_id, due_month),
	check (due_month = date_trunc('month', due_month)::date)
);

create table public.payment_submissions (
	id uuid primary key default gen_random_uuid(),
	dues_id uuid not null references public.dues (id) on delete restrict,
	member_id uuid not null references public.profiles (id) on delete cascade,
	amount_pence integer not null check (amount_pence > 0),
	payment_date date not null,
	transaction_reference text not null,
	notes text,
	status public.payment_submission_status not null default 'SUBMITTED',
	submitted_at timestamptz not null default now(),
	reviewed_at timestamptz,
	reviewed_by uuid references public.profiles (id),
	reviewer_note text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.payment_evidence (
	id uuid primary key default gen_random_uuid(),
	payment_submission_id uuid not null references public.payment_submissions (id) on delete cascade,
	member_id uuid not null references public.profiles (id) on delete cascade,
	storage_path text not null unique,
	original_filename text not null,
	mime_type text not null,
	file_size integer not null check (file_size > 0),
	created_at timestamptz not null default now()
);

create table public.events (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	description text,
	event_type text not null,
	start_at timestamptz not null,
	end_at timestamptz,
	is_recurring boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.notifications (
	id uuid primary key default gen_random_uuid(),
	member_id uuid not null references public.profiles (id) on delete cascade,
	notification_type text not null,
	title text not null,
	message text not null,
	scheduled_at timestamptz not null,
	sent_at timestamptz,
	status public.notification_status not null default 'PENDING',
	idempotency_key text not null unique,
	created_at timestamptz not null default now()
);

create table public.announcements (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	body text not null,
	published_at timestamptz,
	published_by uuid references public.profiles (id),
	expires_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.audit_logs (
	id uuid primary key default gen_random_uuid(),
	actor_id uuid references public.profiles (id),
	action text not null,
	entity_type text not null,
	entity_id uuid,
	old_data jsonb,
	new_data jsonb,
	created_at timestamptz not null default now()
);

create table public.app_settings (
	key text primary key,
	value jsonb not null,
	updated_at timestamptz not null default now(),
	updated_by uuid references public.profiles (id)
);

create index dues_member_id_idx on public.dues (member_id);
create index payment_submissions_member_id_idx on public.payment_submissions (member_id);
create index payment_submissions_dues_id_idx on public.payment_submissions (dues_id);
create index notifications_member_id_idx on public.notifications (member_id);
create index profiles_membership_status_idx on public.profiles (membership_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger profiles_set_updated_at
	before update on public.profiles
	for each row execute function public.set_updated_at();

create trigger dues_set_updated_at
	before update on public.dues
	for each row execute function public.set_updated_at();

create trigger payment_submissions_set_updated_at
	before update on public.payment_submissions
	for each row execute function public.set_updated_at();

create trigger events_set_updated_at
	before update on public.events
	for each row execute function public.set_updated_at();

create trigger announcements_set_updated_at
	before update on public.announcements
	for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
	before update on public.app_settings
	for each row execute function public.set_updated_at();

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

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles
		where id = auth.uid()
			and membership_status = 'ACTIVE'
	);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles
		where id = auth.uid()
			and role = 'ADMIN'
			and membership_status = 'ACTIVE'
	);
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
as $$
begin
	if new.role is distinct from old.role and not public.is_admin() then
		raise exception 'Role changes must be performed by an administrator';
	end if;

	if new.membership_status is distinct from old.membership_status and not public.is_admin() then
		raise exception 'Membership status changes must be performed by an administrator';
	end if;

	return new;
end;
$$;

create trigger profiles_protect_privileges
	before update on public.profiles
	for each row execute function public.protect_profile_privileges();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.dues enable row level security;
alter table public.dues force row level security;
alter table public.payment_submissions enable row level security;
alter table public.payment_submissions force row level security;
alter table public.payment_evidence enable row level security;
alter table public.payment_evidence force row level security;
alter table public.events enable row level security;
alter table public.events force row level security;
alter table public.notifications enable row level security;
alter table public.notifications force row level security;
alter table public.announcements enable row level security;
alter table public.announcements force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;
alter table public.app_settings enable row level security;
alter table public.app_settings force row level security;

create policy profiles_select_own_or_admin
	on public.profiles
	for select
	to authenticated
	using (id = auth.uid() or public.is_admin());

create policy dues_select_own_or_admin
	on public.dues
	for select
	to authenticated
	using (member_id = auth.uid() or public.is_admin());

create policy payment_submissions_select_own_or_admin
	on public.payment_submissions
	for select
	to authenticated
	using (member_id = auth.uid() or public.is_admin());

create policy payment_submissions_insert_own
	on public.payment_submissions
	for insert
	to authenticated
	with check (
		member_id = auth.uid()
		and public.is_active_member()
		and status = 'SUBMITTED'
	);

create policy payment_evidence_select_own_or_admin
	on public.payment_evidence
	for select
	to authenticated
	using (member_id = auth.uid() or public.is_admin());

create policy payment_evidence_insert_own
	on public.payment_evidence
	for insert
	to authenticated
	with check (
		member_id = auth.uid()
		and public.is_active_member()
	);

create policy events_select_active_members
	on public.events
	for select
	to authenticated
	using (public.is_active_member() or public.is_admin());

create policy announcements_select_published
	on public.announcements
	for select
	to authenticated
	using (
		(
			published_at is not null
			and (expires_at is null or expires_at > now())
			and public.is_active_member()
		)
		or public.is_admin()
	);

create policy notifications_select_own
	on public.notifications
	for select
	to authenticated
	using (member_id = auth.uid() or public.is_admin());

create policy app_settings_select_active_members
	on public.app_settings
	for select
	to authenticated
	using (public.is_active_member() or public.is_admin());

create policy audit_logs_admin_select
	on public.audit_logs
	for select
	to authenticated
	using (public.is_admin());

revoke all on public.profiles from anon, authenticated;
revoke all on public.dues from anon, authenticated;
revoke all on public.payment_submissions from anon, authenticated;
revoke all on public.payment_evidence from anon, authenticated;
revoke all on public.events from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.announcements from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
revoke all on public.app_settings from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.dues to authenticated;
grant select, insert on public.payment_submissions to authenticated;
grant select, insert on public.payment_evidence to authenticated;
grant select on public.events to authenticated;
grant select on public.notifications to authenticated;
grant select on public.announcements to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.app_settings to authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_member() to authenticated;

insert into storage.buckets (id, name, public)
values ('payment-evidence', 'payment-evidence', false)
on conflict (id) do update set public = excluded.public;

create policy payment_evidence_storage_select
	on storage.objects
	for select
	to authenticated
	using (
		bucket_id = 'payment-evidence'
		and (
			(storage.foldername(name))[1] = auth.uid()::text
			or public.is_admin()
		)
	);

create policy payment_evidence_storage_insert
	on storage.objects
	for insert
	to authenticated
	with check (
		bucket_id = 'payment-evidence'
		and (storage.foldername(name))[1] = auth.uid()::text
		and public.is_active_member()
	);

insert into public.app_settings (key, value)
values
	('monthly_dues_pence', '1000'::jsonb),
	('prayer_meeting_hour', '20'::jsonb),
	('prayer_meeting_timezone', '"Europe/London"'::jsonb)
on conflict (key) do nothing;
