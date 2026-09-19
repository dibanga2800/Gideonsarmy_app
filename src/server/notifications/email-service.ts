import nodemailer from 'nodemailer'
import { logEvent } from '@/lib/logging'
import { fellowshipFromName, type EmailMessage } from '@/lib/notifications/email-templates'

export type EmailDeliveryMode = 'gmail' | 'resend' | 'console' | 'unconfigured'

export interface EmailService {
	send: (message: EmailMessage) => Promise<{ ok: boolean }>
}

export interface EmailDeliveryStatus {
	mode: EmailDeliveryMode
	ready: boolean
	label: string
	detail: string
}

export interface EmailEnv {
	EMAIL_MODE?: string
	GMAIL_USER?: string
	GMAIL_APP_PASSWORD?: string
	RESEND_API_KEY?: string
	FELLOWSHIP_EMAIL_FROM?: string
	[key: string]: string | undefined
}

const safeHttpStatus = (status: number) => {
	if (!Number.isInteger(status) || status < 100 || status > 599) {
		return undefined
	}

	return String(status)
}

const formatFromAddress = (from: string) => ({
	name: fellowshipFromName,
	address: from,
})

const recipientDomain = (to: string) => {
	const at = to.lastIndexOf('@')
	if (at < 0) {
		return undefined
	}

	const domain = to.slice(at + 1).trim().toLowerCase()
	return /^[a-z0-9.-]+$/.test(domain) ? domain : undefined
}

const hasGmail = (env: EmailEnv) =>
	Boolean(env.GMAIL_USER?.trim() && env.GMAIL_APP_PASSWORD?.trim())

const hasResend = (env: EmailEnv) =>
	Boolean(env.RESEND_API_KEY?.trim() && env.FELLOWSHIP_EMAIL_FROM?.trim())

const gmailEmailService = (user: string, appPassword: string, from: string): EmailService => {
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user,
			pass: appPassword,
		},
	})

	return {
		send: async (message) => {
			try {
				const info = await transporter.sendMail({
					from: formatFromAddress(from),
					replyTo: from,
					to: message.to,
					subject: message.subject,
					text: message.text,
					html: message.html,
				})

				const rejected = Array.isArray(info.rejected) ? info.rejected.length : 0
				if (rejected > 0) {
					logEvent({
						operation: 'email.send',
						status: 'error',
						errorCategory: 'email',
						errorCode: 'rejected',
					})
					return { ok: false }
				}

				logEvent({
					operation: 'email.send',
					status: 'ok',
					errorCode: recipientDomain(message.to),
				})
				return { ok: true }
			} catch {
				logEvent({
					operation: 'email.send',
					status: 'error',
					errorCategory: 'email',
				})
				return { ok: false }
			}
		},
	}
}

const resendEmailService = (apiKey: string, from: string): EmailService => ({
	send: async (message) => {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: `${fellowshipFromName} <${from}>`,
				to: [message.to],
				subject: message.subject,
				text: message.text,
				html: message.html,
				reply_to: from,
			}),
		})

		if (!response.ok) {
			logEvent({
				operation: 'email.send',
				status: 'error',
				errorCategory: 'email',
				errorCode: safeHttpStatus(response.status),
			})
			return { ok: false }
		}

		logEvent({
			operation: 'email.send',
			status: 'ok',
		})
		return { ok: true }
	},
})

const consoleEmailService: EmailService = {
	send: async (message) => {
		logEvent({
			operation: 'email.send',
			status: 'ok',
		})
		console.info(
			JSON.stringify({
				ts: new Date().toISOString(),
				operation: 'email.console',
				status: 'ok',
				to: message.to,
				subject: message.subject,
				text: message.text,
				hasHtml: Boolean(message.html),
			}),
		)
		return { ok: true }
	},
}

const unconfiguredEmailService: EmailService = {
	send: async () => {
		logEvent({
			operation: 'email.send',
			status: 'error',
			errorCategory: 'not-configured',
		})
		return { ok: false }
	},
}

export const resolveEmailDeliveryMode = (env: EmailEnv = process.env): EmailDeliveryMode => {
	const mode = env.EMAIL_MODE?.trim().toLowerCase()

	if (mode === 'console') {
		return 'console'
	}

	if (mode === 'gmail') {
		return hasGmail(env) ? 'gmail' : 'unconfigured'
	}

	if (mode === 'resend') {
		return hasResend(env) ? 'resend' : 'unconfigured'
	}

	if (hasGmail(env)) {
		return 'gmail'
	}

	if (hasResend(env)) {
		return 'resend'
	}

	return 'unconfigured'
}

export const getEmailDeliveryStatus = (env: EmailEnv = process.env): EmailDeliveryStatus => {
	const mode = resolveEmailDeliveryMode(env)

	if (mode === 'gmail') {
		return {
			mode,
			ready: true,
			label: 'Gmail',
			detail: 'Invites and celebration emails are sent through Gmail SMTP with an app password.',
		}
	}

	if (mode === 'resend') {
		return {
			mode,
			ready: true,
			label: 'Resend',
			detail: 'Invites and celebration emails are sent through Resend.',
		}
	}

	if (mode === 'console') {
		return {
			mode,
			ready: true,
			label: 'Console',
			detail:
				'Emails are written to the Next.js server console. Use this only when you are not ready for Gmail.',
		}
	}

	return {
		mode,
		ready: false,
		label: 'Not configured',
		detail:
			'Set EMAIL_MODE=gmail with GMAIL_USER and GMAIL_APP_PASSWORD, or use EMAIL_MODE=console for terminal-only testing.',
	}
}

export const createEmailService = (env: EmailEnv = process.env): EmailService => {
	const mode = resolveEmailDeliveryMode(env)

	if (mode === 'console') {
		return consoleEmailService
	}

	if (mode === 'gmail') {
		const user = env.GMAIL_USER?.trim() ?? ''
		const appPassword = env.GMAIL_APP_PASSWORD?.trim() ?? ''
		const from = env.FELLOWSHIP_EMAIL_FROM?.trim() || user
		return gmailEmailService(user, appPassword, from)
	}

	if (mode === 'resend') {
		const apiKey = env.RESEND_API_KEY?.trim() ?? ''
		const from = env.FELLOWSHIP_EMAIL_FROM?.trim() ?? ''
		return resendEmailService(apiKey, from)
	}

	return unconfiguredEmailService
}
