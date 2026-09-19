# Architecture

## Assessment of the previous application

The previous implementation used NextAuth credentials, Google Sheets as the database, Bootstrap, Nodemailer/Gmail, and hardcoded admin credentials. That stack cannot meet the security, authorization, and data-integrity requirements in `AGENTS.md`.

It was removed in Phase 1. Kept from the old repository:

- `AGENTS.md`
- git history
- `public/favicon.ico`

Replaced:

- Google Sheets → Supabase PostgreSQL with RLS
- NextAuth credentials → Supabase Auth with Google OAuth
- Bootstrap → Tailwind CSS
- Scattered API/UI data access → UI → server action/API → service → repository → Supabase

## Target stack

- TypeScript
- Next.js App Router
- React
- Tailwind CSS
- Zod
- Supabase Auth, PostgreSQL, Storage
- Vitest
- Playwright

## Layering

```text
UI
↓
Server Action / Route Handler
↓
Service
↓
Repository
↓
Supabase
```

Business rules must not live in React components. Database access must not be scattered across pages.

External data, including database rows, is validated with Zod before use. Invalid profiles are treated as unauthorised rather than trusted.

## Current phase

Payments, invitations, and celebrations after Phase 5.

Administrators record received bank transfers and allocate them to whole outstanding months for the year being viewed, including a full-year selection of every outstanding month. Unpaid months from an earlier year stay on that year and can be recorded by opening it; they are not added to a later year's outstanding total. Dues default to a full year from January 2026; an administrator may set a later payment start for a new member so earlier months are not billed. Administrators can correct another member's directory fields from the paper record. Members see whether they are owing or up to date for the selected year, birthdays and anniversaries from member profiles for this month and next month, and in-app celebration and event notices. Scheduled jobs send dues reminders on the 25th for the current year, birthday and anniversary emails on the day and seven days before, and event notices. Administrators invite brothers by email to sign in with Google or an invited password. Apply `0007_admin_record_payment.sql` through `0016_fix_dues_start_ambiguity.sql`.
