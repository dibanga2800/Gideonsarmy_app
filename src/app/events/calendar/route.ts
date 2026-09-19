import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentSession } from '@/server/services/auth-service'
import { canAccessMemberApp } from '@/lib/auth/access'
import { findEventById } from '@/server/repositories/event-repository'
import { getUpcomingPrayerMeetings } from '@/lib/dates/prayer-meeting'
import { buildIcs } from '@/lib/events/calendar'
import { eventIdSchema } from '@/lib/validation/event'

export const GET = async (request: NextRequest) => {
	const session = await getCurrentSession()
	if (!canAccessMemberApp(session.access)) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	const id = request.nextUrl.searchParams.get('id') ?? ''
	const calendar = await resolveCalendarEvent(id)

	if (!calendar) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	return new NextResponse(calendar.ics, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${calendar.filename}"`,
			'Cache-Control': 'private, no-store',
		},
	})
}

const resolveCalendarEvent = async (id: string) => {
	if (id.startsWith('prayer-')) {
		const iso = id.slice('prayer-'.length)
		const startAt = new Date(iso)
		if (Number.isNaN(startAt.getTime())) {
			return null
		}

		const matches = getUpcomingPrayerMeetings(8).some(
			(meeting) => meeting.toISOString() === startAt.toISOString(),
		)
		if (!matches) {
			return null
		}

		return {
			filename: 'prayer-meeting.ics',
			ics: buildIcs({
				id,
				title: 'Monthly prayer meeting',
				description: 'Second Thursday of every month at 8:00 PM, Europe/London.',
				startAt,
				endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
			}),
		}
	}

	const parsed = eventIdSchema.safeParse(id)
	if (!parsed.success) {
		return null
	}

	const event = await findEventById(parsed.data)
	if (!event) {
		return null
	}

	return {
		filename: 'fellowship-event.ics',
		ics: buildIcs({
			id: event.id,
			title: event.title,
			description: event.description ?? '',
			startAt: new Date(event.start_at),
			endAt: event.end_at ? new Date(event.end_at) : null,
		}),
	}
}
