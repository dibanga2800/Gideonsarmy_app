'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { canAccessAdmin, canAccessMemberApp, canCompleteOwnProfile, type AccessDecision } from '@/lib/auth/access'
import { headerCtaClass } from '@/lib/ui'

interface SiteNavProps {
	access: AccessDecision
	unreadNoticeCount?: number
	mobileSignOut?: ReactNode
}

const navItemClass = (active: boolean) =>
	active
		? 'min-h-12 rounded-md bg-white/10 px-4 py-3 text-sm font-semibold text-gold-400 ring-1 ring-gold-400/50 transition-colors lg:min-h-0 lg:px-3 lg:py-2'
		: 'min-h-12 rounded-md px-4 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15 lg:min-h-0 lg:px-3 lg:py-2'

export const SiteNav = ({ access, unreadNoticeCount = 0, mobileSignOut }: SiteNavProps) => {
	const pathname = usePathname()
	const [menuOpen, setMenuOpen] = useState(false)
	const onAuthPage = pathname === '/login' || pathname === '/signup'

	useEffect(() => {
		setMenuOpen(false)
	}, [pathname])

	return (
		<nav
			className={`static grid grid-cols-1 items-center lg:relative lg:flex lg:w-auto lg:justify-end ${menuOpen ? 'w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-auto' : 'w-auto'}`}
			aria-label="Primary"
		>
			<button
				type="button"
				className="absolute right-4 top-3.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/35 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:right-6 lg:static lg:hidden"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				aria-controls="primary-navigation-links"
				title={menuOpen ? 'Close menu' : 'Open menu'}
				onClick={() => setMenuOpen((open) => !open)}
			>
				<span aria-hidden="true" className="flex w-5 flex-col items-center gap-[5px]">
					<span
						className={`h-0.5 w-5 rounded-full bg-current transition-transform ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
					/>
					<span
						className={`h-0.5 w-5 rounded-full bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`}
					/>
					<span
						className={`h-0.5 w-5 rounded-full bg-current transition-transform ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
					/>
				</span>
			</button>
			<div
				id="primary-navigation-links"
				className={`${menuOpen ? 'flex' : 'hidden'} col-start-1 row-start-2 mt-3 max-h-[calc(100dvh-7rem)] w-full flex-col items-stretch gap-2 overflow-y-auto rounded-md border border-white/15 bg-navy-950 p-3 shadow-xl lg:static lg:mt-0 lg:flex lg:max-h-none lg:w-auto lg:flex-row lg:items-center lg:gap-1 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
			>
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
				<Link href="/login" className={`${headerCtaClass} w-full lg:ml-1 lg:w-auto`}>
					Sign in
				</Link>
			) : null}
			{mobileSignOut ? (
				<div className="border-t border-white/15 pt-2 lg:hidden">{mobileSignOut}</div>
			) : null}
			</div>
		</nav>
	)
}
