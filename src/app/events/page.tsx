import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminEvents, getEventsPage } from '@/server/services/event-service'
import { eventTypeLabel, formatLondonDateTime } from '@/lib/events/display'
import { buildGoogleCalendarUrl } from '@/lib/events/calendar'
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { DateBlock, formatLondonTime, formatLondonWeekdayDate } from '@/components/date-block'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { ListPagination } from '@/components/list-pagination'
import { PageHeader } from '@/components/page-header'
import { SectionCard } from '@/components/section-card'
import { StatusBadge } from '@/components/status-badge'
import {
	DEFAULT_LIST_PAGE_SIZE,
	normalisePage,
	parsePageParam,
	totalPagesFor,
} from '@/lib/list-pagination'
import {
	ghostButtonClass,
	navLinkClass,
	pageMainClass,
	primaryButtonClass,
	smallButtonClass,
	tableClass,
	tdClass,
	thClass,
	theadClass,
	trClass,
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

interface CalendarLinksProps {
	id: string
	title: string
	description: string | null
	startAt: string
	endAt: string | null
	dark?: boolean
}

const CalendarLinks = ({ id, title, description, startAt, endAt, dark = false }: CalendarLinksProps) => {
	const linkClass = dark
		? 'inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300'
		: `${ghostButtonClass} ${smallButtonClass}`

	return (
		<div className="flex flex-wrap gap-2">
			<Link href={`/events/calendar?id=${encodeURIComponent(id)}`} className={linkClass}>
				<Icon name="calendar" className="h-4 w-4" />
				Add to calendar
			</Link>
			<a
				href={buildGoogleCalendarUrl({
					title,
					description: description ?? '',
					startAt: new Date(startAt),
					endAt: endAt ? new Date(endAt) : null,
				})}
				className={linkClass}
				rel="noreferrer"
				target="_blank"
			>
				Google Calendar
				<span className="sr-only"> (opens in a new tab)</span>
			</a>
		</div>
	)
}

const eventsHref = (page: number) => (page > 1 ? `/events?page=${page}` : '/events')

const EventsPage = async ({ searchParams }: EventsPageProps) => {
	const page = await getEventsPage()

	if (!page) {
		redirect('/login')
	}

	const nextItem = page.items[0]
	const storedEvents = page.isAdmin ? ((await getAdminEvents()) ?? []) : []
	const laterItems = page.items.slice(1)
	const pageSize = DEFAULT_LIST_PAGE_SIZE
	const totalPages = totalPagesFor(laterItems.length, pageSize)
	const currentPage = normalisePage(parsePageParam(searchParams.page), totalPages)
	const start = (currentPage - 1) * pageSize
	const visibleItems = laterItems.slice(start, start + pageSize)

	return (
		<main className={pageMainClass}>
			<PageHeader
				title="Events"
				description="Prayer meetings are on the second Thursday of every month at 8pm. Other fellowship gatherings appear alongside them. All times are UK time."
				actions={
					page.isAdmin ? (
						<Link href="/admin/events/new" className={primaryButtonClass}>
							<Icon name="plus" className="h-4 w-4" />
							Add event
						</Link>
					) : undefined
				}
			/>

			<NoticeStack>
				{searchParams.updated === '1' ? (
					<AlertNotice kind="success" title="Event saved">
						Your changes have been saved.
					</AlertNotice>
				) : null}
				{searchParams.deleted === '1' ? (
					<AlertNotice kind="success" title="Event deleted">
						The gathering has been removed from the list.
					</AlertNotice>
				) : null}
				{searchParams.error ? (
					<AlertNotice kind="danger" title="Event not saved">
						Check the title, date and time, then try again.
					</AlertNotice>
				) : null}
			</NoticeStack>

			{nextItem ? (
				<section
					aria-labelledby="next-gathering"
					className="lamplight rounded-2xl p-5 text-white shadow-raised sm:p-7"
				>
					<p className="text-sm text-white/60">Next gathering</p>
					<div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
						<DateBlock value={nextItem.startAt} tone="dark" />
						<div className="min-w-0 flex-1">
							<h2 id="next-gathering" className="font-serif text-2xl font-semibold tracking-tight">
								{nextItem.title}
							</h2>
							<p className="mt-1 text-sm text-white/75">
								{formatLondonWeekdayDate(nextItem.startAt)} at {formatLondonTime(nextItem.startAt)}
								{nextItem.endAt ? `, until ${formatLondonTime(nextItem.endAt)}` : ''}
							</p>
							{nextItem.description ? (
								<p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{nextItem.description}</p>
							) : null}
						</div>
					</div>
					<div className="mt-5 border-t border-white/10 pt-5">
						<CalendarLinks {...nextItem} dark />
					</div>
				</section>
			) : (
				<EmptyState icon="calendar" title="Nothing scheduled yet">
					Upcoming gatherings will be listed here.
				</EmptyState>
			)}

			{laterItems.length > 0 ? (
				<SectionCard title="Coming up" className="mt-5" flush>
					<ul className="divide-y divide-cream-100">
						{visibleItems.map((item) => (
							<li key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:px-6">
								<DateBlock value={item.startAt} />
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="text-[0.9375rem] font-semibold text-navy-950">{item.title}</h3>
										{item.isCalculated ? null : (
											<StatusBadge tone="neutral" dot={false}>
												{eventTypeLabel(item.eventType)}
											</StatusBadge>
										)}
									</div>
									<p className="mt-0.5 text-sm text-slate-600">
										{formatLondonWeekdayDate(item.startAt)} at {formatLondonTime(item.startAt)}
										{item.endAt ? ` until ${formatLondonDateTime(item.endAt)}` : ''}
									</p>
									{item.description && !item.isCalculated ? (
										<p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{item.description}</p>
									) : null}
									<div className="-ml-3 mt-2 flex flex-wrap items-center gap-1">
										<CalendarLinks {...item} />
										{page.isAdmin && !item.isCalculated ? (
											<Link href={`/admin/events/${item.id}`} className={`${ghostButtonClass} ${smallButtonClass}`}>
												Edit
											</Link>
										) : null}
									</div>
								</div>
							</li>
						))}
					</ul>
					<ListPagination
						page={currentPage}
						totalPages={totalPages}
						total={laterItems.length}
						pageSize={pageSize}
						hrefForPage={eventsHref}
						label="Upcoming event pages"
					/>
				</SectionCard>
			) : null}

			{page.isAdmin ? (
				<SectionCard
					title="Events added by administrators"
					description="Prayer meetings are calculated automatically, so only one-off gatherings appear here."
					className="mt-5"
					flush
				>
					{storedEvents.length === 0 ? (
						<EmptyState
							icon="calendar"
							title="No events added yet"
							compact
							action={
								<Link href="/admin/events/new" className={`${primaryButtonClass} ${smallButtonClass}`}>
									Add event
								</Link>
							}
						/>
					) : (
						<div className="overflow-x-auto">
							<table className={tableClass}>
								<caption className="sr-only">Stored events</caption>
								<thead className={theadClass}>
									<tr>
										<th scope="col" className={thClass}>Event</th>
										<th scope="col" className={thClass}>Type</th>
										<th scope="col" className={thClass}>Starts</th>
										<th scope="col" className={thClass}>
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{storedEvents.map((event) => (
										<tr key={event.id} className={trClass}>
											<td className={`${tdClass} font-medium`}>{event.title}</td>
											<td className={`${tdClass} text-slate-600`}>{eventTypeLabel(event.event_type)}</td>
											<td className={`${tdClass} whitespace-nowrap text-slate-600`}>
												{formatLondonDateTime(event.start_at)}
											</td>
											<td className={`${tdClass} text-right`}>
												<Link href={`/admin/events/${event.id}`} className={navLinkClass}>
													Edit
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</SectionCard>
			) : null}
		</main>
	)
}

export default EventsPage
