import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { DeleteEventForm } from '@/components/delete-event-form'
import { EventForm } from '@/components/event-form'
import { AlertNotice } from '@/components/alert-notice'
import { deleteEventAction, updateEventAction } from '@/server/actions/event-actions'
import { getAdminEvent } from '@/server/services/event-service'
import { eventIdSchema } from '@/lib/validation/event'
import {
	cardComfortClass,
	eyebrowClass,
	navLinkClass,
	pageContentClass,
	pageLeadWideClass,
	pageTitleClass,
} from '@/lib/ui'

interface EditEventPageProps {
	params: { id: string }
	searchParams: {
		error?: string
	}
}

export const generateMetadata = async (): Promise<Metadata> => ({
	title: 'Edit event',
})

const EditEventPage = async ({ params, searchParams }: EditEventPageProps) => {
	const parsedId = eventIdSchema.safeParse(params.id)
	if (!parsedId.success) {
		notFound()
	}

	const event = await getAdminEvent(parsedId.data)

	if (!event) {
		redirect('/events')
	}

	return (
		<main className={pageContentClass}>
			<p className="mb-6">
				<Link href="/events" className={navLinkClass}>
					Back to events
				</Link>
			</p>
			<p className={eyebrowClass}>Administration</p>
			<h1 className={`${pageTitleClass} mt-3`}>Edit event</h1>
			<p className={pageLeadWideClass}>{event.title}</p>
			{searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save">
						That event could not be updated. Check the details and try again.
					</AlertNotice>
				</div>
			) : null}
			<section className={`${cardComfortClass} mt-8`}>
				<EventForm
					action={updateEventAction}
					event={event}
					submitLabel="Save changes"
				/>
			</section>
			<DeleteEventForm action={deleteEventAction} eventId={event.id} />
		</main>
	)
}

export default EditEventPage
