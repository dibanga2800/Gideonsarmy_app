import { FELLOWSHIP_TIME_ZONE } from '@/lib/dates/prayer-meeting'

export const toDueMonthDate = (year: number, month: number) => {
	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw new Error('Due month must be a valid calendar month')
	}

	return `${year}-${String(month).padStart(2, '0')}-01`
}

export const getLondonYearMonth = (from = new Date()) => {
	const formatter = new Intl.DateTimeFormat('en-GB', {
		timeZone: FELLOWSHIP_TIME_ZONE,
		year: 'numeric',
		month: 'numeric',
	})
	const parts = formatter.formatToParts(from)
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

	return {
		year: Number(values.year),
		month: Number(values.month),
	}
}

export const getLondonDate = (from = new Date()) =>
	new Intl.DateTimeFormat('en-CA', {
		timeZone: FELLOWSHIP_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(from)

export const getCurrentDueMonth = (from = new Date()) => {
	const { year, month } = getLondonYearMonth(from)
	return toDueMonthDate(year, month)
}

export const formatDueMonth = (dueMonth: string) => {
	const match = /^(\d{4})-(\d{2})-01$/.exec(dueMonth.slice(0, 10))

	if (!match) {
		return dueMonth
	}

	const year = Number(match[1])
	const month = Number(match[2])

	return new Intl.DateTimeFormat('en-GB', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(year, month - 1, 1)))
}
