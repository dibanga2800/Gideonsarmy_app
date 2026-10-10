import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/icons'

interface StatusPageProps {
	icon: IconName
	tone?: 'neutral' | 'attention'
	title: string
	children: ReactNode
	actions?: ReactNode
}

/** Centred single-message page: errors, not found, membership waiting. */
export const StatusPage = ({ icon, tone = 'neutral', title, children, actions }: StatusPageProps) => (
	<main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-8">
		<div className="rounded-2xl border border-line bg-white p-6 text-center shadow-card sm:p-10">
			<span
				className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full ${
					tone === 'attention' ? 'bg-amber-50 text-amber-700' : 'bg-cream-100 text-navy-800'
				}`}
			>
				<Icon name={icon} className="h-6 w-6" />
			</span>
			<h1 className="mt-5 font-serif text-2xl font-semibold tracking-tight text-navy-950">{title}</h1>
			<div className="mx-auto mt-3 max-w-sm text-[0.9375rem] leading-7 text-slate-600">{children}</div>
			{actions ? <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div> : null}
		</div>
	</main>
)
