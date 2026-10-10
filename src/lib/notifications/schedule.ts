import { getLondonYearMonthDay } from '@/lib/dates/celebration'
import { londonCivilToUtc, utcToLondonDateAndTime } from '@/lib/dates/prayer-meeting'

export const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

const sameLondonDay = (left: Date, right: Date) =>
	utcToLondonDateAndTime(left).date === utcToLondonDateAndTime(right).date

export const shouldSendMonthlyDuesReminder = (now: Date, force = false) => {
	if (force) {
		return true
	}

	const { year, month, day } = getLondonYearMonthDay(now)
	const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
	return day === lastDayOfMonth
}

export const duesReminderIdempotencyKey = (memberId: string, now: Date) => {
	const { year, month } = getLondonYearMonthDay(now)
	const dueMonth = `${year}-${String(month).padStart(2, '0')}-01`
	return `dues_reminder:${memberId}:${dueMonth}`
}

export const isTwoDaysBeforeEvent = (startAt: Date, now: Date) => {
	if (startAt.getTime() <= now.getTime()) {
		return false
	}

	return sameLondonDay(new Date(startAt.getTime() - TWO_DAYS_MS), now)
}

/**
 * True on the London calendar day of a gathering, before it starts. Replaces
 * the old "two hours before" reminder: Vercel Hobby runs cron jobs at most
 * once a day, so a morning run can reliably say "today", but cannot hit a
 * two-hour window for gatherings at any time of day.
 */
export const isEventDay = (startAt: Date, now: Date) => {
	if (startAt.getTime() <= now.getTime()) {
		return false
	}

	return sameLondonDay(startAt, now)
}

/** Midnight at the start of the current London calendar day, as a UTC instant. */
export const startOfLondonDay = (now: Date) => {
	const { year, month, day } = getLondonYearMonthDay(now)
	return londonCivilToUtc(year, month, day, 0, 0)
}
