# Gideon's Army Men's Fellowship

Membership, dues, and fellowship management for **Gideon's Army Men's Fellowship**, RCCG Living Water Parish, Stoke-on-Trent.

This is a rewrite. The previous Google Sheets / NextAuth application has been removed. Follow `AGENTS.md`.

## Stack

- Next.js and TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, and Storage
- Zod
- Vitest and Playwright

## Setup

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

## Current status

Payments, invitations, celebrations, and production cutover docs.

Administrators record received dues against whole months. Members see bank details and whether they are owing or up to date. Apply Supabase migrations through `0018_mark_invites_accepted.sql` (see `docs/supabase-setup.md`). Production hosting steps are in `docs/deployment.md`.

## Documentation

See `docs/` for architecture, database, security, authentication, deployment, operations, and privacy.
