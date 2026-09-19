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
| `NEXT_PUBLIC_SITE_URL` | Production site URL, e.g. `https://your-domain` or `https://your-app.vercel.app` |

### Required (server-only — never `NEXT_PUBLIC_*`)

| Variable | Notes |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key; server / Vercel only |
| `CRON_SECRET` | Strong random secret; Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` |
| `EMAIL_MODE` | `gmail` for production |
| `GMAIL_USER` | Gmail address used to send mail |
| `GMAIL_APP_PASSWORD` | Google App Password (not the account password) |

### Optional

| Variable | Notes |
| --- | --- |
| `FELLOWSHIP_EMAIL_FROM` | Defaults to `GMAIL_USER` when empty |
| `RESEND_API_KEY` | Leave empty when using Gmail |

Generate a fresh `CRON_SECRET` for production, for example:

```bash
openssl rand -hex 32
```

See `docs/email.md` for Gmail App Password setup.

## Vercel

1. Import the Git repository into Vercel.
2. Set the environment variables above for Production.
3. Deploy. Framework preset: Next.js.
4. Confirm `vercel.json` is present so the hourly cron runs:

```json
{
  "crons": [
    {
      "path": "/api/jobs/notifications",
      "schedule": "0 * * * *"
    }
  ]
}
```

Vercel Cron calls `GET /api/jobs/notifications` hourly. The route requires `Authorization: Bearer CRON_SECRET` (Vercel injects this for configured crons when `CRON_SECRET` is set; for manual tests, send the header yourself).

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

Apply migrations in order through **0018** in the SQL editor (see `docs/supabase-setup.md`). Especially if dues payment-start updates fail with PostgreSQL `42702`, apply:

- `0016_fix_dues_start_ambiguity.sql`
- `0017_repair_member_invites.sql`
- `0018_mark_invites_accepted.sql`

Confirm in the Supabase dashboard:

- Google Auth enabled
- Site URL = production `NEXT_PUBLIC_SITE_URL`
- Redirect URLs include `{SITE_URL}/auth/callback`
- Email public sign-ups remain disabled (invites / admin create only)
- RLS enabled on member tables
- Service role key never exposed as `NEXT_PUBLIC_*`

## Google OAuth (production)

In Google Cloud OAuth client (Web application):

1. Authorised redirect URI: `https://{SUPABASE_REF}.supabase.co/auth/v1/callback`
2. Keep any local redirect URIs you still need for development

In Supabase **Authentication → URL configuration**:

1. **Site URL** = production `NEXT_PUBLIC_SITE_URL`
2. Additional redirect: `{SITE_URL}/auth/callback`

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
8. `GET /api/jobs/notifications` without `CRON_SECRET` returns **401**
9. With `Authorization: Bearer CRON_SECRET`, the job route returns **200** and does not duplicate dues/notifications on a second run

## Out of scope for the initial cutover

- Switching email provider to Resend
- Full Playwright e2e against production Google OAuth in CI
- Secret rotation beyond generating a fresh production `CRON_SECRET`
