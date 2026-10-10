import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from '@/components/icons'

interface PageHeaderProps {
	title: string
	description?: ReactNode
	actions?: ReactNode
	/** Badges or short facts shown beside the title. */
	meta?: ReactNode
	back?: { href: string; label: string }
}

export const PageHeader = ({ title, description, actions, meta, back }: PageHeaderProps) => {
	return (
		<header className="mb-6 sm:mb-8">
			{back ? (
				<Link
					href={back.href}
					className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-500 transition-colors hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
				>
					<Icon name="arrow-left" className="h-4 w-4" />
					{back.label}
				</Link>
			) : null}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
						<h1 className="font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-navy-950 sm:text-[2rem]">
							{title}
						</h1>
						{meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
					</div>
					{description ? (
						<div className="mt-2 max-w-3xl text-[0.9375rem] leading-7 text-slate-600">{description}</div>
					) : null}
				</div>
				{actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
			</div>
		</header>
	)
}
