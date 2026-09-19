import { describe, expect, it } from 'vitest'
import { buildIcs, escapeIcsText } from './calendar'

describe('event calendar', () => {
	it('escapes ICS special characters', () => {
		expect(escapeIcsText('Prayer, then tea; 8pm')).toBe('Prayer\\, then tea\\; 8pm')
	})

	it('builds a UTC event', () => {
		const ics = buildIcs({
			id: 'prayer-1',
			title: 'Monthly prayer meeting',
			description: 'Second Thursday',
			startAt: new Date('2026-10-08T19:00:00.000Z'),
			endAt: new Date('2026-10-08T20:00:00.000Z'),
		})

		expect(ics).toContain('DTSTART:20261008T190000Z')
		expect(ics).toContain('SUMMARY:Monthly prayer meeting')
	})
})
