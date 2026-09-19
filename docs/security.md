# Security

Security is a first-class requirement. The fellowship size does not reduce that requirement.

## Boundaries

- Browser never receives the service-role key, database credentials, or email secrets
- Frontend checks are not authorization
- RLS must prevent IDOR even if a URL is changed
- Validate all external input with Zod on the server
- Store money as integer pence
- Do not log tokens, cookies, bank details, payment evidence, or unnecessary personal data

## Headers

`next.config.mjs` sets:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- X-Frame-Options

The CSP is a starting point for this stack. Tighten `script-src` after Google OAuth and production hosting domains are confirmed. Do not copy a CSP from another application without reviewing it.

## Secrets

Use `.env.local`. Never commit `.env`, service-account files, or credentials JSON.

Review every `NEXT_PUBLIC_*` variable before exposing it.

## Member privileges

Users cannot change their own role or membership status. Authenticated members may update only their own contact and personal-date fields. Administrators may update another member's directory fields; that path cannot write role, membership status, or payment start. Role, membership-status, and payment-start changes must go through `admin_update_member`; a database trigger rejects privilege columns on a normal `UPDATE`. The function is the only application path that writes the matching audit row. Dues default to a full year from January 2026; a later start is an administrator override.

Members cannot mark dues as confirmed or change `amount_paid_pence`. Payment recording and leftover submitted-row confirmation go through `admin_record_payment` and `admin_review_payment`. Dues insert and update stay revoked for the authenticated role; `0010_repair_dues_writes.sql` adds RLS policies so those audited functions can write under `FORCE ROW LEVEL SECURITY`. Bank account details live in `app_settings` and are shown only to approved members, never through `NEXT_PUBLIC_*` variables.

Members may read stored events. They cannot insert, update, or delete event rows. Administrators manage gatherings through `admin_create_event`, `admin_update_event`, and `admin_delete_event`. The monthly prayer meeting is calculated in application code and is not written to `events`.

Scheduled notification jobs require `Authorization: Bearer CRON_SECRET`. Emails are sent from the server with Gmail App Password credentials (`EMAIL_MODE=gmail`) that are never exposed to the browser. Celebration emails do not include birth years, phone numbers, or other members' dues. Celebrant names are not shown on the signed-out home page.
