import { summariseDuesCompliance } from '@/lib/dues/compliance'
import { getLedgerYear, filterDuesForYear } from '@/lib/dates/dues-year'
import { monthCelebrationsFromSources } from '@/lib/celebrations/month-list'
import {
	anniversaryMonthDay,
	getLondonYearMonthDay,
	isCelebrationInLondonMonth,
	isCelebrationOnLondonDate,
	isCelebrationSevenDaysBefore,
	formatCelebrationDay,
	londonDateKey,
	nextLondonYearMonth,
} from '@/lib/dates/celebration'
import { buildMonthCelebrationDigestsForRecipient } from '@/lib/notifications/celebration-digest'
import { getUpcomingPrayerMeetings } from '@/lib/dates/prayer-meeting'
import { formatLondonDateTime } from '@/lib/events/display'
import { logEvent } from '@/lib/logging'
import {
	anniversaryCelebrantEmail,
	anniversaryFellowshipEmail,
	birthdayCelebrantEmail,
	birthdayFellowshipEmail,
	duesReminderEmail,
	eventReminderEmail,
	memberLabel,
} from '@/lib/notifications/email-templates'
import {
	duesReminderIdempotencyKey,
	isTwoDaysBeforeEvent,
	isWithinTwoHoursBeforeEvent,
	shouldSendMonthlyDuesReminder,
	TWO_HOURS_MS,
} from '@/lib/notifications/schedule'
import {
	enqueueInAppNotices,
	enqueueNotifications,
	sendDueNotifications,
	type ScheduledNotification,
} from '@/server/notifications/notification-service'
import {
	listActiveMembersForJobs,
	listOutstandingDuesForJobs,
	listStoredEventsForJobs,
} from '@/server/repositories/job-repository'
import type { Profile } from '@/types/database'

export const runScheduledJobs = async (now = new Date()) => {
	const members = await listActiveMembersForJobs()
	const planned = [
		...(await buildDuesReminderNotifications(members, now)),
		...(await buildEventNotices(members, now)),
	]

	const enqueued = await enqueueNotifications(planned)
	const inApp = await enqueueInAppNotices(buildMonthCelebrationDigests(members, now))
	const sendResult = await sendDueNotifications(now, {
		types: ['DUES_REMINDER', 'EVENT_REMINDER', 'MEMBER_INVITE'],
	})

	logEvent({
		operation: 'jobs.notifications',
		status: 'ok',
	})

	return {
		enqueued: enqueued + inApp,
		...sendResult,
	}
}

const celebrationNotificationTypes = [
	'BIRTHDAY_CELEBRANT',
	'BIRTHDAY_FELLOWSHIP',
	'ANNIVERSARY_CELEBRANT',
	'ANNIVERSARY_FELLOWSHIP',
] as const

export const runScheduledCelebrationJobs = async (now = new Date()) => {
	const members = await listActiveMembersForJobs()
	const notices = buildCelebrationNotices(members, { now })
	const enqueued = await enqueueNotifications(notices)
	const sendResult = await sendDueNotifications(now, {
		types: [...celebrationNotificationTypes],
	})

	logEvent({
		operation: 'jobs.celebrations',
		status: sendResult.failed > 0 ? 'error' : 'ok',
		errorCategory: sendResult.failed > 0 ? 'email' : undefined,
	})

	return {
		enqueued,
		...sendResult,
	}
}

export const buildDuesReminderNotifications = async (
	members: Profile[],
	now = new Date(),
	force = false,
) => {
	if (!shouldSendMonthlyDuesReminder(now, force)) {
		return [] as ScheduledNotification[]
	}

	const year = getLedgerYear(now)
	const outstanding = filterDuesForYear(await listOutstandingDuesForJobs(), year)
	const byMember = new Map<string, typeof outstanding>()

	for (const row of outstanding) {
		const current = byMember.get(row.member_id) ?? []
		current.push(row)
		byMember.set(row.member_id, current)
	}

	const items: ScheduledNotification[] = []

	for (const member of members) {
		const rows = byMember.get(member.id) ?? []
		const compliance = summariseDuesCompliance(rows)
		if (compliance.isUpToDate) {
			continue
		}

		const mail = duesReminderEmail({
			firstName: member.first_name,
			owingMonths: compliance.owingMonths,
			outstandingPence: compliance.outstandingPence,
			year,
			seed: `dues:${member.id}:${year}:${londonDateKey(now)}`,
		})

		items.push({
			memberId: member.id,
			type: 'DUES_REMINDER',
			title: mail.subject,
			message: mail.text,
			scheduledAt: now.toISOString(),
			idempotencyKey: duesReminderIdempotencyKey(member.id, now),
		})
	}

	return items
}

