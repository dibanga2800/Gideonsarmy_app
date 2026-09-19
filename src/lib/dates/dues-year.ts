import { DEFAULT_MONTHLY_DUES_PENCE } from '@/lib/money'
import { getCurrentDueMonth, getLondonDate, getLondonYearMonth, toDueMonthDate } from '@/lib/dates/due-month'

export const DUES_TRACKING_START_YEAR = 2026
export const DUES_TRACKING_START_MONTH = `${DUES_TRACKING_START_YEAR}-01-01`
export const MONTHS_PER_YEAR = 12

export const annualDuesPence = (monthlyPence = DEFAULT_MONTHLY_DUES_PENCE) =>
	monthlyPence * MONTHS_PER_YEAR

export const getLedgerYear = (from = new Date()) => {
	const { year } = getLondonYearMonth(from)
	return Math.max(DUES_TRACKING_START_YEAR, year)
}

export const listLedgerYears = (from = new Date()) => {
	const current = getLedgerYear(from)
	const years: number[] = []

	for (let year = DUES_TRACKING_START_YEAR; year <= current; year += 1) {
		years.push(year)
	}

	return years
}

export const parseRequestedLedgerYear = (raw: string | undefined, from = new Date()) => {
	const current = getLedgerYear(from)

	if (!raw || !/^\d{4}$/.test(raw)) {
		return current
	}

	const year = Number(raw)

	if (year < DUES_TRACKING_START_YEAR || year > current) {
		return current
	}

	return year
}

export const duesBelongToYear = (dueMonth: string, year: number) =>
	dueMonth.slice(0, 4) === String(year)

export const filterDuesForYear = <T extends { due_month: string }>(rows: T[], year: number) =>
	rows.filter((row) => duesBelongToYear(row.due_month, year))

export const listYearDueMonths = (year: number) =>
	Array.from({ length: MONTHS_PER_YEAR }, (_, index) => toDueMonthDate(year, index + 1))

export const formatMonthShort = (dueMonth: string) => {
	const match = /^(\d{4})-(\d{2})-01/.exec(dueMonth.slice(0, 10))
	if (!match) {
		return dueMonth
	}

	return new Intl.DateTimeFormat('en-GB', {
		month: 'short',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)))
}

export const isDueMonthDue = (dueMonth: string, from = new Date()) =>
	dueMonth.slice(0, 10) <= getCurrentDueMonth(from)

export const listDueMonthsToDate = (from = new Date()) => {
	const current = getCurrentDueMonth(from)
	const { year: currentYear } = getLondonYearMonth(from)
	const months: string[] = []

	for (let year = DUES_TRACKING_START_YEAR; year <= Math.max(DUES_TRACKING_START_YEAR, currentYear); year += 1) {
		for (const month of listYearDueMonths(year)) {
			if (month <= current) {
				months.push(month)
			}
		}
	}

	return months
}

export const duesStartMonthFromJoinedAt = (joinedAt: string | null) => {
	if (!joinedAt) {
		return DUES_TRACKING_START_MONTH
	}

	const parsed = new Date(joinedAt)
	if (Number.isNaN(parsed.getTime())) {
		return DUES_TRACKING_START_MONTH
	}

	const month = `${getLondonDate(parsed).slice(0, 7)}-01`
	return month < DUES_TRACKING_START_MONTH ? DUES_TRACKING_START_MONTH : month
}

export const isFullYearDuesStart = (joinedAt: string | null) =>
	duesStartMonthFromJoinedAt(joinedAt) === DUES_TRACKING_START_MONTH

export const joinedAtToMonthInput = (joinedAt: string | null) => {
	if (!joinedAt) {
		return ''
	}

	const parsed = new Date(joinedAt)
	if (Number.isNaN(parsed.getTime())) {
		return ''
	}

	return getLondonDate(parsed).slice(0, 7)
}

export const listChargeableMonthsInYear = (
	year: number,
	duesStartMonth = DUES_TRACKING_START_MONTH,
	from = new Date(),
	throughCurrent = true,
) =>
	listYearDueMonths(year).filter((month) => {
		if (month < duesStartMonth) {
			return false
		}

		if (throughCurrent && !isDueMonthDue(month, from)) {
			return false
		}

		return true
	})

export const countMonthsDueToDateInYear = (
	year: number,
	from = new Date(),
	duesStartMonth = DUES_TRACKING_START_MONTH,
) => listChargeableMonthsInYear(year, duesStartMonth, from, true).length
