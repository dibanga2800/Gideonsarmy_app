import Link from 'next/link'
import type { ReactNode } from 'react'

export interface StatGroupItem {
	label: string
	value: ReactNode
	detail?: ReactNode
	href?: string
	attention?: boolean
}

interface StatGroupProps {
	items: StatGroupItem[]
	label: string
}

const columns: Record<number, string> = {
	2: 'sm:grid-cols-2',
	3: 'sm:grid-cols-3',
	4: 'sm:grid-cols-2 lg:grid-cols-4',
}

/**
 * Several related figures on one surface, divided by rules, instead of a row
 * of identical cards. Figures use the display face so money reads as money.
 */
export const StatGroup = ({ items, label }: StatGroupProps) => (
	<section
		aria-label={label}
		className={`grid overflow-hidden rounded-xl border border-line bg-line shadow-card [gap:1px] ${columns[items.length] ?? 'sm:grid-cols-3'}`}
	>
		{items.map((item) => {
			const body = (
				<dl>
					<dt className="flex items-center gap-2 text-sm text-slate-600">
						{item.attention ? <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> : null}
						{item.label}
					</dt>
					<dd className="mt-1.5 font-serif text-[1.875rem] font-semibold leading-none tracking-tight text-navy-950 tabular-nums">
						{item.value}
					</dd>
					{item.detail ? <dd className="mt-2 text-[0.8125rem] leading-5 text-slate-600">{item.detail}</dd> : null}
				</dl>
			)
			const cellClass = 'block bg-white px-5 py-4 sm:px-6 sm:py-5'

			return item.href ? (
				<Link
					key={item.label}
					href={item.href}
					className={`${cellClass} transition-colors hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold-600`}
				>
					{body}
				</Link>
			) : (
				<div key={item.label} className={cellClass}>
					{body}
				</div>
			)
		})}
	</section>
)
