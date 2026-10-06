# Operations

## Local development

```bash
npm install
cp .env.example .env.local
npx next dev -p 3002
```

Open [http://localhost:3002](http://localhost:3002).

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

After Google sign-in works, apply `0001_init.sql` through `0018_mark_invites_accepted.sql` in the SQL editor (see `docs/supabase-setup.md`). Promote the first administrator with the update in that doc. Later members are invited and approved in the app at `/admin/members`. Current-month dues are created when an approved member opens Dues or an administrator opens Payments. Generation is idempotent. Prayer meetings are calculated, not generated as database rows.

If payment-start updates fail with PostgreSQL `42702` (ambiguous `due_month`), apply `0016_fix_dues_start_ambiguity.sql` on the hosted project.

## Jobs

Notification sending, dues generation, and reminder schedules must be idempotent. Duplicate execution must not create duplicate notifications or duplicate dues rows.

The daily general route is `GET` or `POST` `/api/jobs/notifications`. Birthday and wedding-anniversary emails use `GET` or `POST` `/api/jobs/celebrations`; Vercel calls that endpoint at 05:00 and 06:00 UTC, and it sends only during the Europe/London 06:00–06:59 hour (to account for GMT/BST).

On Vercel, `vercel.json` schedules these jobs. Production must set `CRON_SECRET` in Vercel environment variables. Requests without the bearer token must receive `401`.

Use keys such as:

- `dues_reminder:{member_id}:{YYYY-MM-01}`
- `birthday:{member_id}:{year}`
- `birthday-fellowship:{member_id}:{year}:{recipient_id}`
- `anniversary:{member_id}:{year}`
- `anniversary-fellowship:{member_id}:{year}:{recipient_id}`
- `event:{event_id}:2d:{member_id}`
- `event:{event_id}:2h:{member_id}`
- `celebration-digest:current:{YYYY-MM}:{member_id}`
- `celebration-digest:upcoming:{YYYY-MM}:{member_id}`
- `birthday:{member_id}:{year}:manual:{YYYY-MM-DD}`
- `anniversary:{member_id}:{year}:manual:{YYYY-MM-DD}`

Administrators can queue outstanding-dues reminders from Payments and manually retry celebration emails from Celebrations. The scheduled celebration job runs at 06:00 Europe/London time and sends birthday and wedding-anniversary email only on the celebration day: the celebrant receives a personal greeting, while every other active member receives a separate celebration email. The celebrant is excluded from that group email. In-app celebration notices list this month and next month from profile birthday and anniversary fields without sending extra email. Stored events and calculated prayer meetings notify two days before and two hours before.

Email delivery is configured with Gmail App Password (`EMAIL_MODE=gmail`), or `EMAIL_MODE=console` for terminal-only testing. See `docs/email.md`.

## Production runbook (short)

1. Confirm Vercel env vars match `docs/deployment.md`
2. Confirm Supabase migrations through `0018` are applied
3. Confirm Google OAuth redirect and Supabase Site URL match production
4. After deploy, run the smoke checklist in `docs/deployment.md`
5. If cron misbehaves, verify `CRON_SECRET` and Vercel Cron logs for both `/api/jobs/notifications` and `/api/jobs/celebrations`.

## Time

Fellowship-facing times use `Europe/London`, including UK daylight saving time.
