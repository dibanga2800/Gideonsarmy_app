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
import { Icon, type IconName } from '@/components/icons'
import { HeroPanel } from '@/components/hero-panel'
import { SectionCard } from '@/components/section-card'
import { getNextPrayerMeeting } from '@/lib/dates/prayer-meeting'
import { formatPenceAsGbp } from '@/lib/money'
import { navLinkClass, pageMainClass } from '@/lib/ui'

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
	const pendingCount = pendingMembers?.total ?? 0
	const todos: Array<{ href: string; label: string; icon: IconName }> = [
		...(unreadCount > 0
			? [{ href: '/notifications', label: `${unreadCount} unread ${unreadCount === 1 ? 'notice' : 'notices'}`, icon: 'bell' as const }]
			: []),
		...(pendingCount > 0
			? [{ href: '/admin/members', label: `${pendingCount} ${pendingCount === 1 ? 'member' : 'members'} awaiting approval`, icon: 'users' as const }]
			: []),
		...(session.profile && !session.profile.birth_month
			? [{ href: '/profile', label: 'Add your birthday to your profile', icon: 'user' as const }]
			: []),
	]

	const londonToday = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/London',
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(new Date())

	return (
		<main className={pageMainClass}>
			<HeroPanel labelledBy="overview-heading">
				<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
					<h1 id="overview-heading" className="font-serif text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.5rem]">
						{greeting()}, {firstName}
					</h1>
					<p className="text-sm text-white/70">{londonToday}</p>
				</div>

				<div className="mt-7 border-t border-white/10 pt-6">
					{duesSummary ? (
						<div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-5">
							<div>
								<p className="text-sm text-white/70">Your dues for {duesSummary.year}</p>
								<p className="mt-2 font-serif text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums">
									{duesSummary.compliance.isUpToDate
										? formatPenceAsGbp(duesSummary.yearLedger.paidPence)
										: formatPenceAsGbp(duesSummary.compliance.outstandingPence)}
								</p>
								<p className="mt-2 text-sm text-white/80">
									{duesSummary.compliance.isUpToDate
										? 'paid so far. You are up to date. Thank you.'
										: `to pay, ${duesSummary.compliance.owingMonths} ${duesSummary.compliance.owingMonths === 1 ? 'month' : 'months'} outstanding.`}
								</p>
							</div>
							<div className="min-w-0 lg:row-span-2 lg:pt-1">
								<DuesMonthStrip cells={duesSummary.yearLedger.cells} year={duesSummary.year} tone="dark" />
								{duesSummary.owingYears.length > 0 ? (
									<p className="mt-4 text-sm text-white/80">
										You also have unpaid months in{' '}
										<Link
											href={`/dues?year=${duesSummary.owingYears[0]}`}
											className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
										>
											{duesSummary.owingYears.join(', ')}
										</Link>
										.
									</p>
								) : null}
							</div>
							<div>
								<Link
									href="/dues"
									className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
								>
									{duesSummary.compliance.isUpToDate ? 'View your dues' : 'How to pay'}
									<Icon name="arrow-right" className="h-4 w-4" />
								</Link>
							</div>
						</div>
					) : (
						<p className="text-sm text-white/80">Your dues record isn&apos;t available right now.</p>
					)}
				</div>
			</HeroPanel>

			<div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
				<div className="order-2 min-w-0 lg:order-1">
					{celebrants ? <CelebrantsCard celebrations={celebrants} /> : null}
				</div>

				<div className="order-1 flex flex-col gap-6 lg:order-2">
					<SectionCard title="Next prayer meeting">
						<div className="flex items-center gap-4">
							<DateBlock value={nextPrayerMeeting} />
							<div>
								<p className="font-semibold text-navy-950">{formatLondonWeekdayDate(nextPrayerMeeting)}</p>
								<p className="mt-0.5 text-sm text-slate-600">{formatLondonTime(nextPrayerMeeting)}, UK time</p>
							</div>
						</div>
						<p className="mt-4 text-sm leading-6 text-slate-600">Every second Thursday of the month.</p>
						<Link href="/events" className={`${navLinkClass} mt-3 inline-block text-sm`}>
							All gatherings
						</Link>
					</SectionCard>

					{todos.length > 0 ? (
						<SectionCard title="Needs your attention" flush>
							<ul className="divide-y divide-cream-100">
								{todos.map((todo) => (
									<li key={todo.href}>
										<Link
											href={todo.href}
											className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold-600 sm:px-6"
										>
											<span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-800">
												<Icon name={todo.icon} className="h-4 w-4" />
											</span>
											<span className="flex-1 font-medium text-navy-950">{todo.label}</span>
											<Icon name="arrow-right" className="h-4 w-4 text-slate-500" />
										</Link>
									</li>
								))}
							</ul>
						</SectionCard>
					) : null}
				</div>
			</div>
		</main>
	)
}

export default DashboardPage
