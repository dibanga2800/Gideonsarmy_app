import { describe, expect, it } from 'vitest'
import {
	duesReminderIdempotencyKey,
	isEventDay,
	isTwoDaysBeforeEvent,
	shouldSendMonthlyDuesReminder,
	startOfLondonDay,
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

	it('matches the London day of a gathering before it starts', () => {
		// 8pm BST prayer meeting = 19:00 UTC
		const startAt = new Date('2026-10-08T19:00:00.000Z')
		// Morning run, anywhere in Vercel's hour
		expect(isEventDay(startAt, new Date('2026-10-08T06:00:00.000Z'))).toBe(true)
		expect(isEventDay(startAt, new Date('2026-10-08T06:59:00.000Z'))).toBe(true)
		// Evening catch-up still before the start
		expect(isEventDay(startAt, new Date('2026-10-08T18:30:00.000Z'))).toBe(true)
		// Once it has started, or the day before
		expect(isEventDay(startAt, new Date('2026-10-08T19:00:00.000Z'))).toBe(false)
		expect(isEventDay(startAt, new Date('2026-10-07T18:00:00.000Z'))).toBe(false)
	})

	it('matches the day of a morning gathering on the London date, not the UTC date', () => {
		// 00:30 London on 25 October (BST ends that morning) is 23:30 UTC on the 24th
		const startAt = new Date('2026-10-25T09:30:00.000Z')
		expect(isEventDay(startAt, new Date('2026-10-24T23:30:00.000Z'))).toBe(true)
		expect(isEventDay(startAt, new Date('2026-10-24T22:30:00.000Z'))).toBe(false)
	})

	it('finds the start of the London day in summer and winter time', () => {
		expect(startOfLondonDay(new Date('2026-10-08T12:00:00.000Z')).toISOString()).toBe('2026-10-07T23:00:00.000Z')
		expect(startOfLondonDay(new Date('2026-12-08T12:00:00.000Z')).toISOString()).toBe('2026-12-08T00:00:00.000Z')
		// 00:30 London in BST is still the London day of 9 October
		expect(startOfLondonDay(new Date('2026-10-08T23:30:00.000Z')).toISOString()).toBe('2026-10-08T23:00:00.000Z')
	})
})
