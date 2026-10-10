import type { ReactNode } from 'react'
import { Icon } from '@/components/icons'
import type { FlashKind } from '@/lib/ui/flash'

const boxClass: Record<FlashKind, string> = {
	success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
	danger: 'border-red-200 bg-red-50 text-red-950',
}

const iconClass: Record<FlashKind, string> = {
	success: 'text-emerald-600',
	danger: 'text-red-600',
}

interface AlertNoticeProps {
	kind: FlashKind
	title: string
	children: ReactNode
	onDismiss?: () => void
	elevated?: boolean
}

export const AlertNotice = ({ kind, title, children, onDismiss, elevated = false }: AlertNoticeProps) => {
	const isDanger = kind === 'danger'

	return (
		<div
			className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${boxClass[kind]} ${elevated ? 'shadow-raised' : ''}`}
			role={isDanger ? 'alert' : 'status'}
			aria-atomic="true"
		>
			<Icon name={isDanger ? 'alert' : 'check'} className={`mt-0.5 h-5 w-5 ${iconClass[kind]}`} />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold">{title}</p>
				<div className="mt-0.5 whitespace-pre-wrap text-sm leading-6 opacity-90">{children}</div>
			</div>
			{onDismiss ? (
				<button
					type="button"
					className="-my-1 -mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg opacity-70 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
					onClick={onDismiss}
					aria-label="Dismiss notification"
				>
					<Icon name="close" className="h-4 w-4" />
				</button>
			) : null}
		</div>
	)
}

/** Stack of page-level notices; renders nothing when empty. */
export const NoticeStack = ({ children }: { children: ReactNode }) => {
	const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : []
	if (items.length === 0) {
		return null
	}

	return <div className="mb-6 space-y-3">{items}</div>
}
