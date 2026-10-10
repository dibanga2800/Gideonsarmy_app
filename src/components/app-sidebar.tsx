'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { signOut } from '@/server/actions/auth-actions'
import { FellowshipMark } from '@/components/fellowship-mark'
import { Icon, type IconName } from '@/components/icons'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { initialsFromName } from '@/lib/members/display'

interface NavItem {
	href: string
	label: string
	icon: IconName
	badge?: number
	/** Exact match only, for routes that are prefixes of others. */
	exact?: boolean
}

interface NavGroup {
	label: string
	items: NavItem[]
}

interface AppSidebarProps {
	isAdmin: boolean
	unreadNoticeCount: number
	memberName: string
	memberEmail: string
}

const buildGroups = (isAdmin: boolean, unread: number): NavGroup[] => {
	const groups: NavGroup[] = [
		{
			label: 'Fellowship',
			items: [
				{ href: '/dashboard', label: 'Overview', icon: 'home', exact: true },
				{ href: '/events', label: 'Events', icon: 'calendar' },
				{ href: '/celebrations', label: 'Celebrations', icon: 'gift' },
				{ href: '/notifications', label: 'Notices', icon: 'bell', badge: unread },
			],
		},
		{
			label: 'My account',
			items: [
				{ href: '/dues', label: 'Dues', icon: 'wallet' },
				{ href: '/profile', label: 'Profile', icon: 'user' },
			],
		},
	]

	if (isAdmin) {
		groups.push({
			label: 'Administration',
			items: [
				{ href: '/admin/members', label: 'Members', icon: 'users' },
				{ href: '/admin/payments', label: 'Payments', icon: 'receipt' },
			],
		})
	}

	return groups
}

const isActive = (pathname: string, item: NavItem) =>
	item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)

const Brand = () => (
	<Link
		href="/dashboard"
		className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
	>
		<FellowshipMark className="h-9 w-9" />
		<span className="leading-tight">
			<span className="block font-serif text-[1.0625rem] font-semibold text-white">Gideon&apos;s Army</span>
			<span className="block text-xs text-white/60">Men&apos;s Fellowship</span>
		</span>
	</Link>
)

const NavList = ({ groups, pathname }: { groups: NavGroup[]; pathname: string }) => (
	<nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
		{groups.map((group) => (
			<div key={group.label}>
				<p className="px-3 text-xs font-medium text-white/55">{group.label}</p>
				<ul className="mt-2 space-y-0.5">
					{group.items.map((item) => {
						const active = isActive(pathname, item)
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									aria-current={active ? 'page' : undefined}
									className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold-400 ${
										active
											? 'bg-white/10 font-semibold text-white'
											: 'font-medium text-white/70 hover:bg-white/5 hover:text-white'
									}`}
								>
									{active ? (
										<span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold-400" aria-hidden="true" />
									) : null}
									<Icon
										name={item.icon}
										className={`h-[1.125rem] w-[1.125rem] ${active ? 'text-gold-300' : 'text-white/55 group-hover:text-white/80'}`}
									/>
									<span className="flex-1">{item.label}</span>
									{item.badge && item.badge > 0 ? (
										<span className="inline-flex min-w-[1.375rem] justify-center rounded-full bg-gold-500 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-navy-950">
											{item.badge > 9 ? '9+' : item.badge}
											<span className="sr-only"> unread</span>
										</span>
									) : null}
								</Link>
							</li>
						)
					})}
				</ul>
			</div>
		))}
	</nav>
)

const AccountFooter = ({ memberName, memberEmail }: { memberName: string; memberEmail: string }) => (
	<div className="border-t border-white/10 p-3">
		<div className="flex items-center gap-3 rounded-lg px-2 py-2">
			<span
				className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-semibold text-navy-950"
				aria-hidden="true"
			>
				{initialsFromName(memberName)}
			</span>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold text-white">{memberName}</p>
				<p className="truncate text-xs text-white/55">{memberEmail}</p>
			</div>
		</div>
		<form action={signOut} className="mt-1">
			<PendingSubmitButton
				className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold-400"
				pendingLabel="Signing out…"
			>
				<Icon name="logout" className="h-[1.125rem] w-[1.125rem] text-white/55" />
				Sign out
			</PendingSubmitButton>
		</form>
	</div>
)

export const AppSidebar = ({ isAdmin, unreadNoticeCount, memberName, memberEmail }: AppSidebarProps) => {
	const pathname = usePathname()
	const [open, setOpen] = useState(false)
	const groups = buildGroups(isAdmin, unreadNoticeCount)

	useEffect(() => {
		setOpen(false)
	}, [pathname])

	useEffect(() => {
		if (!open) {
			return
		}
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false)
			}
		}
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		document.addEventListener('keydown', onKey)
		return () => {
			document.body.style.overflow = previousOverflow
			document.removeEventListener('keydown', onKey)
		}
	}, [open])

	const panel = (extra?: ReactNode) => (
		<div className="flex h-full flex-col bg-navy-950">
			<div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-5">
				<Brand />
				{extra}
			</div>
			<NavList groups={groups} pathname={pathname} />
			<AccountFooter memberName={memberName} memberEmail={memberEmail} />
		</div>
	)

	return (
		<>
			{/* Desktop: fixed sidebar */}
			<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{panel()}</aside>

			{/* Mobile and tablet: top bar with a drawer */}
			<div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-navy-950 px-4 lg:hidden">
				<Brand />
				<button
					type="button"
					className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
					aria-label="Open menu"
					aria-expanded={open}
					aria-controls="mobile-navigation"
					onClick={() => setOpen(true)}
				>
					<Icon name="menu" />
					{unreadNoticeCount > 0 ? (
						<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-400" aria-hidden="true" />
					) : null}
				</button>
			</div>
			{open ? (
				<div className="fixed inset-0 z-50 lg:hidden" id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Menu">
					<button
						type="button"
						className="absolute inset-0 bg-navy-950/60"
						aria-label="Close menu"
						tabIndex={-1}
						onClick={() => setOpen(false)}
					/>
					<div className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] shadow-raised">
						{panel(
							<button
								type="button"
								autoFocus
								className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
								aria-label="Close menu"
								onClick={() => setOpen(false)}
							>
								<Icon name="close" />
							</button>,
						)}
					</div>
				</div>
			) : null}
		</>
	)
}
