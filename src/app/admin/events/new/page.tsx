import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EventForm } from '@/components/event-form'
import { AlertNotice } from '@/components/alert-notice'
import { createEventAction } from '@/server/actions/event-actions'
import { getCurrentSession } from '@/server/services/auth-service'
import { canAccessAdmin } from '@/lib/auth/access'
import {
	cardComfortClass,
	eyebrowClass,
	navLinkClass,
	pageContentClass,
	pageLeadWideClass,
	pageTitleClass,
} from '@/lib/ui'

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
		<main className={pageContentClass}>
			<p className="mb-6">
				<Link href="/events" className={navLinkClass}>
					Back to events
				</Link>
			</p>
			<p className={eyebrowClass}>Administration</p>
			<h1 className={`${pageTitleClass} mt-3`}>Add event</h1>
			<p className={pageLeadWideClass}>
				Create a fellowship gathering. Prayer meeting dates stay calculated and
				are not added as individual rows.
			</p>
			{searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save">
						That event could not be saved. Check the details and try again.
					</AlertNotice>
				</div>
			) : null}
			<section className={`${cardComfortClass} mt-8`}>
				<EventForm action={createEventAction} submitLabel="Save event" />
			</section>
		</main>
	)
}

export default NewEventPage
