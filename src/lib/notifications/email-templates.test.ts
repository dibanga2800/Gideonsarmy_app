import { describe, expect, it } from 'vitest'
import {
	anniversaryCelebrantEmail,
	birthdayCelebrantEmail,
	duesReminderEmail,
	emailFromStoredNotice,
	escapeEmailHtml,
	memberInviteEmail,
} from '@/lib/notifications/email-templates'

describe('email templates', () => {
	it('escapes HTML special characters', () => {
		expect(escapeEmailHtml(`Brother <Bob> & "Debby"`)).toBe(
			'Brother &lt;Bob&gt; &amp; &quot;Debby&quot;',
		)
	})

	it('builds a professional invite with HTML and plain text', () => {
		const mail = memberInviteEmail({
			firstName: 'David',
			inviterName: "Gideon's Army LWP",
		})

		expect(mail.subject).toContain("Gideon's Army")
		expect(mail.text).toContain('Dear David,')
		expect(mail.text).toContain('Create a password:')
		expect(mail.html).toContain('<!DOCTYPE html>')
		expect(mail.html).toContain('Membership invitation')
		expect(mail.html).toContain('Create your account')
		expect(mail.html).toContain(escapeEmailHtml("Gideon's Army LWP"))
	})

	it('builds birthday and anniversary greetings with shared layout', () => {
		const birthday = birthdayCelebrantEmail('David', '29 September', 'test-birthday')
		const anniversary = anniversaryCelebrantEmail(
			'David',
			'23 October',
			'Debby',
			'test-anniversary',
		)

		expect(birthday.html).toContain('Dear David,')
		expect(birthday.text).toContain('Dear David,')
		expect(anniversary.html).toContain('Dear David,')
		expect(anniversary.text).toMatch(/you and Debby/i)
		expect(anniversary.html).toContain('Debby')
	})

	it('builds dues reminders with amount and CTA', () => {
		const mail = duesReminderEmail({
			firstName: 'David',
			owingMonths: 2,
			outstandingPence: 2000,
			year: 2026,
			seed: 'dues-test',
		})

		expect(mail.subject).toContain('2026')
		expect(mail.text).toContain('£20.00')
		expect(mail.html).toContain('View your dues')
		expect(mail.html).toContain('£20.00')
	})

	it('restyles stored plain-text notices for outbound email', () => {
		const stored = birthdayCelebrantEmail('David', '29 September', 'stored-test')
		const rebuilt = emailFromStoredNotice(stored.subject, stored.text)

		expect(rebuilt.html).toContain('<!DOCTYPE html>')
		expect(rebuilt.html).toContain('Dear David,')
		expect(rebuilt.text).toContain('Dear David,')
	})
})
