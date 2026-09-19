# Database

PostgreSQL in Supabase is the source of truth.

Identifiers are UUIDs. Monetary values are integer pence. `£10` is stored as `1000`.

The initial schema is in `supabase/migrations/0001_init.sql`. Apply it from the Supabase SQL editor after the project exists.

## Tables

- `profiles` — one row per authenticated user; `id` matches `auth.users.id`. Directory fields include phone, department, occupation, address, birthday as day and month only, anniversary, and spouse name. Birth year is not stored. Amount paid, balance, and year are dues records, not profile columns.
- `dues` — unique `(member_id, due_month)`
- `payment_submissions` — recorded or legacy submitted bank-transfer confirmations
- `payment_evidence` — private storage metadata only
- `events` — stored gatherings only (`FELLOWSHIP`, `SPECIAL`, `OUTING`, `OTHER`). The monthly prayer meeting is calculated, not inserted.
- `notifications` — unique `idempotency_key`; members may update only `read_at` on their own rows
- `member_invites` — unique on `lower(email)`; Google or invited email-and-password sign-in
- `announcements`
- `audit_logs` — no secrets or unnecessary personal data
- `app_settings` — monthly dues amount, prayer time, payment instructions

## RLS

Every member-data table has RLS enabled in the initial migration.

Anonymous access is revoked. Members can read their own profile, dues, submissions, evidence, and notifications. Only active members can insert their own payment submissions in `SUBMITTED` status. Admins are determined server-side from `profiles.role`, not from a browser-supplied claim.

Role self-changes are blocked in the database trigger, the `admin_update_member` function, and application privilege checks. Members may update their own non-privileged profile fields. Administrators may update another member's directory fields under `profiles_update_admin`. Column-level grants prevent authenticated clients from writing `role` or `membership_status`. Admins update another member's role, membership status, and payment start through a single transactional function that also writes an audit record. A normal `UPDATE` of those columns is rejected unless that function has enabled the change for the current transaction.

Apply:

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_member_management.sql`
- `supabase/migrations/0003_profile_directory_fields.sql`
- `supabase/migrations/0004_birthday_month_day.sql`
- `supabase/migrations/0005_dues_payments.sql`
- `supabase/migrations/0006_events_admin.sql`
- `supabase/migrations/0007_admin_record_payment.sql`
- `supabase/migrations/0008_member_invites.sql`
- `supabase/migrations/0009_dues_year_ledger.sql`
- `supabase/migrations/0010_repair_dues_writes.sql`
- `supabase/migrations/0011_member_join_month.sql`
- `supabase/migrations/0012_admin_member_record.sql`
- `supabase/migrations/0013_full_year_dues_default.sql`
- `supabase/migrations/0014_in_app_notifications.sql`
- `supabase/migrations/0015_fix_month_celebrants.sql`
- `supabase/migrations/0016_fix_dues_start_ambiguity.sql`
- `supabase/migrations/0017_repair_member_invites.sql`
- `supabase/migrations/0018_mark_invites_accepted.sql`

Dues default to a full year from January 2026 (twelve months at the configured monthly amount, default 1000 pence, £120). Administrators may set a later payment start for a new member so earlier months are not billed; outstanding rows before that month are marked not applicable, and missing months from the start through the current Europe/London month are created. Outstanding is calculated for the year being viewed; unpaid months from an earlier year stay on that year and are not added to a later year. Administrators can open a previous year on the Payments ledger to record those months, including every outstanding month as a full-year payment. Future months in the current year are not treated as owing. Members see outstanding months and bank details only. `0010_repair_dues_writes.sql` adds insert/update policies so the audited dues functions can write while `FORCE ROW LEVEL SECURITY` is on. Authenticated clients still have no INSERT or UPDATE grant on `dues`. `0012_admin_member_record.sql` lets an administrator correct another member's directory fields and revokes direct execute on `apply_member_dues_start`.

Event rows may be selected by active members. Insert, update, and delete stay revoked; administrators create, update, and delete gatherings through `admin_create_event`, `admin_update_event`, and `admin_delete_event`. Those functions write an audit row with title, type, and start time only.

Approved members may execute `list_month_celebrants(p_month)`, which returns names and celebration dates only (no email, phone, or birth year) for a given month. Birthday comes from `profiles.birth_month` and `profiles.birth_day`; wedding anniversary comes from `profiles.wedding_anniversary`. Only `ACTIVE` members are listed. Administrators create Google invitations through `admin_create_member_invite`. `handle_new_user` copies invite names onto a `PENDING` profile.

## Storage

Payment evidence belongs in a private bucket. Do not use public object URLs. Downloads use short-lived signed URLs after authorisation. Storage paths use member and submission UUIDs plus a generated filename.
