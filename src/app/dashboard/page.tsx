import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/server/services/auth-service'
import { getOwnCurrentDues } from '@/server/services/dues-service'
import { getThisMonthCelebrations } from '@/server/services/celebration-service'
import { listMembersPageForAdmin } from '@/server/services/member-service'
import { getOwnUnreadNoticeCount } from '@/server/services/notice-service'
import { CelebrantsCard } from '@/components/celebrants-card'
import { DateBlock, formatLondonTime, formatLondonWeekdayDate } from '@/components/date-block'
import { DuesMonthStrip } from '@/components/dues-month-strip'
import { Icon } from '@/components/icons'
import { PageHeader } from '@/components/page-header'
import { SectionCard } from '@/components/section-card'
import { StatTile } from '@/components/stat-tile'
import { ComplianceBadge } from '@/components/status-badge'
import { getNextPrayerMeeting } from '@/lib/dates/prayer-meeting'
import { formatPenceAsGbp } from '@/lib/money'
import { pageMainClass, secondaryButtonClass } from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Overview',
}

const greeting = (from = new Date()) => {
	const hour = Number(
		new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hourCycle: 'h23' }).format(from),
	)
	if (hour < 12) {
		return 'Good morning'
	}
	return hour < 18 ? 'Good afternoon' : 'Good evening'
}

const DashboardPage = async () => {
	const session = await getCurrentSession()

	if (session.access.status !== 'member') {
		redirect('/login')
	}

	const isAdmin = session.access.isAdmin
	const nextPrayerMeeting = getNextPrayerMeeting()
	const [duesSummary, celebrants, unreadCount, pendingMembers] = await Promise.all([
		getOwnCurrentDues(),
		getThisMonthCelebrations(),
		getOwnUnreadNoticeCount(),
		isAdmin ? listMembersPageForAdmin({ status: 'PENDING', page: 1, pageSize: 1 }) : Promise.resolve(null),
	])
	const firstName = session.profile?.first_name?.trim() || 'brother'

	return (
		<main className={pageMainClass}>
			<PageHeader title={`${greeting()}, ${firstName}`} description="Here's where things stand this month." />

			<div className="grid gap-5 lg:grid-cols-3">
				<SectionCard
					title={duesSummary ? `Your dues for ${duesSummary.year}` : 'Your dues'}
					className="lg:col-span-2"
					actions={
						<Link href="/dues" className={secondaryButtonClass}>
							Dues and bank details
						</Link>
					}
				>
					{duesSummary ? (
						<>
							<div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
								<p className="text-3xl font-semibold tracking-tight text-navy-950">
									{duesSummary.compliance.isUpToDate
										? 'All paid to date'
										: `${formatPenceAsGbp(duesSummary.compliance.outstandingPence)} to pay`}
								</p>
								<ComplianceBadge isUpToDate={duesSummary.compliance.isUpToDate} />
							</div>
							<p className="mt-1 text-sm text-slate-600">
								{duesSummary.compliance.isUpToDate
									? `${formatPenceAsGbp(duesSummary.yearLedger.paidPence)} recorded so far this year. Thank you.`
									: `${duesSummary.compliance.owingMonths} ${duesSummary.compliance.owingMonths === 1 ? 'month' : 'months'} outstanding this year.`}
							</p>
							<div className="mt-5">
								<DuesMonthStrip cells={duesSummary.yearLedger.cells} year={duesSummary.year} />
							</div>
							{duesSummary.owingYears.length > 0 ? (
								<p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
									<Icon name="alert" className="mt-0.5 h-4 w-4 text-amber-600" />
									<span>
										There are also unpaid months from {duesSummary.owingYears.join(', ')}.{' '}
										<Link
											href={`/dues?year=${duesSummary.owingYears[0]}`}
											className="font-semibold underline underline-offset-2"
										>
											View {duesSummary.owingYears[0]}
										</Link>
									</span>
								</p>
							) : null}
						</>
					) : (
						<p className="text-sm text-slate-600">Your dues record isn&apos;t available right now.</p>
					)}
				</SectionCard>

				<section
					aria-labelledby="next-meeting-heading"
					className="relative flex flex-col overflow-hidden rounded-xl bg-navy-950 p-5 text-white shadow-card sm:p-6"
				>
					<h2 id="next-meeting-heading" className="text-base font-semibold">
						Next prayer meeting
					</h2>
					<div className="mt-5 flex items-center gap-4">
						<DateBlock value={nextPrayerMeeting} tone="dark" />
						<div>
							<p className="font-semibold">{formatLondonWeekdayDate(nextPrayerMeeting)}</p>
							<p className="mt-0.5 text-sm text-white/70">{formatLondonTime(nextPrayerMeeting)}, UK time</p>
						</div>
					</div>
					<p className="mt-5 text-sm leading-6 text-white/60">Second Thursday of every month.</p>
					<Link
						href="/events"
						className="mt-auto inline-flex items-center gap-1.5 self-start rounded-md pt-5 text-sm font-semibold text-gold-300 hover:text-gold-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
					>
						All gatherings
						<Icon name="arrow-right" className="h-4 w-4" />
					</Link>
				</section>
			</div>

			<div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				<StatTile
					label="Unread notices"
					value={unreadCount}
					detail={unreadCount === 0 ? "You're all caught up." : 'Birthdays, anniversaries and reminders.'}
					icon="bell"
					href="/notifications"
				/>
				<StatTile
					label={celebrants ? `Celebrating in ${celebrants.monthLabel.split(' ')[0]}` : 'Celebrations'}
					value={celebrants ? celebrants.birthdays.length + celebrants.anniversaries.length : '—'}
					detail={
						celebrants
							? `${celebrants.birthdays.length} ${celebrants.birthdays.length === 1 ? 'birthday' : 'birthdays'}, ${celebrants.anniversaries.length} ${celebrants.anniversaries.length === 1 ? 'anniversary' : 'anniversaries'}`
							: undefined
					}
					icon="gift"
					href="/celebrations"
				/>
				{isAdmin && pendingMembers ? (
					<StatTile
						label="Awaiting approval"
						value={pendingMembers.total}
						detail={pendingMembers.total === 0 ? 'No new members to review.' : 'New members to review.'}
						icon="users"
						href="/admin/members"
						tone={pendingMembers.total > 0 ? 'attention' : 'default'}
					/>
				) : (
					<StatTile
						label="Your profile"
						value={session.profile?.birth_month ? 'Dates added' : 'Add your birthday'}
						detail="Birthday and anniversary feed the celebration list."
						icon="user"
						href="/profile"
					/>
				)}
			</div>

			{celebrants ? (
				<div className="mt-5">
					<CelebrantsCard celebrations={celebrants} />
				</div>
			) : null}
		</main>
	)
}

export default DashboardPage
