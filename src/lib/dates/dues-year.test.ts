import { describe, expect, it } from 'vitest'
import {
	annualDuesPence,
	countMonthsDueToDateInYear,
	duesStartMonthFromJoinedAt,
	filterDuesForYear,
	getLedgerYear,
	isDueMonthDue,
	isFullYearDuesStart,
	joinedAtToMonthInput,
	listChargeableMonthsInYear,
	listDueMonthsToDate,
	listLedgerYears,
	listYearDueMonths,
	parseRequestedLedgerYear,
} from './dues-year'

describe('dues year', () => {
	it('charges £120 for twelve months of £10', () => {
		expect(annualDuesPence(1000)).toBe(12_000)
	})

	it('lists January to December for a year', () => {
		expect(listYearDueMonths(2026)[0]).toBe('2026-01-01')
		expect(listYearDueMonths(2026)[11]).toBe('2026-12-01')
		expect(listYearDueMonths(2026)).toHaveLength(12)
	})

	it('counts months due to date in Europe/London', () => {
		expect(countMonthsDueToDateInYear(2026, new Date('2026-09-16T12:00:00.000Z'))).toBe(9)
		expect(listDueMonthsToDate(new Date('2026-09-16T12:00:00.000Z'))).toHaveLength(9)
		expect(isDueMonthDue('2026-09-01', new Date('2026-09-16T12:00:00.000Z'))).toBe(true)
		expect(isDueMonthDue('2026-10-01', new Date('2026-09-16T12:00:00.000Z'))).toBe(false)
	})

	it('does not open a ledger year before tracking started', () => {
		expect(getLedgerYear(new Date('2025-12-01T12:00:00.000Z'))).toBe(2026)
	})

	it('keeps 2026 available in 2027 and does not mix those months into 2027', () => {
		const in2027 = new Date('2027-03-16T12:00:00.000Z')

		expect(getLedgerYear(in2027)).toBe(2027)
		expect(listLedgerYears(in2027)).toEqual([2026, 2027])
		expect(countMonthsDueToDateInYear(2026, in2027)).toBe(12)
		expect(countMonthsDueToDateInYear(2027, in2027)).toBe(3)
		expect(listDueMonthsToDate(in2027)).toHaveLength(15)
		expect(parseRequestedLedgerYear('2026', in2027)).toBe(2026)
		expect(parseRequestedLedgerYear('2025', in2027)).toBe(2027)
		expect(parseRequestedLedgerYear('2028', in2027)).toBe(2027)
		expect(
			filterDuesForYear(
				[{ due_month: '2026-12-01' }, { due_month: '2027-01-01' }],
				2027,
			),
		).toEqual([{ due_month: '2027-01-01' }])
	})

	it('starts charging from the joining month, not earlier months in the year', () => {
		const inSeptember = new Date('2026-09-16T12:00:00.000Z')

		expect(duesStartMonthFromJoinedAt('2026-09-10T08:00:00.000Z')).toBe('2026-09-01')
		expect(duesStartMonthFromJoinedAt(null)).toBe('2026-01-01')
		expect(isFullYearDuesStart(null)).toBe(true)
		expect(isFullYearDuesStart('2026-01-01T00:00:00.000Z')).toBe(true)
		expect(isFullYearDuesStart('2026-09-10T08:00:00.000Z')).toBe(false)
		expect(countMonthsDueToDateInYear(2026, inSeptember, '2026-09-01')).toBe(1)
		expect(listChargeableMonthsInYear(2026, '2026-09-01', inSeptember, false)).toHaveLength(4)
		expect(joinedAtToMonthInput('2026-09-10T08:00:00.000Z')).toBe('2026-09')
	})
})
