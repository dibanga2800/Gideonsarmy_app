import { getLondonYearMonthDay } from '@/lib/dates/celebration'
import { utcToLondonDateAndTime } from '@/lib/dates/prayer-meeting'

export const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000

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

export const isWithinTwoHoursBeforeEvent = (startAt: Date, now: Date) => {
	if (startAt.getTime() <= now.getTime()) {
		return false
	}

	return startAt.getTime() - TWO_HOURS_MS <= now.getTime()
}
