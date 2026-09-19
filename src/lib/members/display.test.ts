import { describe, expect, it } from 'vitest'
import {
	formatBirthday,
	formatCalendarDate,
	formatDuesStartLabel,
	formatJoinedOn,
	optionalFieldLabel,
} from './display'

describe('optionalFieldLabel', () => {
	it('shows a fallback when a directory field is empty', () => {
		expect(optionalFieldLabel(null)).toBe('Not provided')
		expect(optionalFieldLabel('Ushering')).toBe('Ushering')
	})
})

describe('formatBirthday', () => {
	it('formats day and month without a year', () => {
		expect(formatBirthday(5, 12)).toBe('12 May')
	})

	it('does not invent a birthday from an incomplete pair', () => {
		expect(formatBirthday(5, null)).toBe('Not provided')
		expect(formatBirthday(null, null)).toBe('Not provided')
	})
})

describe('formatCalendarDate', () => {
	it('formats a stored date without shifting the day', () => {
		expect(formatCalendarDate('1980-05-12')).toBe('12 May 1980')
	})

	it('does not invent a date from invalid input', () => {
		expect(formatCalendarDate('not-a-date')).toBe('Not provided')
		expect(formatCalendarDate(null)).toBe('Not provided')
	})
})

describe('formatJoinedOn', () => {
	it('formats a timestamp in Europe/London', () => {
		expect(formatJoinedOn('2026-03-01T00:00:00.000Z')).toBe('1 March 2026')
	})
})

describe('formatDuesStartLabel', () => {
	it('describes a January start as a full year', () => {
		expect(formatDuesStartLabel(null)).toBe('Full year from January 2026')
		expect(formatDuesStartLabel('2026-01-01T00:00:00.000Z')).toBe(
			'Full year from January 2026',
		)
	})

	it('describes a later start for a new member', () => {
		expect(formatDuesStartLabel('2026-09-01T00:00:00.000Z')).toBe('From September 2026')
	})
})
