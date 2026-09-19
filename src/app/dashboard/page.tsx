import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/server/services/auth-service'
import { getOwnCurrentDues } from '@/server/services/dues-service'
import { getThisMonthCelebrations } from '@/server/services/celebration-service'
import { CelebrantsCard } from '@/components/celebrants-card'
import { PageHeader } from '@/components/page-header'
import { formatLondonDateTime } from '@/lib/events/display'
import { getNextPrayerMeeting } from '@/lib/dates/prayer-meeting'
import { formatDueMonth } from '@/lib/dates/due-month'
import { duesComplianceLabel, duesStatusLabel } from '@/lib/dues/display'
import { formatPenceAsGbp } from '@/lib/money'
import {
	cardLinkClass,
	eyebrowClass,
	heroPanelClass,
	pageMainClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Dashboard',
}

const DashboardPage = async () => {
	const session = await getCurrentSession()

	if (session.access.status !== 'member') {
		redirect('/login')
	}

	const nextPrayerMeeting = getNextPrayerMeeting()
	const [duesSummary, celebrants] = await Promise.all([
		getOwnCurrentDues(),
		getThisMonthCelebrations(),
	])
	const firstName = session.profile?.first_name ?? 'brother'
	const roleLabel = session.access.isAdmin ? 'Administrator' : 'Member'

	return (
		<main className={pageMainClass}>
			<PageHeader
				eyebrow="RCCG Living Water Parish"
				title={`Welcome, ${firstName}`}
				lead={`You are signed in as an approved ${roleLabel.toLowerCase()} of Gideon's Army Men's Fellowship.`}
			/>

			<section className={heroPanelClass}>
				<div className="absolute inset-x-0 top-0 h-1 bg-gold-500" aria-hidden="true" />
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
					Upcoming gathering
				</p>
				<h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
					Monthly prayer meeting
				</h2>
				<p className="mt-4 text-lg text-white">{formatLondonDateTime(nextPrayerMeeting)}</p>
				<p className="mt-2 text-sm text-white/70">
					Second Thursday of every month at 8:00 PM, Europe/London.
				</p>
				<p className="mt-5">
					<Link
						href="/events"
						className="text-sm font-semibold text-gold-400 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
					>
						View events
					</Link>
				</p>
			</section>

			{celebrants ? (
				<div className="mt-8">
					<CelebrantsCard celebrations={celebrants} />
				</div>
			) : null}

			<section className="mt-8 grid gap-4 sm:grid-cols-2">
				<Link href="/dues" className={cardLinkClass}>
					<p className={eyebrowClass}>Stewardship</p>
					<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
						Dues
					</h2>
					{duesSummary ? (
						<p className="mt-2 text-sm leading-6 text-navy-800/80">
							{duesComplianceLabel(duesSummary.compliance.isUpToDate)} for{' '}
							{duesSummary.year}
							{duesSummary.compliance.isUpToDate
								? null
								: ` · ${duesSummary.compliance.owingMonths} month${duesSummary.compliance.owingMonths === 1 ? '' : 's'} · ${formatPenceAsGbp(duesSummary.compliance.outstandingPence)} to pay`}
							{duesSummary.current
								? ` · ${formatDueMonth(duesSummary.current.due_month)} ${duesStatusLabel(duesSummary.current.status)}`
								: null}
							{duesSummary.owingYears.length > 0
								? ` · earlier unpaid months stay on ${duesSummary.owingYears.join(', ')}`
								: null}
						</p>
					) : (
						<p className="mt-2 text-sm leading-6 text-navy-800/80">
							View your monthly contribution history and whether you are up to date.
						</p>
					)}
				</Link>
				<Link href="/events" className={cardLinkClass}>
					<p className={eyebrowClass}>Gathering</p>
					<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
						Events
					</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						See the next prayer meeting and other fellowship gatherings.
					</p>
				</Link>
				<Link href="/celebrations" className={cardLinkClass}>
					<p className={eyebrowClass}>Fellowship</p>
					<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
						Celebrations
					</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						See who has a birthday or wedding anniversary this month.
					</p>
				</Link>
				<Link href="/profile" className={cardLinkClass}>
					<p className={eyebrowClass}>Your record</p>
					<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
						Profile
					</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						Keep your contact details, birthday, and anniversary up to date.
					</p>
				</Link>
				{session.access.isAdmin ? (
					<>
						<Link href="/admin/members" className={cardLinkClass}>
							<p className={eyebrowClass}>Administration</p>
							<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
								Members
							</h2>
							<p className="mt-2 text-sm leading-6 text-navy-800/80">
								Approve pending accounts and manage fellowship membership.
							</p>
						</Link>
						<Link href="/admin/payments" className={cardLinkClass}>
							<p className={eyebrowClass}>Administration</p>
							<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
								Payments
							</h2>
							<p className="mt-2 text-sm leading-6 text-navy-800/80">
								Confirm bank transfers and publish the fellowship account details.
							</p>
						</Link>
					</>
				) : null}
			</section>
		</main>
	)
}

export default DashboardPage
