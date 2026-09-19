import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FlashToasts } from '@/components/flash-toasts'
import { NavigationProgress } from '@/components/navigation-progress'
import { getCurrentAccess } from '@/server/services/auth-service'
import { getOwnUnreadNoticeCount } from '@/server/services/notice-service'

export const AppShell = async ({ children }: { children: ReactNode }) => {
	const [access, unreadNoticeCount] = await Promise.all([
		getCurrentAccess(),
		getOwnUnreadNoticeCount(),
	])

	return (
		<div className="flex min-h-screen flex-col">
			<Suspense fallback={null}>
				<NavigationProgress />
			</Suspense>
			<SiteHeader access={access} unreadNoticeCount={unreadNoticeCount} />
			{children}
			<SiteFooter />
			<Suspense fallback={null}>
				<FlashToasts />
			</Suspense>
		</div>
	)
}
