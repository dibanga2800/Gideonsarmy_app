import { describe, expect, it } from 'vitest'
import {
	getNextPrayerMeeting,
	getPrayerMeetingAt,
	getSecondThursdayDate,
	getUpcomingPrayerMeetings,
	londonDateAndTimeToUtc,
	utcToLondonDateAndTime,
} from './prayer-meeting'

describe('prayer meeting date', () => {
	it('calculates the second Thursday of a month', () => {
		expect(getSecondThursdayDate(2026, 3)).toBe(12)
		expect(getSecondThursdayDate(2026, 9)).toBe(10)
		expect(getSecondThursdayDate(2026, 10)).toBe(8)
	})

	it('sets the meeting at 20:00 Europe/London, including around DST', () => {
		const marchMeeting = getPrayerMeetingAt(2026, 3)
		const octoberMeeting = getPrayerMeetingAt(2026, 10)

		expect(marchMeeting.toISOString()).toBe('2026-03-12T20:00:00.000Z')
		expect(octoberMeeting.toISOString()).toBe('2026-10-08T19:00:00.000Z')
	})

	it('returns this month meeting when it is still in the future', () => {
		const beforeMeeting = new Date('2026-10-08T18:00:00.000Z')
		expect(getNextPrayerMeeting(beforeMeeting).toISOString()).toBe(
			'2026-10-08T19:00:00.000Z',
		)
	})

	it('returns next month when this month meeting has passed', () => {
		const afterMeeting = new Date('2026-10-08T19:00:00.000Z')
		expect(getNextPrayerMeeting(afterMeeting).toISOString()).toBe(
			'2026-11-12T20:00:00.000Z',
		)
	})

	it('lists upcoming meetings without storing individual dates', () => {
		const from = new Date('2026-10-08T18:00:00.000Z')
		const meetings = getUpcomingPrayerMeetings(3, from)

		expect(meetings.map((meeting) => meeting.toISOString())).toEqual([
			'2026-10-08T19:00:00.000Z',
			'2026-11-12T20:00:00.000Z',
			'2026-12-10T20:00:00.000Z',
		])
	})

	it('crosses the year boundary for the following meeting', () => {
		const from = new Date('2026-12-10T20:00:00.000Z')
		expect(getUpcomingPrayerMeetings(1, from)[0]?.toISOString()).toBe(
			'2027-01-14T20:00:00.000Z',
		)
	})

	it('interprets admin-entered times as Europe/London', () => {
		const utc = londonDateAndTimeToUtc('2026-10-08', '20:00')

		expect(utc).not.toBeNull()
		if (!utc) {
			return
		}

		expect(utc.toISOString()).toBe('2026-10-08T19:00:00.000Z')
		expect(utcToLondonDateAndTime(utc)).toEqual({
			date: '2026-10-08',
			time: '20:00',
		})
	})

	it('rejects a calendar date that does not exist', () => {
		expect(londonDateAndTimeToUtc('2026-04-31', '20:00')).toBeNull()
	})
})
