import { canAccessAdmin, canAccessMemberApp } from '@/lib/auth/access'
import { logEvent } from '@/lib/logging'
import { getUpcomingPrayerMeetings } from '@/lib/dates/prayer-meeting'
import type { EventInput } from '@/lib/validation/event'
import type { EventType } from '@/types/roles'
import { getCurrentSession } from '@/server/services/auth-service'
import {
	createEventRecord,
	deleteEventRecord,
	findEventById,
	listStoredEventsForAdmin,
	listUpcomingStoredEvents,
	updateEventRecord,
} from '@/server/repositories/event-repository'

export type EventActionResult =
	| { ok: true; eventId?: string }
	| { ok: false; message: string }

const UPCOMING_PRAYER_COUNT = 6

const safeFailure = (message: string): EventActionResult => ({
	ok: false,
	message,
})

export type CalendarItem = {
	id: string
	title: string
	description: string | null
	eventType: EventType | 'PRAYER_MEETING'
	startAt: string
	endAt: string | null
	isCalculated: boolean
}

export const getEventsPage = async () => {
	const session = await getCurrentSession()

	if (!canAccessMemberApp(session.access)) {
		return null
	}

	const prayerMeetings = getUpcomingPrayerMeetings(UPCOMING_PRAYER_COUNT)
	const stored = await listUpcomingStoredEvents(new Date().toISOString())
	const items: CalendarItem[] = [
		...prayerMeetings.map((meeting) => ({
			id: `prayer-${meeting.toISOString()}`,
			title: 'Monthly prayer meeting',
			description: 'Second Thursday of every month at 8:00 PM, Europe/London.',
			eventType: 'PRAYER_MEETING' as const,
			startAt: meeting.toISOString(),
			endAt: null,
			isCalculated: true,
		})),
		...stored.map((event) => ({
			id: event.id,
			title: event.title,
			description: event.description,
			eventType: event.event_type,
			startAt: event.start_at,
			endAt: event.end_at,
			isCalculated: false,
		})),
	].sort((left, right) => left.startAt.localeCompare(right.startAt))

	return {
		items,
		isAdmin: canAccessAdmin(session.access),
	}
}

export const getAdminEvents = async () => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	return listStoredEventsForAdmin()
}

export const getAdminEvent = async (id: string) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	return findEventById(id)
}

export const createEvent = async (input: EventInput): Promise<EventActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'events.create',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to create events.')
	}

	const created = await createEventRecord(input)

	if (!created) {
		return safeFailure('The event could not be saved. Try again.')
	}

	logEvent({
		operation: 'events.create',
		status: 'ok',
	})

	return { ok: true, eventId: created.id }
}

export const updateEvent = async (
	id: string,
	input: EventInput,
): Promise<EventActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'events.update',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to update events.')
	}

	const updated = await updateEventRecord(id, input)

	if (!updated) {
		return safeFailure('The event could not be updated. Try again.')
	}

	logEvent({
		operation: 'events.update',
		status: 'ok',
	})

	return { ok: true, eventId: updated.id }
}

export const deleteEvent = async (id: string): Promise<EventActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'events.delete',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to delete events.')
	}

	const deleted = await deleteEventRecord(id)

	if (!deleted) {
		return safeFailure('The event could not be deleted. Try again.')
	}

	logEvent({
		operation: 'events.delete',
		status: 'ok',
	})

	return { ok: true }
}
