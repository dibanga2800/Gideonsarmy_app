# Email

Invitation and celebration emails are sent from the Next.js server through the
`EmailService` abstraction. Business logic never talks to Gmail or Resend
directly.

## Gmail (recommended for this fellowship)

1. Choose the Gmail account that should send fellowship mail
2. Turn on **2-Step Verification** for that Google account
3. Open [Google App Passwords](https://myaccount.google.com/apppasswords)
4. Create an app password for **Mail**
5. Put these values in `.env.local` (do not commit them):

```text
EMAIL_MODE=gmail
GMAIL_USER=your-fellowship-gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FELLOWSHIP_EMAIL_FROM=your-fellowship-gmail@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

`FELLOWSHIP_EMAIL_FROM` can be left empty; it defaults to `GMAIL_USER`.

6. Restart `npm run dev`

Never put the app password in a `NEXT_PUBLIC_*` variable.

## Console (terminal only)

```text
EMAIL_MODE=console
```

Emails succeed and are printed in the Next.js terminal. Useful if Gmail is not
ready yet.

## Resend (recommended for production)

Resend is preferred for delivery to Yahoo and other external providers. First
verify a domain in Resend and configure its SPF, DKIM, and DMARC records. Do
not use a Gmail address as the `from` address unless Resend has verified that
domain.

```text
EMAIL_MODE=resend
RESEND_API_KEY=re_...
FELLOWSHIP_EMAIL_FROM=notifications@your-verified-domain.example
```

Use `onboarding@resend.dev` only for initial testing to the Resend account
owner's address. It is not a production sender for arbitrary Yahoo recipients.

In Vercel, add `EMAIL_MODE`, `RESEND_API_KEY`, and `FELLOWSHIP_EMAIL_FROM` to
Production and Preview. Remove or leave the Gmail variables unused. After
deployment, the Members page should show `Resend` as the email delivery mode.

## Message format

All outbound mail includes:

* a plain-text body (for clients that do not render HTML)
* a branded HTML body (navy header, clear heading, short paragraphs, CTA where useful)

Invitation, dues, celebration, and event templates share one layout so the
fellowship voice stays consistent.

Celebration, dues, and event emails rotate among several pastoral copy variants.
The variant is chosen from a stable seed (member, year, and notice type), so
retries stay identical while next year’s message can differ.


### Invitations

1. Open **Members**
2. Confirm invitation email delivery shows **Resend**
3. Invite a brother using an email you can read
4. Check that inbox for the invitation

### Birthday and anniversary emails

1. Ensure active members have birthday / anniversary dates on their profiles
2. Open **Celebrations**
3. As an administrator:
   - **Send today's emails** — brothers celebrating today only
   - **Send this month's emails** — every birthday and anniversary in the current
     Europe/London month (for testing without waiting for the day)

Scheduled production sending for birthdays and wedding anniversaries happens on the celebration day only, from 6am Europe/London: the morning run (`/api/jobs/celebrations`) sends it, and the evening run (`/api/jobs/notifications`) catches up anything missed that day. Gmail sending reuses one pooled SMTP connection per run. The celebrant receives a personal greeting; all other active members receive a separate celebration message. Event and dues reminders go out from the same two runs.