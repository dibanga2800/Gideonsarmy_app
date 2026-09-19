import Link from 'next/link'
import { signOut } from '@/server/actions/auth-actions'
import { canAccessMemberApp, type AccessDecision } from '@/lib/auth/access'
import { headerButtonClass } from '@/lib/ui'
import { FellowshipMark } from '@/components/fellowship-mark'
import { SiteNav } from '@/components/site-nav'
import { PendingSubmitButton } from '@/components/pending-submit-button'

interface SiteHeaderProps {
	access: AccessDecision
	unreadNoticeCount?: number
}

export const SiteHeader = ({ access, unreadNoticeCount = 0 }: SiteHeaderProps) => {
	const signedIn = access.status !== 'unauthenticated'
	const homeHref = canAccessMemberApp(access) ? '/dashboard' : '/'

	return (
		<header className="sticky top-0 z-40 border-b border-gold-500/35 bg-navy-950 text-white shadow-[0_12px_40px_-20px_rgba(11,18,32,0.95)]">
			<div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
				<Link
					href={homeHref}
					className="flex items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
				>
					<FellowshipMark />
					<span className="leading-tight">
						<span className="block font-serif text-lg font-semibold tracking-tight text-white">
							Gideon&apos;s Army
						</span>
						<span className="block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-gold-400">
							Men&apos;s Fellowship
						</span>
					</span>
				</Link>
				<div className="flex flex-wrap items-center justify-end gap-4">
					<SiteNav access={access} unreadNoticeCount={unreadNoticeCount} />
					{signedIn ? (
						<>
							<div className="hidden h-6 w-px bg-white/20 sm:block" aria-hidden="true" />
							<form action={signOut}>
								<PendingSubmitButton className={headerButtonClass} pendingLabel="Signing out…">
									Sign out
								</PendingSubmitButton>
							</form>
						</>
					) : null}
				</div>
			</div>
		</header>
	)
}
