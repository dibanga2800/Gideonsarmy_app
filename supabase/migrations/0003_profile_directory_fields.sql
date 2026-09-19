-- Directory fields from the fellowship member record: department, occupation, address.
-- Amount paid, balance, and year belong in dues, not on profiles.
-- Apply after 0002_member_management.sql.

alter table public.profiles
	add column if not exists department text,
	add column if not exists occupation text,
	add column if not exists address text;

alter table public.profiles
	drop constraint if exists profiles_department_length;

alter table public.profiles
	add constraint profiles_department_length
	check (department is null or char_length(department) <= 80);

alter table public.profiles
	drop constraint if exists profiles_occupation_length;

alter table public.profiles
	add constraint profiles_occupation_length
	check (occupation is null or char_length(occupation) <= 80);

alter table public.profiles
	drop constraint if exists profiles_address_length;

alter table public.profiles
	add constraint profiles_address_length
	check (address is null or char_length(address) <= 200);

grant update (department, occupation, address) on public.profiles to authenticated;
