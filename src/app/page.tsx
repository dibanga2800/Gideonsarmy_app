import Link from 'next/link'
import { getPostAuthPath } from '@/lib/auth/access'
import { cardClass, eyebrowClass, pageMainClass, primaryButtonClass } from '@/lib/ui'
import { getCurrentAccess } from '@/server/services/auth-service'
import { getThisMonthCelebrations } from '@/server/services/celebration-service'
import { CelebrantsCard } from '@/components/celebrants-card'
import { FellowshipMark } from '@/components/fellowship-mark'

const HomePage = async () => {
	const access = await getCurrentAccess()
	const nextPath = getPostAuthPath(access)
	const celebrants = access.status === 'member' ? await getThisMonthCelebrations() : null
	const buttonLabel =
		access.status === 'unauthenticated'
			? 'Sign in'
			: access.status === 'member'
				? 'Open dashboard'
				: 'View membership status'

	return (
		<main className={`${pageMainClass} relative flex flex-col justify-center py-16 sm:py-24`}>
			<div
				className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(196,163,90,0.14),_transparent_60%)]"
				aria-hidden="true"
			/>
			<section className="max-w-3xl">
				<div className="mb-6 flex items-center gap-3">
					<FellowshipMark className="h-12 w-12" />
					<p className={eyebrowClass}>RCCG Living Water Parish · Stoke-on-Trent</p>
				</div>
				<h1 className="font-serif text-4xl font-semibold tracking-tight text-navy-950 sm:text-5xl">
					Gideon&apos;s Army Men&apos;s Fellowship
				</h1>
				<div className="mt-5 h-px w-16 bg-gold-500" aria-hidden="true" />
				<p className="mt-6 max-w-2xl text-lg leading-8 text-navy-800/85">
					A secure home for approved members to manage dues, stay informed about
					fellowship gatherings, and receive birthday and anniversary reminders.
					A Google account or an invited email and password does not grant
					access until membership is explicitly approved.
				</p>
				<div className="mt-8">
					<Link href={nextPath} className={primaryButtonClass}>
						{buttonLabel}
					</Link>
				</div>
			</section>
			{celebrants ? (
				<div className="mt-14 max-w-xl">
					<CelebrantsCard celebrations={celebrants} />
				</div>
			) : null}
			<section className="mt-14 grid gap-4 sm:grid-cols-3">
				<div className={cardClass}>
					<h2 className="font-serif text-lg font-semibold text-navy-950">Membership</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						Approved brothers can view their profile and keep fellowship records current.
					</p>
				</div>
				<div className={cardClass}>
					<h2 className="font-serif text-lg font-semibold text-navy-950">Stewardship</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						Monthly dues are recorded in pence, with payments confirmed by an administrator.
					</p>
				</div>
				<div className={cardClass}>
					<h2 className="font-serif text-lg font-semibold text-navy-950">Gathering</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						Prayer meeting is the second Thursday of every month at 8:00 PM.
					</p>
				</div>
			</section>
		</main>
	)
}

export default HomePage
