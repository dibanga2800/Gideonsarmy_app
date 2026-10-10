import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { DeleteEventForm } from '@/components/delete-event-form'
import { EventForm } from '@/components/event-form'
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { PageHeader } from '@/components/page-header'
import { SectionCard } from '@/components/section-card'
import { deleteEventAction, updateEventAction } from '@/server/actions/event-actions'
import { getAdminEvent } from '@/server/services/event-service'
import { eventIdSchema } from '@/lib/validation/event'
import { pageNarrowClass } from '@/lib/ui'

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
		<main className={pageNarrowClass}>
			<PageHeader back={{ href: '/events', label: 'Events' }} title="Edit event" description={event.title} />
			<NoticeStack>
				{searchParams.error ? (
					<AlertNotice kind="danger" title="Changes not saved">
						Check the title, date and time, then try again.
					</AlertNotice>
				) : null}
			</NoticeStack>
			<SectionCard>
				<EventForm action={updateEventAction} event={event} submitLabel="Save changes" />
			</SectionCard>
			<SectionCard
				title="Delete event"
				tone="danger"
				description="Removes the gathering from everyone's events list. This can't be undone."
				className="mt-5"
			>
				<DeleteEventForm action={deleteEventAction} eventId={event.id} />
			</SectionCard>
		</main>
	)
}

export default EditEventPage
