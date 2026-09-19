import type { ReactNode } from 'react'
import type { FlashKind } from '@/lib/ui/flash'

const boxClass: Record<FlashKind, string> = {
	success:
		'border-green-300 bg-green-50 text-green-950 shadow-[0_18px_50px_-24px_rgba(22,101,52,0.45)]',
	danger:
		'border-red-300 bg-red-50 text-red-950 shadow-[0_18px_50px_-24px_rgba(153,27,27,0.4)]',
}

const accentClass: Record<FlashKind, string> = {
	success: 'bg-green-600',
	danger: 'bg-red-700',
}

const eyebrowClass: Record<FlashKind, string> = {
	success: 'text-green-800',
	danger: 'text-red-800',
}

interface AlertNoticeProps {
	kind: FlashKind
	title: string
	children: ReactNode
	onDismiss?: () => void
}

export const AlertNotice = ({ kind, title, children, onDismiss }: AlertNoticeProps) => {
	const isDanger = kind === 'danger'

	return (
		<div
			className={`relative overflow-hidden rounded-xl border ${boxClass[kind]}`}
			role={isDanger ? 'alert' : 'status'}
			aria-atomic="true"
		>
			<span className={`absolute inset-y-0 left-0 w-1.5 ${accentClass[kind]}`} aria-hidden="true" />
			<div className="flex items-start gap-3 py-4 pl-6 pr-4">
				<div className="min-w-0 flex-1">
					<p className={`text-xs font-semibold uppercase tracking-[0.18em] ${eyebrowClass[kind]}`}>
						{isDanger ? 'Danger' : 'Success'}
					</p>
					<p className="mt-2 font-serif text-lg font-semibold leading-6">{title}</p>
					<div className="mt-2 whitespace-pre-wrap text-sm leading-6">{children}</div>
				</div>
				{onDismiss ? (
					<button
						type="button"
						className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-current/70 transition hover:bg-black/5 hover:text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
						onClick={onDismiss}
						aria-label="Dismiss notification"
					>
						<span aria-hidden="true">×</span>
					</button>
				) : null}
			</div>
		</div>
	)
}
