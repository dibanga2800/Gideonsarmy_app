# Deployment

Intended hosting is **Vercel** for the Next.js app and **Supabase** for database, auth, and storage.

Production email uses **Gmail App Password** (`EMAIL_MODE=gmail`).

## Pre-deploy quality gate

From the repo root:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Do not deploy until all four succeed.

Local development for this project commonly uses:

```bash
npx next dev -p 3002
```

(`npm run dev port 3002` fails because Next treats `port` as a project directory.)

## Environment variables

Copy `.env.example` to `.env.local` for local work. In **Vercel → Project → Settings → Environment Variables**, set the same keys for Production (and Preview if you use preview deploys).

### Required (browser-safe)

| Variable | Production value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://gideonsarmy.rccglivingwater.org` |

### Required (server-only — never `NEXT_PUBLIC_*`)

| Variable | Notes |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key; server / Vercel only |
| `CRON_SECRET` | Strong random secret; Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` |
| `EMAIL_MODE` | `resend` for production |
| `RESEND_API_KEY` | Server-only Resend API key |
| `FELLOWSHIP_EMAIL_FROM` | Sender on a verified Resend domain |

### Optional

| Variable | Notes |
| --- | --- |
| `GMAIL_USER` | Only needed when using the Gmail provider |
| `GMAIL_APP_PASSWORD` | Only needed when using the Gmail provider |

Generate a fresh `CRON_SECRET` for production, for example:

```bash
openssl rand -hex 32
```

See `docs/email.md` for Gmail App Password setup.

## Vercel

1. Import the Git repository into Vercel.
2. Set the environment variables above for Production.
3. Deploy. Framework preset: Next.js.
4. Confirm `vercel.json` schedules the morning and evening runs:

```json
{
  "crons": [
    {
      "path": "/api/jobs/celebrations",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/jobs/notifications",
      "schedule": "0 18 * * *"
    }
  ]
}
```

These schedules are designed for the Vercel **Hobby** plan, which allows cron jobs at most once a day each and only promises the hour, not the minute: a `0 6 * * *` job fires somewhere between 06:00 and 06:59 UTC. Nothing depends on landing in a particular minute or hour.

- **Morning run** (`/api/jobs/celebrations`, 06:00 UTC: 6–7am London in winter, 7–8am in summer) sends today's birthday and wedding-anniversary emails, "today" reminders for gatherings, "in two days" reminders, and dues reminders on the last day of the month.
- **Evening run** (`/api/jobs/notifications`, 18:00 UTC) does exactly the same work. Idempotency keys stop duplicates, so it only sends what the morning run missed, the same day.

Celebration emails are never sent before 6am London time. Same-day emails (celebrations, event and dues reminders) still pending from an earlier day are cancelled instead of being sent late. Each run sends for at most 45 seconds within its 60-second function limit; anything left waits for the next run that day.

### Manual cron smoke checks

Authorized (should return job JSON, not 401):

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://YOUR_SITE/api/jobs/notifications"
```

Unauthorized (must return `401`):

```bash
curl -sS -i "https://YOUR_SITE/api/jobs/notifications"
```

## Supabase before first production traffic

Apply migrations in order through **0021** in the SQL editor (see `docs/supabase-setup.md`). Especially if dues payment-start updates fail with PostgreSQL `42702`, apply:

- `0016_fix_dues_start_ambiguity.sql`
- `0017_repair_member_invites.sql`
- `0018_mark_invites_accepted.sql`
- `0019_prevent_admin_deactivation.sql`
- `0020_member_photos.sql`
- `0021_member_anniversary_photos.sql`

Confirm in the Supabase dashboard:

- Google Auth enabled
- Site URL = production `NEXT_PUBLIC_SITE_URL`
- Redirect URLs include `https://gideonsarmy.rccglivingwater.org/auth/callback`
- Keep `http://localhost:3002/auth/callback` for local development and the Vercel hostname callback if it is still used
- Email public sign-ups remain disabled (invites / admin create only)
- RLS enabled on member tables
- Service role key never exposed as `NEXT_PUBLIC_*`

## Google OAuth (production)

In Google Cloud OAuth client (Web application):

1. Authorised redirect URI: `https://{SUPABASE_REF}.supabase.co/auth/v1/callback`
2. Keep any local redirect URIs you still need for development

In Supabase **Authentication → URL configuration**:

1. **Site URL** = `https://gideonsarmy.rccglivingwater.org`
2. Additional redirect: `https://gideonsarmy.rccglivingwater.org/auth/callback`
3. Keep any required local-development or Vercel-hostname callbacks in the allow-list.

## Security headers

`next.config.mjs` already sets CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and frame protection. Tighten CSP only if production OAuth or assets prove a missing host.

## Post-deploy smoke checklist

1. Open the production site over HTTPS
2. Google sign-in completes and returns to `/auth/callback`
3. Invite a test email; invite appears under Members
4. Approve a pending member
5. Member can open Dashboard, Dues, Events, Celebrations
6. Admin can record a payment against outstanding months
7. Celebration / notice path works for an admin (manual send or Notices page)
8. Both `GET /api/jobs/notifications` and `GET /api/jobs/celebrations` return **401** without `CRON_SECRET`
9. With the cron authorization header, both routes return **200** with a JSON summary (`sent`, `failed`, `deferred`, `cancelled`, `celebrationsOpen`); repeated runs do not duplicate sent notifications.
10. In Vercel, **Project → Settings → Cron Jobs** lists both jobs, and each run appears in the project logs.

## Out of scope for the initial cutover

- Switching email provider to Resend
- Full Playwright e2e against production Google OAuth in CI
- Secret rotation beyond generating a fresh production `CRON_SECRET`
