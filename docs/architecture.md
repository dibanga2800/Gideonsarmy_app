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

Administrators record received bank transfers and allocate them to whole outstanding months for the year being viewed, including a full-year selection of every outstanding month. Unpaid months from an earlier year stay on that year and can be recorded by opening it; they are not added to a later year's outstanding total. Dues default to a full year from January 2026; an administrator may set a later payment start for a new member so earlier months are not billed. Administrators can correct another member's directory fields from the paper record. Members see whether they are owing or up to date for the selected year, birthdays and anniversaries from member profiles for this month and next month, and in-app celebration and event notices. Scheduled jobs send dues reminders to active members with outstanding dues on the last calendar day of each month, birthday and anniversary emails only on the day, and event notices. On a celebration day, the celebrant receives a personal greeting and other active members receive a separate message. Administrators invite brothers by email to sign in with Google or an invited password. Apply `0007_admin_record_payment.sql` through `0016_fix_dues_start_ambiguity.sql`.

## Interface structure

Approved members get an application frame with a fixed sidebar (a drawer on small screens) grouped into Fellowship, My account and Administration; administration links are shown only to administrators, and every route still enforces access on the server. Visitors and accounts awaiting approval get a lighter frame with a top bar. `src/components/app-shell.tsx` chooses the frame from the current session.

Shared presentation lives in `src/lib/ui.ts` (class strings for buttons, inputs, tables) and a small set of components: `PageHeader`, `SectionCard`, `HeroPanel` (the navy "lamplight" surface, at most one per page), `StatGroup` (related figures on one surface), `StatusBadge` (with dues, membership and payment variants), `EmptyState`, `StatusPage`, `DuesMonthStrip` (a member's twelve months at a glance) and `DateBlock`. Pages compose these rather than repeating utility classes. Icons are inline SVG in `src/components/icons.tsx`; no icon package is used.

Colour rule: gold appears only on navy surfaces. On white, navy is the accent and amber means money owed, nothing else. Text colours meet WCAG AA contrast; form field borders are at least 3:1.