const buildMonthCelebrationDigests = (members: Profile[], now: Date) => {
	const currentDate = getLondonYearMonthDay(now)
	const upcomingDate = nextLondonYearMonth(now)
	const current = monthCelebrationsFromSources(
		members,
		currentDate.year,
		currentDate.month,
		now,
	)
	const upcoming = monthCelebrationsFromSources(
		members,
		upcomingDate.year,
		upcomingDate.month,
		now,
	)

	return members.flatMap((member) =>
		buildMonthCelebrationDigestsForRecipient(member.id, current, upcoming, now),
	)
}

export type CelebrationNoticeScope = 'scheduled' | 'this_month'

export const buildCelebrationNotices = (
	members: Profile[],
	options: { now?: Date; scope?: CelebrationNoticeScope } = {},
) => {
	const now = options.now ?? new Date()
	const scope = options.scope ?? 'scheduled'
	const today = getLondonYearMonthDay(now)
	const year = today.year
	const manualKey = scope === 'this_month' ? `:manual:${londonDateKey(now)}` : ''
	const items: ScheduledNotification[] = []

	for (const member of members) {
		if (member.birth_month && member.birth_day) {
			const dayLabel = formatCelebrationDay(member.birth_month, member.birth_day)
			const isToday = Boolean(
				dayLabel && isCelebrationOnLondonDate(member.birth_month, member.birth_day, now),
			)
			const isThisMonth = Boolean(
				dayLabel && isCelebrationInLondonMonth(member.birth_month, member.birth_day, now),
			)
			const sendBirthday =
				scope === 'this_month'
					? isThisMonth
					: isToday ||
						Boolean(
							dayLabel &&
								isCelebrationSevenDaysBefore(member.birth_month, member.birth_day, now),
						)

			if (dayLabel && sendBirthday) {
				const upcoming =
					scope === 'scheduled' &&
					!isToday &&
					isCelebrationSevenDaysBefore(member.birth_month, member.birth_day, now)
				const mail = birthdayCelebrantEmail(
					member.first_name,
					upcoming ? `the coming ${dayLabel}` : dayLabel,
					upcoming
						? `birthday-celebrant:${member.id}:${year}:week`
						: `birthday-celebrant:${member.id}:${year}${manualKey}`,
				)
				items.push({
					memberId: member.id,
					type: 'BIRTHDAY_CELEBRANT',
					title: mail.subject,
					message: mail.text,
					scheduledAt: now.toISOString(),
					idempotencyKey: upcoming
						? `birthday:${member.id}:${year}:week`
						: `birthday:${member.id}:${year}${manualKey}`,
				})

				if (isToday || scope === 'this_month') {
					for (const other of members) {
						if (other.id === member.id) {
							continue
						}

						const notice = birthdayFellowshipEmail(
							memberLabel(member),
							dayLabel,
							`birthday-fellowship:${member.id}:${year}:${other.id}${manualKey}`,
						)
						items.push({
							memberId: other.id,
							type: 'BIRTHDAY_FELLOWSHIP',
							title: notice.subject,
							message: notice.text,
							scheduledAt: now.toISOString(),
							idempotencyKey: `birthday-fellowship:${member.id}:${year}:${other.id}${manualKey}`,
						})
					}
				}
			}
		}

		const anniversary = anniversaryMonthDay(member.wedding_anniversary)
		if (!anniversary) {
			continue
		}

		const dayLabel = formatCelebrationDay(anniversary.month, anniversary.day)
		if (!dayLabel) {
			continue
		}

		const isToday = isCelebrationOnLondonDate(anniversary.month, anniversary.day, now)
		const isThisMonth = isCelebrationInLondonMonth(anniversary.month, anniversary.day, now)
		const sendAnniversary =
			scope === 'this_month'
				? isThisMonth
				: isToday || isCelebrationSevenDaysBefore(anniversary.month, anniversary.day, now)

		if (!sendAnniversary) {
			continue
		}

		const upcoming =
			scope === 'scheduled' &&
			!isToday &&
			isCelebrationSevenDaysBefore(anniversary.month, anniversary.day, now)
		const mail = anniversaryCelebrantEmail(
			member.first_name,
			upcoming ? `the coming ${dayLabel}` : dayLabel,
			member.spouse_name,
			upcoming
				? `anniversary-celebrant:${member.id}:${year}:week`
				: `anniversary-celebrant:${member.id}:${year}${manualKey}`,
		)
		items.push({
			memberId: member.id,
			type: 'ANNIVERSARY_CELEBRANT',
			title: mail.subject,
			message: mail.text,
			scheduledAt: now.toISOString(),
			idempotencyKey: upcoming
				? `anniversary:${member.id}:${year}:week`
				: `anniversary:${member.id}:${year}${manualKey}`,
		})

		if (isToday || scope === 'this_month') {
			for (const other of members) {
				if (other.id === member.id) {
					continue
				}

				const notice = anniversaryFellowshipEmail(
					memberLabel(member),
					dayLabel,
					`anniversary-fellowship:${member.id}:${year}:${other.id}${manualKey}`,
				)
				items.push({
					memberId: other.id,
					type: 'ANNIVERSARY_FELLOWSHIP',
					title: notice.subject,
					message: notice.text,
					scheduledAt: now.toISOString(),
					idempotencyKey: `anniversary-fellowship:${member.id}:${year}:${other.id}${manualKey}`,
				})
			}
		}
	}

	return items
}

