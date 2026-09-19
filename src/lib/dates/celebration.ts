import { londonCivilToUtc, utcToLondonDateAndTime } from '@/lib/dates/prayer-meeting'
import { isValidBirthMonthDay } from '@/lib/dates/birthday'

export const isGregorianLeapYear = (year: number) =>
	year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

export const observedMonthDay = (month: number, day: number, year: number) => {
	if (!isValidBirthMonthDay(month, day)) {
		return null
	}

	if (month === 2 && day === 29 && !isGregorianLeapYear(year)) {
		return { month: 2, day: 28 }
	}

	return { month, day }
}

export const getLondonYearMonthDay = (from = new Date()) => {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/London',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
	}).formatToParts(from)
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

	return {
		year: Number(values.year),
		month: Number(values.month),
		day: Number(values.day),
	}
}

const sameLondonDate = (left: Date, right: Date) => {
	const first = getLondonYearMonthDay(left)
	const second = getLondonYearMonthDay(right)
	return first.year === second.year && first.month === second.month && first.day === second.day
}

export const celebrationDateUtc = (year: number, month: number, day: number) => {
	const observed = observedMonthDay(month, day, year)
	if (!observed) {
		return null
	}

	return londonCivilToUtc(year, observed.month, observed.day, 8, 0)
}

export const isCelebrationOnLondonDate = (
	month: number,
	day: number,
	from = new Date(),
) => {
	const today = getLondonYearMonthDay(from)
	const observed = observedMonthDay(month, day, today.year)
	return observed !== null && observed.month === today.month && observed.day === today.day
}

export const isCelebrationSevenDaysBefore = (
	month: number,
	day: number,
	from = new Date(),
) => {
	const today = getLondonYearMonthDay(from)
	const event = celebrationDateUtc(today.year, month, day)
	if (!event) {
		return false
	}

	const sevenDaysBefore = new Date(event.getTime() - 7 * 24 * 60 * 60 * 1000)
	return sameLondonDate(sevenDaysBefore, from)
}

export const isCelebrationInLondonMonth = (
	month: number,
	day: number,
	from = new Date(),
) => {
	if (!isValidBirthMonthDay(month, day)) {
		return false
	}

	return getLondonYearMonthDay(from).month === month
}

export const anniversaryMonthDay = (value: string | null) => {
	if (!value) {
		return null
	}

	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
	if (!match) {
		return null
	}

	const month = Number(match[2])
	const day = Number(match[3])
	if (!isValidBirthMonthDay(month, day)) {
		return null
	}

	return { month, day }
}

export const formatCelebrationDay = (month: number, day: number) => {
	if (!isValidBirthMonthDay(month, day)) {
		return null
	}

	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(2000, month - 1, day)))
}

export const formatLondonMonthYear = (from = new Date()) =>
	new Intl.DateTimeFormat('en-GB', {
		month: 'long',
		year: 'numeric',
		timeZone: 'Europe/London',
	}).format(from)

export const formatMonthYear = (year: number, month: number) =>
	new Intl.DateTimeFormat('en-GB', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(year, month - 1, 1)))

export const nextLondonYearMonth = (from = new Date()) => {
	const current = getLondonYearMonthDay(from)
	if (current.month === 12) {
		return { year: current.year + 1, month: 1 }
	}

	return { year: current.year, month: current.month + 1 }
}

export const londonDateKey = (from = new Date()) => {
	const { date } = utcToLondonDateAndTime(from)
	return date
}
