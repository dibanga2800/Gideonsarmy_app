import { describe, expect, it } from 'vitest'
import {
	formatLondonMonthYear,
	formatMonthYear,
	isCelebrationInLondonMonth,
	isCelebrationOnLondonDate,
	isCelebrationSevenDaysBefore,
	isGregorianLeapYear,
	nextLondonYearMonth,
	observedMonthDay,
} from './celebration'

describe('celebration dates', () => {
	it('observes 29 February on 28 February in a common year', () => {
		expect(isGregorianLeapYear(2026)).toBe(false)
		expect(observedMonthDay(2, 29, 2026)).toEqual({ month: 2, day: 28 })
		expect(observedMonthDay(2, 29, 2028)).toEqual({ month: 2, day: 29 })
	})

	it('matches the celebration on the London civil day, including BST', () => {
		expect(isCelebrationOnLondonDate(10, 8, new Date('2026-10-08T07:00:00.000Z'))).toBe(true)
		expect(isCelebrationOnLondonDate(10, 8, new Date('2026-10-07T23:30:00.000Z'))).toBe(true)
		expect(isCelebrationOnLondonDate(10, 8, new Date('2026-10-08T23:30:00.000Z'))).toBe(false)
	})

	it('matches seven days before the observed celebration', () => {
		expect(isCelebrationSevenDaysBefore(10, 8, new Date('2026-10-01T12:00:00.000Z'))).toBe(true)
		expect(isCelebrationSevenDaysBefore(10, 8, new Date('2026-10-08T12:00:00.000Z'))).toBe(false)
	})

	it('lists a birthday in the current London month without a year', () => {
		expect(isCelebrationInLondonMonth(10, 8, new Date('2026-10-01T12:00:00.000Z'))).toBe(true)
		expect(isCelebrationInLondonMonth(11, 12, new Date('2026-10-01T12:00:00.000Z'))).toBe(false)
	})

	it('names the London month for the celebrations page', () => {
		expect(formatLondonMonthYear(new Date('2026-09-16T12:00:00.000Z'))).toBe('September 2026')
		expect(formatMonthYear(2026, 10)).toBe('October 2026')
		expect(nextLondonYearMonth(new Date('2026-09-16T12:00:00.000Z'))).toEqual({
			year: 2026,
			month: 10,
		})
		expect(nextLondonYearMonth(new Date('2026-12-16T12:00:00.000Z'))).toEqual({
			year: 2027,
			month: 1,
		})
	})
})
