# Supabase setup

The app cannot create the hosted Supabase project for you. Do these steps, then tell the agent you are done.

## 1. Create the project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Save the database password in a password manager

## 2. Copy API keys into `.env.local`

From **Project Settings → API**:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

Use the real port the Next.js app is running on (this project commonly uses `3002`). Never put the service-role key in a `NEXT_PUBLIC_*` variable.

Restart the Next.js process after saving `.env.local` (for example `npx next dev -p 3002`).

## 3. Apply the database schema

In the Supabase SQL editor, paste and run:

`supabase/migrations/0001_init.sql`

Then apply:

`supabase/migrations/0002_member_management.sql`

Then apply:

`supabase/migrations/0003_profile_directory_fields.sql`

Then apply:

`supabase/migrations/0004_birthday_month_day.sql`

Then apply:

`supabase/migrations/0005_dues_payments.sql`

Then apply:

`supabase/migrations/0006_events_admin.sql`

Then apply:

`supabase/migrations/0007_admin_record_payment.sql`

Then apply:

`supabase/migrations/0008_member_invites.sql`

Then apply:

`supabase/migrations/0009_dues_year_ledger.sql`

Then apply:

`supabase/migrations/0010_repair_dues_writes.sql`

Then apply:

`supabase/migrations/0011_member_join_month.sql`

Then apply:

`supabase/migrations/0012_admin_member_record.sql`

Then apply:

`supabase/migrations/0013_full_year_dues_default.sql`

Then apply:

`supabase/migrations/0014_in_app_notifications.sql`

Then apply:

`supabase/migrations/0015_fix_month_celebrants.sql`

Then apply:

`supabase/migrations/0016_fix_dues_start_ambiguity.sql`

Then apply:

`supabase/migrations/0017_repair_member_invites.sql`

Then apply:

`supabase/migrations/0018_mark_invites_accepted.sql`

Then apply:

`supabase/migrations/0019_prevent_admin_deactivation.sql`

Then apply:

`supabase/migrations/0020_member_photos.sql`

Then apply:

`supabase/migrations/0021_member_anniversary_photos.sql`

The first file creates tables, RLS, the pending-member signup trigger, and the private `payment-evidence` bucket. The second file adds own-profile update access, blocks unaudited role changes, and adds `admin_update_member`. The third file adds department, occupation, and address on `profiles`. The fourth file stores birthday as day and month only, with no birth year. The fifth file adds dues generation, member payment submission, audited confirmation, and payment-account settings. The sixth file constrains stored event types and adds audited admin event functions. The seventh file lets administrators record received transfers against whole months and revokes member payment submission. The eighth file adds Google member invitations and this-month celebrant listing. The ninth file opens dues from January 2026 through the current month so the Payments ledger can match the Excel working book. The tenth file allows those audited functions to insert and update dues under forced RLS, and reloads the API schema. The eleventh file lets administrators set the first dues month so a new member is not charged for months before they joined. The twelfth file lets administrators correct another member's directory fields. The thirteenth file defaults dues to a full year from January 2026 and creates missing months when that start is moved earlier. The fourteenth file lets members mark their own notices as read. The fifteenth file returns profile birthday and anniversary months as integers and lists a chosen month so this month and next month can both be shown. The sixteenth file fixes payment-start updates that failed with an ambiguous `due_month` name inside `apply_member_dues_start`. The seventeenth file restores `admin_create_member_invite` where it was missing and keeps open invites resendable. The eighteenth file ensures invites are marked accepted when a brother joins, and clears already-joined invites. The nineteenth file blocks an administrator from changing their own role or membership status, and requires an administrator to be made a member before the account can be disabled. The twentieth file adds a private portrait path and the `member-photos` bucket, and includes that path on celebration lists. The twenty-first file adds a separate private couple-photo path and returns it for wedding-anniversary celebrations. Prayer meeting dates stay calculated in the application.

## 4. Enable Google Auth

1. In Google Cloud, create an OAuth client (Web application)
2. Add authorised redirect URI:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

3. In Supabase: **Authentication → Providers → Google**
4. Paste the Google Client ID and Client Secret
5. In Supabase URL configuration, set **Site URL** to your app origin:
   - Local: `http://localhost:3002`
   - Production: the same value as `NEXT_PUBLIC_SITE_URL` (custom domain or `https://*.vercel.app`)
6. Add redirect URLs:

```text
http://localhost:3002/auth/callback
https://YOUR_PRODUCTION_HOST/auth/callback
```

7. In **Authentication → Providers → Email**, enable Email. Keep public sign-ups disabled if the dashboard allows it; invited passwords are created by the application through the service role after an administrator invite. Do not store passwords in application tables.

## Production cutover (hosted project)

Before sending brothers to the Vercel URL:

1. Confirm migrations **0001** through **0018** have been applied on the live project (re-run is safe for the repair migrations when unsure).
2. Especially apply `0016`, `0017`, and `0018` if payment-start updates still fail with `42702`, invites cannot be created, or accepted invites stay open.
3. Set Supabase **Site URL** and redirect URLs to the production site (above).
4. Confirm Google Cloud OAuth still lists `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
5. Confirm RLS remains enabled on member tables; never put the service-role key in a `NEXT_PUBLIC_*` variable.
6. Follow the Vercel env and smoke checklist in `docs/deployment.md`.

## 5. Bootstrap the first admin

Google sign-in creates a **PENDING** member. That is intentional.

After you sign in once, run this in the SQL editor, using your Google email:

```sql
update public.profiles
set
	role = 'ADMIN',
	membership_status = 'ACTIVE',
	joined_at = now()
where email = 'your-google-email@example.com';
```

Do not leave that email as `your-google-email@example.com`.

## 6. Tell the agent

When the four environment variables are in `.env.local` and the SQL has been applied, say so. Do not paste the service-role key into chat.
