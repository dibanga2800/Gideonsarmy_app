import { describe, expect, it } from 'vitest'
import {
	duesReminderIdempotencyKey,
	isTwoDaysBeforeEvent,
	isWithinTwoHoursBeforeEvent,
	shouldSendMonthlyDuesReminder,
} from './schedule'

describe('notification schedule', () => {
	it('sends outstanding-dues reminders on the last calendar day in Europe/London', () => {
		expect(shouldSendMonthlyDuesReminder(new Date('2026-09-30T05:00:00.000Z'))).toBe(true)
		expect(shouldSendMonthlyDuesReminder(new Date('2026-11-30T06:00:00.000Z'))).toBe(true)
		expect(shouldSendMonthlyDuesReminder(new Date('2025-02-28T06:00:00.000Z'))).toBe(true)
		expect(shouldSendMonthlyDuesReminder(new Date('2024-02-29T06:00:00.000Z'))).toBe(true)
		expect(shouldSendMonthlyDuesReminder(new Date('2026-09-25T11:00:00.000Z'))).toBe(false)
		expect(shouldSendMonthlyDuesReminder(new Date('2026-09-30T23:30:00.000Z'))).toBe(false)
		expect(shouldSendMonthlyDuesReminder(new Date('2026-09-29T11:00:00.000Z'), true)).toBe(true)
	})

	it('uses a monthly idempotency key', () => {
		expect(
			duesReminderIdempotencyKey(
				'11111111-1111-4111-8111-111111111111',
				new Date('2026-09-30T11:00:00.000Z'),
			),
		).toBe('dues_reminder:11111111-1111-4111-8111-111111111111:2026-09-01')
	})

	it('matches two calendar days before a gathering', () => {
		const startAt = new Date('2026-10-08T19:00:00.000Z')
		expect(isTwoDaysBeforeEvent(startAt, new Date('2026-10-06T12:00:00.000Z'))).toBe(true)
		expect(isTwoDaysBeforeEvent(startAt, new Date('2026-10-07T12:00:00.000Z'))).toBe(false)
	})

	it('matches the two-hour window before a gathering', () => {
		const startAt = new Date('2026-10-08T19:00:00.000Z')
		expect(isWithinTwoHoursBeforeEvent(startAt, new Date('2026-10-08T17:00:00.000Z'))).toBe(true)
		expect(isWithinTwoHoursBeforeEvent(startAt, new Date('2026-10-08T16:59:00.000Z'))).toBe(false)
		expect(isWithinTwoHoursBeforeEvent(startAt, new Date('2026-10-08T19:00:00.000Z'))).toBe(false)
	})
})
