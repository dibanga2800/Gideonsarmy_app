import { memberDisplayName } from '@/lib/members/display'
import { formatPenceAsGbp } from '@/lib/money'
import { getSiteUrl } from '@/lib/validation/env'
import {
	anniversaryCelebrantVariants,
	anniversaryFellowshipVariants,
	birthdayCelebrantVariants,
	birthdayFellowshipVariants,
	duesReminderVariants,
	eventReminderVariants,
	pickVariant,
} from '@/lib/notifications/email-variants'

const PARISH_LINE = 'RCCG Living Water Parish, Stoke-on-Trent'

export const fellowshipFromName = "Gideon's Army Men's Fellowship"

export interface EmailMessage {
	to: string
	subject: string
	text: string
	html: string
}

export interface EmailCta {
	label: string
	url: string
}

const COLORS = {
	navy950: '#0b1220',
	navy900: '#111b2e',
	navy800: '#1a2740',
	cream50: '#fbf8f2',
	cream100: '#f4eee3',
	cream200: '#e7dcc8',
	gold500: '#c4a35a',
	gold600: '#a6853d',
	white: '#ffffff',
	muted: '#4a5568',
} as const

export const escapeEmailHtml = (value: string): string =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')

const paragraph = (text: string) =>
	`<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${COLORS.navy800};">${escapeEmailHtml(text)}</p>`

const paragraphs = (lines: string[]) => lines.map(paragraph).join('')

const ctaButton = (cta: EmailCta) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" bgcolor="${COLORS.navy900}" style="border-radius:6px;">
      <a href="${escapeEmailHtml(cta.url)}"
         style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;line-height:1.4;color:${COLORS.cream50};text-decoration:none;border-radius:6px;">
        ${escapeEmailHtml(cta.label)}
      </a>
    </td>
  </tr>
</table>`

const secondaryLink = (label: string, url: string) =>
	`<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${COLORS.muted};">
		<a href="${escapeEmailHtml(url)}" style="color:${COLORS.gold600};font-weight:600;text-decoration:underline;">${escapeEmailHtml(label)}</a>
		<br />
		<span style="word-break:break-all;color:${COLORS.muted};">${escapeEmailHtml(url)}</span>
	</p>`

const buildEmailDocument = (input: {
	subject: string
	preheader: string
	eyebrow: string
	heading: string
	bodyHtml: string
	ctas?: EmailCta[]
	footerNote?: string
}): string => {
	const ctaHtml = (input.ctas ?? []).map(ctaButton).join('')
	const footerNote = input.footerNote
		? `<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${COLORS.muted};">${escapeEmailHtml(input.footerNote)}</p>`
		: ''

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeEmailHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.cream100};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeEmailHtml(input.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.cream100};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:${COLORS.white};border:1px solid ${COLORS.cream200};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:${COLORS.navy950};padding:28px 32px 24px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.gold500};font-weight:600;">
                ${escapeEmailHtml(input.eyebrow)}
              </p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;font-weight:600;color:${COLORS.cream50};">
                ${escapeEmailHtml(input.heading)}
              </h1>
              <div style="margin-top:16px;height:3px;width:56px;background-color:${COLORS.gold500};border-radius:2px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
              ${input.bodyHtml}
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid ${COLORS.cream200};">
              <p style="margin:16px 0 4px;font-size:14px;line-height:1.5;color:${COLORS.navy900};font-weight:600;">
                ${escapeEmailHtml(fellowshipFromName)}
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${COLORS.muted};">
                ${escapeEmailHtml(PARISH_LINE)}
              </p>
              ${footerNote}
              <p style="margin:0;font-size:12px;line-height:1.5;color:${COLORS.muted};">
                This message was sent by ${escapeEmailHtml(fellowshipFromName)}. Please do not reply with payment details or passwords.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const composeEmail = (input: {
	to?: string
	subject: string
	preheader: string
	eyebrow: string
	heading: string
	greeting: string
	body: string[]
	closing: string[]
	ctas?: EmailCta[]
	textExtras?: string[]
	footerNote?: string
}): EmailMessage => {
	const textParts = [
		input.greeting,
		'',
		input.body.join('\n\n'),
		'',
		input.closing.join('\n'),
		'',
		fellowshipFromName,
		PARISH_LINE,
	].filter((part, index, all) => !(part === '' && all[index - 1] === ''))

	if (input.textExtras && input.textExtras.length > 0) {
		textParts.push('', ...input.textExtras)
	}

	const bodyHtml = [
		paragraph(input.greeting),
		paragraphs(input.body),
		paragraphs(input.closing),
	].join('')

	return {
		to: input.to ?? '',
		subject: input.subject,
		text: textParts.join('\n'),
		html: buildEmailDocument({
			subject: input.subject,
			preheader: input.preheader,
			eyebrow: input.eyebrow,
			heading: input.heading,
			bodyHtml,
			ctas: input.ctas,
			footerNote: input.footerNote,
		}),
	}
}

