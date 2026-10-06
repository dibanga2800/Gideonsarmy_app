import { describe, expect, it } from 'vitest'
import {
	anniversaryCelebrantEmail,
	anniversaryFellowshipEmail,
	birthdayCelebrantEmail,
	birthdayFellowshipEmail,
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

	it('builds professional fellowship-wide birthday and anniversary emails', () => {
		const birthday = birthdayFellowshipEmail('Bro David Onuoha Umeh', '6 October')
		const anniversary = anniversaryFellowshipEmail('Bro David Ibanga', '6 October')

		expect(birthday.subject).toBe('Birthday celebration · Bro David Onuoha Umeh')
		expect(birthday.text).toContain('Dear brothers,')
		expect(birthday.text).toContain('warm birthday wishes')
		expect(birthday.text).toContain('remembering him in your prayers')
		expect(birthday.html).toContain('Today, 6 October')

		expect(anniversary.subject).toBe('Wedding anniversary celebration · Bro David Ibanga')
		expect(anniversary.text).toContain('and his wife')
		expect(anniversary.text).toContain('warm congratulations')
		expect(anniversary.html).toContain('unity and joy in their home')
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
