import { describe, expect, it } from 'vitest'
import {
	createEmailService,
	getEmailDeliveryStatus,
	resolveEmailDeliveryMode,
} from './email-service'

describe('email delivery', () => {
	it('uses Gmail when mode and app password credentials are set', () => {
		expect(
			resolveEmailDeliveryMode({
				EMAIL_MODE: 'gmail',
				GMAIL_USER: 'fellowship@gmail.com',
				GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
			}),
		).toBe('gmail')
		expect(
			getEmailDeliveryStatus({
				EMAIL_MODE: 'gmail',
				GMAIL_USER: 'fellowship@gmail.com',
				GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
			}).ready,
		).toBe(true)
	})

	it('uses console mode for terminal-only testing', () => {
		expect(resolveEmailDeliveryMode({ EMAIL_MODE: 'console' })).toBe('console')
		expect(getEmailDeliveryStatus({ EMAIL_MODE: 'console' }).ready).toBe(true)
	})

	it('uses Resend when the API key and from-address are set', () => {
		expect(
			resolveEmailDeliveryMode({
				EMAIL_MODE: 'resend',
				RESEND_API_KEY: 're_test',
				FELLOWSHIP_EMAIL_FROM: 'onboarding@resend.dev',
			}),
		).toBe('resend')
	})

	it('stays unconfigured when Gmail is requested without credentials', () => {
		expect(resolveEmailDeliveryMode({ EMAIL_MODE: 'gmail' })).toBe('unconfigured')
		expect(getEmailDeliveryStatus({ EMAIL_MODE: 'gmail' }).ready).toBe(false)
	})

	it('reports success from the console provider', async () => {
		const email = createEmailService({ EMAIL_MODE: 'console' })
		await expect(
			email.send({
				to: 'brother@example.com',
				subject: 'Test',
				text: 'Grace and peace.',
				html: '<p>Grace and peace.</p>',
			}),
		).resolves.toEqual({ ok: true })
	})
})