/** Rebuild a styled HTML email from a stored plain-text notice body. */
export const emailFromStoredNotice = (subject: string, message: string): EmailMessage => {
	const lines = message
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line, index, all) => !(line === '' && all[index - 1] === ''))

	const bodyLines = lines.filter(
		(line) =>
			line.length > 0 &&
			line !== fellowshipFromName &&
			line !== PARISH_LINE &&
			!line.startsWith('Sign in:') &&
			!line.startsWith('Create a password:') &&
			!line.startsWith('View the gathering'),
	)

	const siteUrl = getSiteUrl()
	const ctas: EmailCta[] = []
	const signIn = lines.find((line) => line.startsWith('Sign in:'))
	const signup = lines.find((line) => line.startsWith('Create a password:'))
	const events = lines.find((line) => line.startsWith('View the gathering'))

	if (signup) {
		ctas.push({ label: 'Create your account', url: `${siteUrl}/signup` })
	}
	if (signIn) {
		ctas.push({ label: 'Sign in to the app', url: `${siteUrl}/dues` })
	}
	if (events) {
		ctas.push({ label: 'View events', url: `${siteUrl}/events` })
	}

	const greeting = bodyLines[0] ?? 'Dear brother,'
	const rest = bodyLines.slice(1)

	return composeEmail({
		subject,
		preheader: rest[0] ?? subject,
		eyebrow: fellowshipFromName,
		heading: subject,
		greeting,
		body: rest.length > 0 ? rest : [subject],
		closing: [],
		ctas,
	})
}

export const duesReminderEmail = (input: {
	firstName: string
	owingMonths: number
	outstandingPence: number
	year: number
	seed?: string
}): EmailMessage => {
	const monthsLabel = `${input.owingMonths} month${input.owingMonths === 1 ? '' : 's'}`
	const amount = formatPenceAsGbp(input.outstandingPence)
	const duesUrl = `${getSiteUrl()}/dues`
	const variant = pickVariant(
		duesReminderVariants,
		input.seed ?? `dues:${input.year}:${input.firstName}:${monthsLabel}`,
	)

	return composeEmail({
		subject: `Fellowship dues reminder · ${input.year}`,
		preheader: `${monthsLabel} of ${input.year} dues remain outstanding (${amount}).`,
		eyebrow: 'Dues reminder',
		heading: variant.heading,
		greeting: `Dear ${input.firstName},`,
		body: [
			variant.opening,
			`Our records show that ${monthsLabel} of your ${input.year} fellowship dues ${input.owingMonths === 1 ? 'is' : 'are'} still outstanding, totalling ${amount}. Earlier years are kept separately and are not included in this figure.`,
			'Please arrange your contribution using the official fellowship account details in the app, so the work of the fellowship can continue in good order.',
		],
		closing: [variant.closing],
		ctas: [{ label: 'View your dues', url: duesUrl }],
		textExtras: [`Sign in: ${duesUrl}`],
		footerNote: 'Payment instructions are available after you sign in to the fellowship app.',
	})
}

export const birthdayCelebrantEmail = (
	firstName: string,
	celebrationDay: string,
	seed = celebrationDay,
): EmailMessage => {
	const variant = pickVariant(birthdayCelebrantVariants, seed)

	return composeEmail({
		subject: variant.subject,
		preheader: variant.preheader(celebrationDay),
		eyebrow: 'Birthday greeting',
		heading: variant.heading,
		greeting: `Dear ${firstName},`,
		body: [variant.opening(celebrationDay), variant.blessing],
		closing: [variant.closing],
	})
}

export const birthdayFellowshipEmail = (
	celebrantName: string,
	celebrationDay: string,
	seed = `${celebrantName}:${celebrationDay}`,
): EmailMessage => {
	const variant = pickVariant(birthdayFellowshipVariants, seed)

	return composeEmail({
		subject: variant.subject(celebrantName),
		preheader: variant.preheader(celebrantName),
		eyebrow: 'Fellowship notice',
		heading: variant.heading,
		greeting: 'Dear brothers,',
		body: [variant.opening(celebrantName, celebrationDay), variant.callToAction],
		closing: [variant.closing],
	})
}

