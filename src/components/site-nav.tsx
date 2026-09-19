'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { canAccessAdmin, canAccessMemberApp, canCompleteOwnProfile, type AccessDecision } from '@/lib/auth/access'
import { headerCtaClass } from '@/lib/ui'

interface SiteNavProps {
	access: AccessDecision
	unreadNoticeCount?: number
}

const navItemClass = (active: boolean) =>
	active
		? 'rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gold-400 ring-1 ring-gold-400/50 transition-colors'
		: 'rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15'

export const SiteNav = ({ access, unreadNoticeCount = 0 }: SiteNavProps) => {
	const pathname = usePathname()
	const onAuthPage = pathname === '/login' || pathname === '/signup'

	return (
		<nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Primary">
			{canAccessMemberApp(access) ? (
				<Link
					href="/dashboard"
					className={navItemClass(pathname === '/dashboard')}
					aria-current={pathname === '/dashboard' ? 'page' : undefined}
				>
					Dashboard
				</Link>
			) : null}
			{canCompleteOwnProfile(access) ? (
				<Link
					href="/profile"
					className={navItemClass(pathname.startsWith('/profile'))}
					aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
				>
					Profile
				</Link>
			) : null}
			{canAccessMemberApp(access) ? (
				<>
					<Link
						href="/events"
						className={navItemClass(pathname.startsWith('/events'))}
						aria-current={pathname.startsWith('/events') ? 'page' : undefined}
					>
						Events
					</Link>
					<Link
						href="/celebrations"
						className={navItemClass(pathname.startsWith('/celebrations'))}
						aria-current={pathname.startsWith('/celebrations') ? 'page' : undefined}
					>
						Celebrations
					</Link>
					<Link
						href="/notifications"
						className={navItemClass(pathname.startsWith('/notifications'))}
						aria-current={pathname.startsWith('/notifications') ? 'page' : undefined}
					>
						Notices
						{unreadNoticeCount > 0 ? (
							<span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-gold-500 px-1.5 text-[0.7rem] font-semibold text-navy-950">
								{unreadNoticeCount > 9 ? '9+' : unreadNoticeCount}
							</span>
						) : null}
					</Link>
					<Link
						href="/dues"
						className={navItemClass(pathname.startsWith('/dues'))}
						aria-current={pathname.startsWith('/dues') ? 'page' : undefined}
					>
						Dues
					</Link>
				</>
			) : null}
			{canAccessAdmin(access) ? (
				<>
					<Link
						href="/admin/members"
						className={navItemClass(pathname.startsWith('/admin/members'))}
						aria-current={pathname.startsWith('/admin/members') ? 'page' : undefined}
					>
						Members
					</Link>
					<Link
						href="/admin/payments"
						className={navItemClass(pathname.startsWith('/admin/payments'))}
						aria-current={pathname.startsWith('/admin/payments') ? 'page' : undefined}
					>
						Payments
					</Link>
				</>
			) : null}
			{access.status === 'unauthenticated' && !onAuthPage ? (
				<Link href="/login" className={`${headerCtaClass} ml-1`}>
					Sign in
				</Link>
			) : null}
		</nav>
	)
}
