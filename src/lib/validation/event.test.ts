import { describe, expect, it } from 'vitest'
import { eventInputSchema } from './event'

const validInput = {
	title: 'Fellowship dinner',
	description: 'Bring a guest.',
	event_type: 'FELLOWSHIP',
	startDate: '2026-10-08',
	startTime: '20:00',
	endDate: '2026-10-08',
	endTime: '21:30',
}

describe('eventInputSchema', () => {
	it('stores admin-entered times as UTC from Europe/London', () => {
		expect(eventInputSchema.parse(validInput)).toEqual({
			title: 'Fellowship dinner',
			description: 'Bring a guest.',
			event_type: 'FELLOWSHIP',
			start_at: '2026-10-08T19:00:00.000Z',
			end_at: '2026-10-08T20:30:00.000Z',
			is_recurring: false,
		})
	})

	it('allows an event without an end time', () => {
		expect(
			eventInputSchema.parse({
				...validInput,
				endDate: '',
				endTime: '',
			}).end_at,
		).toBeNull()
	})

	it('rejects a prayer-meeting type that should stay calculated', () => {
		expect(
			eventInputSchema.safeParse({
				...validInput,
				event_type: 'PRAYER_MEETING',
			}).success,
		).toBe(false)
	})

	it('rejects an end that is not after the start', () => {
		expect(
			eventInputSchema.safeParse({
				...validInput,
				endTime: '19:00',
			}).success,
		).toBe(false)
	})

	it('rejects an end date without an end time', () => {
		expect(
			eventInputSchema.safeParse({
				...validInput,
				endTime: '',
			}).success,
		).toBe(false)
	})
})
