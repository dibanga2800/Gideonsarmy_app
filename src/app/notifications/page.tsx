import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOwnNotices } from '@/server/services/notice-service'
import { markNoticeReadAction } from '@/server/actions/notice-actions'
import { notificationTypeLabel } from '@/lib/notifications/display'
import { formatLondonDateTime } from '@/lib/events/display'
import { ListPagination } from '@/components/list-pagination'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { parsePageParam } from '@/lib/list-pagination'
import {
	cardClass,
	emptyStateClass,
	pageMainClass,
	secondaryButtonClass,
	statusPillClass,
	statusPillMutedClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Notices',
}

interface NoticesPageProps {
	searchParams: {
		page?: string
	}
}

const noticesHref = (page: number) => (page > 1 ? `/notifications?page=${page}` : '/notifications')

const NoticesPage = async ({ searchParams }: NoticesPageProps) => {
	const notices = await getOwnNotices({ page: parsePageParam(searchParams.page) })

	if (!notices) {
		redirect('/login')
	}

	return (
		<main className={pageMainClass}>
			<PageHeader
				eyebrow="Fellowship"
				title="Notices"
				lead="Birthday and wedding anniversary notices are built from the dates on each approved member's profile for this month and next month. Event reminders still appear when they are due. Celebration emails are sent on the day: the celebrant receives a personal greeting and other active members receive a separate message."
			/>
			{notices.items.length === 0 ? (
				<p className={emptyStateClass}>
					There are no notices yet. Birthday and anniversary dates must be saved on an
					approved member profile.
				</p>
			) : (
				<>
					<ul className="mt-8 space-y-4">
						{notices.items.map((notice) => (
							<li key={notice.id} className={cardClass}>
								<div className="flex flex-wrap items-center gap-2">
									<span className={statusPillClass}>
										{notificationTypeLabel(notice.notification_type)}
									</span>
									{notice.read_at ? (
										<span className={statusPillMutedClass}>Read</span>
									) : (
										<span className={statusPillClass}>New</span>
									)}
								</div>
								<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
									{notice.title}
								</h2>
								<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-navy-800">
									{notice.message}
								</p>
								<p className="mt-3 text-xs text-navy-800/70">
									{formatLondonDateTime(notice.scheduled_at)}
								</p>
								{notice.read_at ? null : (
									<form action={markNoticeReadAction} className="mt-4">
										<input type="hidden" name="notificationId" value={notice.id} />
										<PendingSubmitButton
											className={secondaryButtonClass}
											pendingLabel="Saving…"
										>
											Mark as read
										</PendingSubmitButton>
									</form>
								)}
							</li>
						))}
					</ul>
					<ListPagination
						page={notices.page}
						totalPages={notices.totalPages}
						total={notices.total}
						pageSize={notices.pageSize}
						hrefForPage={noticesHref}
						label="Notice pages"
						className="mt-6 flex flex-col gap-3 text-sm text-navy-800 sm:flex-row sm:items-center sm:justify-between"
					/>
				</>
			)}
		</main>
	)
}

export default NoticesPage