const buildEventNotices = async (members: Profile[], now: Date) => {
	const stored = await listStoredEventsForJobs()
	const prayer = getUpcomingPrayerMeetings(6, now)
	const items: ScheduledNotification[] = []

	const gatherings = [
		...stored.map((event) => ({
			id: event.id,
			title: event.title,
			startAt: new Date(event.start_at),
		})),
		...prayer.map((meeting) => ({
			id: `prayer-${meeting.toISOString()}`,
			title: 'Monthly prayer meeting',
			startAt: meeting,
		})),
	]

	for (const gathering of gatherings) {
		if (gathering.startAt.getTime() <= now.getTime()) {
			continue
		}

		const twoHoursBefore = new Date(gathering.startAt.getTime() - TWO_HOURS_MS)
		const when = formatLondonDateTime(gathering.startAt)

		if (isTwoDaysBeforeEvent(gathering.startAt, now)) {
			for (const member of members) {
				const mail = eventReminderEmail({
					firstName: member.first_name,
					title: gathering.title,
					whenLabel: when,
					lead: 'In two days,',
					seed: `event:${gathering.id}:2d:${member.id}`,
				})
				items.push({
					memberId: member.id,
					type: 'EVENT_REMINDER',
					title: mail.subject,
					message: mail.text,
					scheduledAt: now.toISOString(),
					idempotencyKey: `event:${gathering.id}:2d:${member.id}`,
				})
			}
		}

		if (isWithinTwoHoursBeforeEvent(gathering.startAt, now)) {
			for (const member of members) {
				const mail = eventReminderEmail({
					firstName: member.first_name,
					title: gathering.title,
					whenLabel: when,
					lead: 'In two hours,',
					seed: `event:${gathering.id}:2h:${member.id}`,
				})
				items.push({
					memberId: member.id,
					type: 'EVENT_REMINDER',
					title: mail.subject,
					message: mail.text,
					scheduledAt: twoHoursBefore.toISOString(),
					idempotencyKey: `event:${gathering.id}:2h:${member.id}`,
				})
			}
		}
	}

	return items
}

export const enqueueAndSend = async (items: ScheduledNotification[], now = new Date()) => {
	const enqueued = await enqueueNotifications(items)
	const sendResult = await sendDueNotifications(now)
	return { enqueued, ...sendResult }
}
