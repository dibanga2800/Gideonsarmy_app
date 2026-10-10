import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EventForm } from '@/components/event-form'
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { PageHeader } from '@/components/page-header'
import { SectionCard } from '@/components/section-card'
import { createEventAction } from '@/server/actions/event-actions'
import { getCurrentSession } from '@/server/services/auth-service'
import { canAccessAdmin } from '@/lib/auth/access'
import { pageNarrowClass } from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Add event',
}

interface NewEventPageProps {
	searchParams: {
		error?: string
	}
}

const NewEventPage = async ({ searchParams }: NewEventPageProps) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		redirect('/events')
	}

	return (
		<main className={pageNarrowClass}>
			<PageHeader
				back={{ href: '/events', label: 'Events' }}
				title="Add event"
				description="For one-off fellowship gatherings. Monthly prayer meetings are added automatically."
			/>
			<NoticeStack>
				{searchParams.error ? (
					<AlertNotice kind="danger" title="Event not saved">
						Check the title, date and time, then try again.
					</AlertNotice>
				) : null}
			</NoticeStack>
			<SectionCard>
				<EventForm action={createEventAction} submitLabel="Add event" />
			</SectionCard>
		</main>
	)
}

export default NewEventPage
