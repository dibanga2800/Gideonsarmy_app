import { describe, expect, it } from 'vitest'
import { eventTypeLabel, formatLondonDateTime } from './display'

describe('eventTypeLabel', () => {
	it('labels stored and calculated gathering types', () => {
		expect(eventTypeLabel('PRAYER_MEETING')).toBe('Prayer meeting')
		expect(eventTypeLabel('FELLOWSHIP')).toBe('Fellowship')
		expect(eventTypeLabel('SPECIAL')).toBe('Special gathering')
		expect(eventTypeLabel('OUTING')).toBe('Outing')
		expect(eventTypeLabel('OTHER')).toBe('Other')
	})
})

describe('formatLondonDateTime', () => {
	it('shows the fellowship timezone, including BST', () => {
		expect(formatLondonDateTime('2026-10-08T19:00:00.000Z')).toBe(
			'Thursday, 8 October 2026 at 20:00',
		)
	})
})
