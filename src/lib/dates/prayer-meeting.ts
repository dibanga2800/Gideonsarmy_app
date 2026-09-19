export const FELLOWSHIP_TIME_ZONE = 'Europe/London'
export const PRAYER_MEETING_HOUR = 20
export const PRAYER_MEETING_MINUTE = 0

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
	})
	const parts = formatter.formatToParts(date)
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
	const asUtc = Date.UTC(
		Number(values.year),
		Number(values.month) - 1,
		Number(values.day),
		Number(values.hour),
		Number(values.minute),
		Number(values.second),
	)

	return asUtc - date.getTime()
}

export const londonCivilToUtc = (
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
) => {
	let instant = Date.UTC(year, month - 1, day, hour, minute, 0)

	for (let index = 0; index < 2; index += 1) {
		const offset = getTimeZoneOffsetMs(new Date(instant), FELLOWSHIP_TIME_ZONE)
		instant = Date.UTC(year, month - 1, day, hour, minute, 0) - offset
	}

	return new Date(instant)
}

export const getSecondThursdayDate = (year: number, month: number) => {
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
	const daysUntilThursday = (4 - firstWeekday + 7) % 7
	const firstThursday = 1 + daysUntilThursday

	return firstThursday + 7
}

export const getPrayerMeetingAt = (year: number, month: number) => {
	const day = getSecondThursdayDate(year, month)

	return londonCivilToUtc(
		year,
		month,
		day,
		PRAYER_MEETING_HOUR,
		PRAYER_MEETING_MINUTE,
	)
}

const getLondonYearMonth = (date: Date) => {
	const formatter = new Intl.DateTimeFormat('en-GB', {
		timeZone: FELLOWSHIP_TIME_ZONE,
		year: 'numeric',
		month: 'numeric',
	})
	const parts = formatter.formatToParts(date)
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

	return {
		year: Number(values.year),
		month: Number(values.month),
	}
}

export const getNextPrayerMeeting = (from = new Date()) => {
	const { year, month } = getLondonYearMonth(from)
	const currentMonthMeeting = getPrayerMeetingAt(year, month)

	if (from.getTime() < currentMonthMeeting.getTime()) {
		return currentMonthMeeting
	}

	if (month === 12) {
		return getPrayerMeetingAt(year + 1, 1)
	}

	return getPrayerMeetingAt(year, month + 1)
}

export const getUpcomingPrayerMeetings = (count: number, from = new Date()) => {
	if (!Number.isInteger(count) || count < 1) {
		throw new Error('Upcoming prayer meeting count must be a positive integer')
	}

	const meetings: Date[] = []
	let cursor = from

	for (let index = 0; index < count; index += 1) {
		const next = getNextPrayerMeeting(cursor)
		meetings.push(next)
		cursor = new Date(next.getTime() + 1000)
	}

	return meetings
}

export const londonDateAndTimeToUtc = (date: string, time: string) => {
	const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
	const timeMatch = /^(\d{2}):(\d{2})$/.exec(time)

	if (!dateMatch || !timeMatch) {
		return null
	}

	const year = Number(dateMatch[1])
	const month = Number(dateMatch[2])
	const day = Number(dateMatch[3])
	const hour = Number(timeMatch[1])
	const minute = Number(timeMatch[2])

	if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
		return null
	}

	const instant = londonCivilToUtc(year, month, day, hour, minute)
	const roundTrip = utcToLondonDateAndTime(instant)

	if (roundTrip.date !== date || roundTrip.time !== time) {
		return null
	}

	return instant
}

export const utcToLondonDateAndTime = (value: Date) => {
	const formatter = new Intl.DateTimeFormat('en-GB', {
		timeZone: FELLOWSHIP_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	})
	const parts = formatter.formatToParts(value)
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

	return {
		date: `${values.year}-${values.month}-${values.day}`,
		time: `${values.hour}:${values.minute}`,
	}
}
