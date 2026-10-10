import Link from 'next/link'
import { getPostAuthPath } from '@/lib/auth/access'
import { getNextPrayerMeeting } from '@/lib/dates/prayer-meeting'
import { getCurrentAccess } from '@/server/services/auth-service'
import { getThisMonthCelebrations } from '@/server/services/celebration-service'
import { CelebrantsCard } from '@/components/celebrants-card'
import { DateBlock, formatLondonTime, formatLondonWeekdayDate } from '@/components/date-block'
import { FellowshipMark } from '@/components/fellowship-mark'
import { Icon, type IconName } from '@/components/icons'

const Feature = ({ icon, title, children }: { icon: IconName; title: string; children: string }) => (
	<div className="flex gap-4">
		<span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-navy-800 ring-1 ring-inset ring-line">
			<Icon name={icon} className="h-5 w-5" />
		</span>
		<div>
			<h2 className="text-[0.9375rem] font-semibold text-navy-950">{title}</h2>
			<p className="mt-1 text-sm leading-6 text-slate-600">{children}</p>
		</div>
	</div>
)

const HomePage = async () => {
	const access = await getCurrentAccess()
	const nextPath = getPostAuthPath(access)
	const celebrants = access.status === 'member' ? await getThisMonthCelebrations() : null
	const nextPrayerMeeting = getNextPrayerMeeting()
	const buttonLabel =
		access.status === 'unauthenticated'
			? 'Sign in'
			: access.status === 'member'
				? 'Open your overview'
				: 'Check membership status'

	return (
		<main className="mx-auto w-full max-w-6xl">
			<section className="lamplight relative overflow-hidden rounded-2xl px-6 py-10 text-white shadow-raised sm:px-10 sm:py-14 lg:px-14">
				<div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
					<div>
						<div className="flex items-center gap-3">
							<FellowshipMark className="h-11 w-11" />
							<p className="text-sm text-white/70">RCCG Living Water Parish, Stoke-on-Trent</p>
						</div>
						<h1 className="mt-6 max-w-xl font-serif text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.5rem]">
							Gideon&apos;s Army Men&apos;s Fellowship
						</h1>
						<p className="mt-5 max-w-lg text-base leading-7 text-white/75">
							The members&apos; portal for the married men&apos;s fellowship: keep your dues up to
							date, see what&apos;s coming up, and celebrate one another&apos;s birthdays and
							anniversaries.
						</p>
						<div className="mt-8 flex flex-wrap items-center gap-4">
							<Link
								href={nextPath}
								className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
							>
								{buttonLabel}
								<Icon name="arrow-right" className="h-4 w-4" />
							</Link>
							{access.status === 'unauthenticated' ? (
								<p className="text-sm text-white/60">Access is for approved members.</p>
							) : null}
						</div>
					</div>
					<div className="rounded-xl bg-white/[0.06] p-5 ring-1 ring-inset ring-white/10">
						<p className="text-sm text-white/60">Next prayer meeting</p>
						<div className="mt-3 flex items-center gap-4">
							<DateBlock value={nextPrayerMeeting} tone="dark" />
							<div>
								<p className="font-semibold text-white">{formatLondonWeekdayDate(nextPrayerMeeting)}</p>
								<p className="mt-0.5 text-sm text-white/70">{formatLondonTime(nextPrayerMeeting)}, UK time</p>
							</div>
						</div>
						<p className="mt-4 text-sm leading-6 text-white/60">
							We meet to pray on the second Thursday of every month.
						</p>
					</div>
				</div>
			</section>

			<section className="mt-10 grid gap-8 px-1 sm:grid-cols-3" aria-label="What the portal does">
				<Feature icon="wallet" title="Dues">
					See which months are paid and the parish bank details for the £10 monthly contribution.
				</Feature>
				<Feature icon="calendar" title="Gatherings">
					Prayer meetings and fellowship events, with one tap to add them to your calendar.
				</Feature>
				<Feature icon="shield" title="Private by design">
					Only approved members can sign in. An administrator confirms every new account.
				</Feature>
			</section>

			{celebrants ? (
				<div className="mt-10">
					<CelebrantsCard celebrations={celebrants} />
				</div>
			) : null}

			{access.status !== 'unauthenticated' ? null : (
				<p className="mt-10 px-1 text-sm text-slate-500">
					Invited but haven&apos;t chosen a password?{' '}
					<Link href="/signup" className="font-semibold text-navy-800 underline decoration-navy-800/35 decoration-2 underline-offset-4 hover:decoration-navy-800">
						Create one here
					</Link>
					.
				</p>
			)}
		</main>
	)
}

export default HomePage
