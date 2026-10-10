import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOwnNotices } from '@/server/services/notice-service'
import { markNoticeReadAction } from '@/server/actions/notice-actions'
import { notificationTypeLabel } from '@/lib/notifications/display'
import { formatLondonDateTime } from '@/lib/events/display'
import { EmptyState } from '@/components/empty-state'
import { Icon, type IconName } from '@/components/icons'
import { ListPagination } from '@/components/list-pagination'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { SectionCard } from '@/components/section-card'
import { parsePageParam } from '@/lib/list-pagination'
import { ghostButtonClass, pageNarrowClass, smallButtonClass } from '@/lib/ui'
import type { NotificationType } from '@/types/roles'

export const metadata: Metadata = {
	title: 'Notices',
}

interface NoticesPageProps {
	searchParams: {
		page?: string
	}
}

const noticeIcon = (type: NotificationType): IconName => {
	if (type === 'DUES_REMINDER') {
		return 'wallet'
	}
	if (type === 'EVENT_REMINDER') {
		return 'calendar'
	}
	if (type === 'MEMBER_INVITE') {
		return 'mail'
	}
	return 'gift'
}

const noticesHref = (page: number) => (page > 1 ? `/notifications?page=${page}` : '/notifications')

const NoticesPage = async ({ searchParams }: NoticesPageProps) => {
	const notices = await getOwnNotices({ page: parsePageParam(searchParams.page) })

	if (!notices) {
		redirect('/login')
	}

	const unread = notices.items.filter((notice) => !notice.read_at).length

	return (
		<main className={pageNarrowClass}>
			<PageHeader
				title="Notices"
				description="Birthdays and anniversaries for this month and next, plus event and dues reminders as they fall due."
			/>

			{notices.items.length === 0 ? (
				<EmptyState icon="bell" title="No notices yet">
					Notices appear once members have added birthdays and anniversaries to their profiles.
				</EmptyState>
			) : (
				<SectionCard
					title={unread > 0 ? `${unread} unread on this page` : 'All read'}
					flush
				>
					<ul className="divide-y divide-cream-100">
						{notices.items.map((notice) => {
							const isUnread = !notice.read_at
							return (
								<li
									key={notice.id}
									className={`relative flex gap-4 px-5 py-4 sm:px-6 ${isUnread ? 'bg-gold-100/30' : ''}`}
								>
									{isUnread ? (
										<span className="absolute inset-y-0 left-0 w-0.5 bg-gold-500" aria-hidden="true" />
									) : null}
									<span
										className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
											isUnread ? 'bg-white text-gold-600 ring-1 ring-gold-500/30' : 'bg-cream-100 text-slate-500'
										}`}
									>
										<Icon name={noticeIcon(notice.notification_type)} className="h-[1.125rem] w-[1.125rem]" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
											<h2 className={`text-sm text-navy-950 ${isUnread ? 'font-semibold' : 'font-medium'}`}>
												{notice.title}
												{isUnread ? <span className="sr-only"> (unread)</span> : null}
											</h2>
											<p className="text-xs text-slate-500">
												{notificationTypeLabel(notice.notification_type)},{' '}
												<time dateTime={notice.scheduled_at}>{formatLondonDateTime(notice.scheduled_at)}</time>
											</p>
										</div>
										<p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{notice.message}</p>
										{isUnread ? (
											<form action={markNoticeReadAction} className="-ml-3 mt-1">
												<input type="hidden" name="notificationId" value={notice.id} />
												<PendingSubmitButton
													className={`${ghostButtonClass} ${smallButtonClass}`}
													pendingLabel="Saving…"
												>
													<Icon name="check" className="h-4 w-4" />
													Mark as read
												</PendingSubmitButton>
											</form>
										) : null}
									</div>
								</li>
							)
						})}
					</ul>
					<ListPagination
						page={notices.page}
						totalPages={notices.totalPages}
						total={notices.total}
						pageSize={notices.pageSize}
						hrefForPage={noticesHref}
						label="Notice pages"
					/>
				</SectionCard>
			)}
		</main>
	)
}

export default NoticesPage
