# Authentication

Use Supabase Auth. Approved members may sign in with:

- Google OAuth, or
- email and password, after an administrator invitation (for brothers who do not have Gmail)

Passwords are stored by Supabase Auth, not in application tables. Do not use NextAuth credentials or a local password hash.

## Flow

1. An administrator invites the brother's email
2. He either signs in with Google, or creates a password at `/signup` using the invited email
3. A Supabase session is established
4. The matching `profiles` row is loaded
5. Access is granted only if membership is `ACTIVE`

A valid Google account or password is not fellowship membership. New users are created as `MEMBER` with `PENDING` status by a database trigger on `auth.users`.

## Application routes

- `/login` — Google sign-in, or email and password
- `/signup` — invited members create a password
- `/auth/callback` — exchange the OAuth code for a session
- `/pending` — signed in, but not an approved member
- `/dashboard` — approved members only
- `/profile` — own profile (approved members, and pending members completing an invite)
- `/dues` — own dues history and whether the member is owing or up to date
- `/events` — upcoming prayer meetings and stored gatherings, with ICS and Google Calendar links
- `/celebrations` — birthdays and wedding anniversaries from member profiles for this month and next month
- `/notifications` — in-app birthday, anniversary, and event notices
- `/admin/members` — administrators only, including invitations
- `/admin/payments` — record received transfers, leftover submitted reviews, and account details
- `/admin/events/new` — create a stored gathering
- `/admin/events/[id]` — edit or delete a stored gathering
- `/api/jobs/notifications` and `/api/jobs/celebrations` — secret-protected scheduled jobs

Authorization is enforced in middleware, page loaders, and RLS.

## Roles

- `MEMBER` — own profile, own dues, events, this month and next month's celebrants, in-app notices
- `ADMIN` — member administration and invitations, dues recording, events, announcements, audit logs

Users cannot change their own role. Role and membership-status changes are performed through `admin_update_member`, which also writes an audit record. Application checks, RLS, and a database trigger all prevent self-escalation. Directory corrections by an administrator do not change role, status, or payment start.

See `docs/supabase-setup.md` for the hosted project steps that must be done in the dashboard.
