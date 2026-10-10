import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/icons'

interface StatTileProps {
	label: string
	value: ReactNode
	detail?: ReactNode
	icon?: IconName
	href?: string
	tone?: 'default' | 'attention'
}

/** A labelled figure. Used in rows of three or four at the top of a page. */
export const StatTile = ({ label, value, detail, icon, href, tone = 'default' }: StatTileProps) => {
	const body = (
		<>
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm font-medium text-slate-500">{label}</p>
				{icon ? (
					<span
						className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
							tone === 'attention' ? 'bg-amber-50 text-amber-700' : 'bg-cream-100 text-navy-700'
						}`}
					>
						<Icon name={icon} className="h-4 w-4" />
					</span>
				) : null}
			</div>
			<p className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">{value}</p>
			{detail ? <p className="mt-1 text-[0.8125rem] leading-5 text-slate-500">{detail}</p> : null}
		</>
	)

	const className =
		'block rounded-xl border border-line bg-white p-4 shadow-card sm:p-5'

	if (href) {
		return (
			<Link
				href={href}
				className={`${className} transition-colors hover:border-navy-600/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600`}
			>
				{body}
			</Link>
		)
	}

	return <div className={className}>{body}</div>
}
