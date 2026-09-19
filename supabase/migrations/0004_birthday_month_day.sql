-- Birthday is day and month only. Age is not recorded.
-- Apply after 0003_profile_directory_fields.sql.

alter table public.profiles
	add column if not exists birth_month smallint,
	add column if not exists birth_day smallint;

update public.profiles
set
	birth_month = extract(month from date_of_birth)::smallint,
	birth_day = extract(day from date_of_birth)::smallint
where date_of_birth is not null
	and birth_month is null
	and birth_day is null;

alter table public.profiles
	drop constraint if exists profiles_birthday_pair;

alter table public.profiles
	add constraint profiles_birthday_pair
	check ((birth_month is null) = (birth_day is null));

alter table public.profiles
	drop constraint if exists profiles_birthday_valid;

alter table public.profiles
	add constraint profiles_birthday_valid
	check (
		birth_month is null
		or (
			birth_month between 1 and 12
			and birth_day between 1 and 31
			and birth_day <= extract(
				day from (
					date_trunc('month', make_date(2000, birth_month, 1))
					+ interval '1 month - 1 day'
				)
			)::integer
		)
	);

grant update (birth_month, birth_day) on public.profiles to authenticated;
revoke update (date_of_birth) on public.profiles from authenticated;

alter table public.profiles
	drop column if exists date_of_birth;
