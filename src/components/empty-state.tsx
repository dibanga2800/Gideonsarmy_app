import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/icons'

interface EmptyStateProps {
	icon?: IconName
	title: string
	children?: ReactNode
	action?: ReactNode
	compact?: boolean
}

export const EmptyState = ({ icon = 'info', title, children, action, compact = false }: EmptyStateProps) => (
	<div
		className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'rounded-xl border border-dashed border-cream-300 bg-white px-6 py-12'}`}
	>
		<span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-slate-500">
			<Icon name={icon} className="h-5 w-5" />
		</span>
		<p className="mt-3 text-sm font-semibold text-navy-950">{title}</p>
		{children ? <div className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{children}</div> : null}
		{action ? <div className="mt-4">{action}</div> : null}
	</div>
)
