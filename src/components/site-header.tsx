import Link from 'next/link'
import { signOut } from '@/server/actions/auth-actions'
import type { AccessDecision } from '@/lib/auth/access'
import { canCompleteOwnProfile } from '@/lib/auth/access'
import { FellowshipMark } from '@/components/fellowship-mark'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { SiteHeaderSignIn } from '@/components/site-nav'

interface SiteHeaderProps {
	access: AccessDecision
}

const linkClass =
	'inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400'

/** Header for visitors and for signed-in accounts that are not yet approved. */
export const SiteHeader = ({ access }: SiteHeaderProps) => {
	const signedIn = access.status !== 'unauthenticated'

	return (
		<header className="border-b border-white/10 bg-navy-950 px-4 sm:px-6 lg:px-10">
			<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4">
				<Link
					href={signedIn ? '/pending' : '/'}
					className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
				>
					<FellowshipMark className="h-9 w-9" />
					<span className="leading-tight">
						<span className="block font-serif text-[1.0625rem] font-semibold text-white">Gideon&apos;s Army</span>
						<span className="block text-xs text-white/60">Men&apos;s Fellowship</span>
					</span>
				</Link>
				<div className="flex items-center gap-1">
					{canCompleteOwnProfile(access) ? (
						<Link href="/profile" className={linkClass}>
							Profile
						</Link>
					) : null}
					{signedIn ? (
						<form action={signOut}>
							<PendingSubmitButton className={linkClass} pendingLabel="Signing out…">
								Sign out
							</PendingSubmitButton>
						</form>
					) : (
						<SiteHeaderSignIn />
					)}
				</div>
			</div>
		</header>
	)
}
