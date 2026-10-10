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

Two daily runs share one idempotent routine (`runDailyJobs`): the morning run at `/api/jobs/celebrations` (06:00 UTC) and the evening run at `/api/jobs/notifications` (18:00 UTC). Both accept `GET` or `POST`. The evening run is a same-day safety net for anything the morning run missed. This fits the Vercel Hobby plan, which runs cron jobs at most once a day and only to the hour; see `docs/deployment.md`.
Each run checks the Europe/London calendar date. It queues monthly dues reminders on each month's last day (only for active members with outstanding dues), birthday and anniversary emails from 6am London time on the day, and event reminders two days before and on the day. It cancels same-day emails left pending from an earlier day rather than sending them late.

On Vercel, `vercel.json` schedules these jobs. Production must set `CRON_SECRET` in Vercel environment variables. Requests without the bearer token must receive `401`.

Use keys such as:

- `dues_reminder:{member_id}:{YYYY-MM-01}`
- `birthday:{member_id}:{year}`
- `birthday-fellowship:{member_id}:{year}:{recipient_id}`
- `anniversary:{member_id}:{year}`
- `anniversary-fellowship:{member_id}:{year}:{recipient_id}`
- `event:{event_id}:2d:{member_id}`
- `event:{event_id}:day:{member_id}`
- `celebration-digest:current:{YYYY-MM}:{member_id}`
- `celebration-digest:upcoming:{YYYY-MM}:{member_id}`
- `birthday:{member_id}:{year}:manual:{YYYY-MM-DD}`
- `anniversary:{member_id}:{year}:manual:{YYYY-MM-DD}`

Administrators can queue outstanding-dues reminders from Payments and manually retry celebration emails from Celebrations. Scheduled birthday and wedding-anniversary email goes out from 6am Europe/London time, only on the celebration day: the celebrant receives a personal greeting, while every other active member receives a separate celebration email. The celebrant is excluded from that group email. In-app celebration notices list this month and next month from profile birthday and anniversary fields without sending extra email. Stored events and calculated prayer meetings notify two days before and on the morning of the day. (A two-hour reminder is not possible with once-a-day cron jobs on the Hobby plan.)

Email delivery is configured with Gmail App Password (`EMAIL_MODE=gmail`), or `EMAIL_MODE=console` for terminal-only testing. See `docs/email.md`.

## Production runbook (short)

1. Confirm Vercel env vars match `docs/deployment.md`
2. Confirm Supabase migrations through `0018` are applied
3. Confirm Google OAuth redirect and Supabase Site URL match production
4. After deploy, run the smoke checklist in `docs/deployment.md`
5. If cron misbehaves, verify `CRON_SECRET` is set for **Production** (Vercel sends it automatically as a bearer token; without it every run returns 401), then check the Vercel logs for both `/api/jobs/celebrations` and `/api/jobs/notifications`. Each run logs `jobs.daily.morning` or `jobs.daily.evening` and returns `sent`, `failed`, `deferred` and `cancelled` counts.

## Time

Fellowship-facing times use `Europe/London`, including UK daylight saving time.
