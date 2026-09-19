import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminEvents, getEventsPage } from '@/server/services/event-service'
import { eventTypeLabel, formatLondonDateTime } from '@/lib/events/display'
import { buildGoogleCalendarUrl } from '@/lib/events/calendar'
import { AlertNotice } from '@/components/alert-notice'
import { ListPagination } from '@/components/list-pagination'
import { PageHeader } from '@/components/page-header'
import {
	DEFAULT_LIST_PAGE_SIZE,
	normalisePage,
	parsePageParam,
	totalPagesFor,
} from '@/lib/list-pagination'
import {
	cardClass,
	emptyStateClass,
	eyebrowClass,
	heroPanelClass,
	navLinkClass,
	pageMainClass,
	primaryButtonClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Events',
}

interface EventsPageProps {
	searchParams: {
		page?: string
		updated?: string
		deleted?: string
		error?: string
	}
}

const eventsHref = (page: number) => (page > 1 ? `/events?page=${page}` : '/events')

const EventsPage = async ({ searchParams }: EventsPageProps) => {
	const page = await getEventsPage()

	if (!page) {
		redirect('/login')
	}

	const nextItem = page.items[0]
	const storedEvents = page.isAdmin ? ((await getAdminEvents()) ?? []) : []
	const pageSize = DEFAULT_LIST_PAGE_SIZE
	const totalPages = totalPagesFor(page.items.length, pageSize)
	const currentPage = normalisePage(parsePageParam(searchParams.page), totalPages)
	const start = (currentPage - 1) * pageSize
	const visibleItems = page.items.slice(start, start + pageSize)

	return (
		<main className={pageMainClass}>
			<PageHeader
				eyebrow="Gathering"
				title="Events"
				lead="The monthly prayer meeting is the second Thursday of every month at 8:00 PM, Europe/London. Other fellowship gatherings are listed with it."
				actions={
					page.isAdmin ? (
						<Link href="/admin/events/new" className={primaryButtonClass}>
							Add event
						</Link>
					) : undefined
				}
			/>

			{searchParams.updated === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						Your changes have been saved.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.deleted === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Removed">
						That item has been removed.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save">
						That event could not be saved.
					</AlertNotice>
				</div>
			) : null}

			{nextItem ? (
				<section className={heroPanelClass}>
					<div className="absolute inset-x-0 top-0 h-1 bg-gold-500" aria-hidden="true" />
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
						Next gathering
					</p>
					<h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
						{nextItem.title}
					</h2>
					<p className="mt-4 text-lg text-white">
						{formatLondonDateTime(nextItem.startAt)}
					</p>
					{nextItem.description ? (
						<p className="mt-2 text-sm text-white/70">{nextItem.description}</p>
					) : null}
				</section>
			) : (
				<p className={emptyStateClass}>No upcoming gatherings are listed yet.</p>
			)}

			<section className="mt-10">
				<h2 className="font-serif text-2xl font-semibold text-navy-950">
					Upcoming
				</h2>
				{visibleItems.length === 0 ? (
					<p className={emptyStateClass}>No upcoming gatherings are listed yet.</p>
				) : (
					<>
						<ul className="mt-6 space-y-4">
							{visibleItems.map((item) => (
								<li key={item.id} className={cardClass}>
									<p className={eyebrowClass}>{eventTypeLabel(item.eventType)}</p>
									<h3 className="mt-3 font-serif text-xl font-semibold text-navy-950">
										{item.title}
									</h3>
									<p className="mt-2 text-navy-800">
										{formatLondonDateTime(item.startAt)}
									</p>
									{item.endAt ? (
										<p className="mt-1 text-sm text-navy-800/70">
											Ends {formatLondonDateTime(item.endAt)}
										</p>
									) : null}
									{item.description ? (
										<p className="mt-3 text-sm leading-6 text-navy-800/80">
											{item.description}
										</p>
									) : null}
									<p className="mt-4 flex flex-wrap gap-4">
										<Link
											href={`/events/calendar?id=${encodeURIComponent(item.id)}`}
											className={navLinkClass}
										>
											Add to calendar
										</Link>
										<a
											href={buildGoogleCalendarUrl({
												title: item.title,
												description: item.description ?? '',
												startAt: new Date(item.startAt),
												endAt: item.endAt ? new Date(item.endAt) : null,
											})}
											className={navLinkClass}
											rel="noreferrer"
											target="_blank"
										>
											Google Calendar
										</a>
									</p>
									{page.isAdmin && !item.isCalculated ? (
										<p className="mt-4">
											<Link href={`/admin/events/${item.id}`} className={navLinkClass}>
												Edit event
											</Link>
										</p>
									) : null}
								</li>
							))}
						</ul>
						<ListPagination
							page={currentPage}
							totalPages={totalPages}
							total={page.items.length}
							pageSize={pageSize}
							hrefForPage={eventsHref}
							label="Upcoming event pages"
							className="mt-6 flex flex-col gap-3 text-sm text-navy-800 sm:flex-row sm:items-center sm:justify-between"
						/>
					</>
				)}
			</section>

			{page.isAdmin ? (
				<section className="mt-10">
					<h2 className="font-serif text-2xl font-semibold text-navy-950">
						Stored events
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-navy-800/80">
						Prayer meetings are calculated and are not listed here. Edit or
						remove only gatherings that were added by an administrator.
					</p>
					{storedEvents.length === 0 ? (
						<p className={emptyStateClass}>No stored events have been added yet.</p>
					) : (
						<ul className="mt-6 space-y-4">
							{storedEvents.map((event) => (
								<li key={event.id} className={cardClass}>
									<p className={eyebrowClass}>{eventTypeLabel(event.event_type)}</p>
									<h3 className="mt-3 font-serif text-xl font-semibold text-navy-950">
										{event.title}
									</h3>
									<p className="mt-2 text-navy-800">
										{formatLondonDateTime(event.start_at)}
									</p>
									<p className="mt-4">
										<Link
											href={`/admin/events/${event.id}`}
											className={navLinkClass}
										>
											Edit event
										</Link>
									</p>
								</li>
							))}
						</ul>
					)}
				</section>
			) : null}
		</main>
	)
}

export default EventsPage