export const anniversaryCelebrantEmail = (
	firstName: string,
	celebrationDay: string,
	spouseName: string | null,
	seed = celebrationDay,
): EmailMessage => {
	const variant = pickVariant(anniversaryCelebrantVariants, seed)

	return composeEmail({
		subject: variant.subject,
		preheader: variant.preheader(celebrationDay),
		eyebrow: 'Anniversary greeting',
		heading: variant.heading,
		greeting: `Dear ${firstName},`,
		body: [variant.opening(celebrationDay), variant.blessing(spouseName)],
		closing: [variant.closing],
	})
}

export const anniversaryFellowshipEmail = (
	celebrantName: string,
	celebrationDay: string,
	seed = `${celebrantName}:${celebrationDay}`,
): EmailMessage => {
	const variant = pickVariant(anniversaryFellowshipVariants, seed)

	return composeEmail({
		subject: variant.subject(celebrantName),
		preheader: variant.preheader(celebrantName),
		eyebrow: 'Fellowship notice',
		heading: variant.heading,
		greeting: 'Dear brothers,',
		body: [variant.opening(celebrantName, celebrationDay), variant.callToAction],
		closing: [variant.closing],
	})
}

export const eventReminderEmail = (input: {
	firstName: string
	title: string
	whenLabel: string
	lead: string
	seed?: string
}): EmailMessage => {
	const eventsUrl = `${getSiteUrl()}/events`
	const variant = pickVariant(
		eventReminderVariants,
		input.seed ?? `event:${input.title}:${input.whenLabel}`,
	)

	return composeEmail({
		subject: `Upcoming: ${input.title}`,
		preheader: `${input.title} is ${input.whenLabel}.`,
		eyebrow: 'Event reminder',
		heading: input.title,
		greeting: `Dear ${input.firstName},`,
		body: [`${input.lead} ${input.title} is ${input.whenLabel}.`, variant.closingLead],
		closing: [variant.closing],
		ctas: [{ label: 'View events', url: eventsUrl }],
		textExtras: [`View the gathering and add it to your calendar: ${eventsUrl}`],
	})
}

export const memberInviteEmail = (input: {
	firstName: string | null
	inviterName: string
}): EmailMessage => {
	const greeting = input.firstName ? `Dear ${input.firstName},` : 'Dear brother,'
	const siteUrl = getSiteUrl()
	const signupUrl = `${siteUrl}/signup`
	const loginUrl = `${siteUrl}/login`

	return {
		to: '',
		subject: "You are invited to Gideon's Army Men's Fellowship",
		text: [
			greeting,
			'',
			`${input.inviterName} has invited you to join Gideon's Army Men's Fellowship at ${PARISH_LINE}.`,
			'',
			'This platform helps brothers manage membership, dues, gatherings, and fellowship notices.',
			'',
			'If this email address is linked to a Google account, you may sign in with Google. If you use another email provider, create a password using the link below, then sign in with that email and password.',
			'',
			'After signing in, please complete your profile. An administrator will approve your membership before you can view fellowship records.',
			'',
			`Create a password: ${signupUrl}`,
			`Sign in: ${loginUrl}`,
			'',
			'The Lord bless you.',
			'',
			fellowshipFromName,
			PARISH_LINE,
		].join('\n'),
		html: buildEmailDocument({
			subject: "You are invited to Gideon's Army Men's Fellowship",
			preheader: `${input.inviterName} has invited you to join Gideon's Army Men's Fellowship.`,
			eyebrow: 'Membership invitation',
			heading: 'You are invited to join the fellowship',
			bodyHtml: [
				paragraph(greeting),
				paragraph(
					`${input.inviterName} has invited you to join Gideon's Army Men's Fellowship at ${PARISH_LINE}.`,
				),
				paragraph(
					'This platform helps brothers manage membership, dues, gatherings, and fellowship notices.',
				),
				paragraph(
					'If this email address is linked to a Google account, you may sign in with Google. If you use another email provider, create a password using the button below, then sign in with that email and password.',
				),
				paragraph(
					'After signing in, please complete your profile. An administrator will approve your membership before you can view fellowship records.',
				),
				paragraph('The Lord bless you.'),
				secondaryLink('Or open the sign-in page', loginUrl),
			].join(''),
			ctas: [
				{ label: 'Create your account', url: signupUrl },
				{ label: 'Sign in', url: loginUrl },
			],
			footerNote: 'Only invited brothers can create an account with this email address.',
		}),
	}
}

export const memberLabel = (member: { first_name: string; last_name: string }) =>
	memberDisplayName(member)
