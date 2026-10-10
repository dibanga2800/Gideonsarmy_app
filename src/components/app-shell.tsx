import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FlashToasts } from '@/components/flash-toasts'
import { NavigationProgress } from '@/components/navigation-progress'
import { canAccessAdmin, canAccessMemberApp } from '@/lib/auth/access'
import { memberDisplayName } from '@/lib/members/display'
import { getCurrentSession } from '@/server/services/auth-service'
import { getOwnUnreadNoticeCount } from '@/server/services/notice-service'

const SkipLink = () => (
	<a
		href="#main-content"
		className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-950 focus:shadow-raised"
	>
		Skip to content
	</a>
)

/**
 * Approved members get the sidebar application frame. Visitors and accounts
 * awaiting approval get a lighter public frame with a top bar.
 */
export const AppShell = async ({ children }: { children: ReactNode }) => {
	const [session, unreadNoticeCount] = await Promise.all([
		getCurrentSession(),
		getOwnUnreadNoticeCount(),
	])
	const { access, profile } = session

	const chrome = (
		<>
			<SkipLink />
			<Suspense fallback={null}>
				<NavigationProgress />
			</Suspense>
			<Suspense fallback={null}>
				<FlashToasts />
			</Suspense>
		</>
	)

	if (canAccessMemberApp(access)) {
		return (
			<div className="min-h-screen">
				{chrome}
				<AppSidebar
					isAdmin={canAccessAdmin(access)}
					unreadNoticeCount={unreadNoticeCount}
					memberName={profile ? memberDisplayName(profile) || profile.email : 'Member'}
					memberEmail={profile?.email ?? ''}
				/>
				<div className="flex min-h-screen flex-col lg:pl-64">
					<div id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-10 lg:py-10">
						{children}
					</div>
					<SiteFooter />
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen flex-col">
			{chrome}
			<SiteHeader access={access} />
			<div id="main-content" tabIndex={-1} className="flex flex-1 flex-col px-4 py-8 outline-none sm:px-6 sm:py-12 lg:px-10">
				{children}
			</div>
			<SiteFooter />
		</div>
	)
}
