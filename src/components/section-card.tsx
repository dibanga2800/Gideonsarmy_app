import type { ReactNode } from 'react'

interface SectionCardProps {
	title?: string
	description?: ReactNode
	actions?: ReactNode
	children?: ReactNode
	/** Removes body padding, for tables and lists that run edge to edge. */
	flush?: boolean
	tone?: 'default' | 'danger'
	id?: string
	className?: string
	as?: 'section' | 'div'
}

/**
 * The standard content container: an optional header row (title, description,
 * actions) above a body. Use one per distinct task on a page.
 */
export const SectionCard = ({
	title,
	description,
	actions,
	children,
	flush = false,
	tone = 'default',
	id,
	className = '',
	as: Tag = 'section',
}: SectionCardProps) => {
	const headingId = id ? `${id}-heading` : undefined
	const border = tone === 'danger' ? 'border-red-200' : 'border-line'

	return (
		<Tag
			id={id}
			aria-labelledby={title && headingId ? headingId : undefined}
			className={`overflow-hidden rounded-xl border ${border} bg-white shadow-card ${className}`}
		>
			{title || actions ? (
				<header
					className={`flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 ${
						flush ? 'border-b border-line pb-4' : ''
					}`}
				>
					<div className="min-w-0">
						{title ? (
							<h2
								id={headingId}
								className={`text-base font-semibold ${tone === 'danger' ? 'text-red-800' : 'text-navy-950'}`}
							>
								{title}
							</h2>
						) : null}
						{description ? (
							<div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</div>
						) : null}
					</div>
					{actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
				</header>
			) : null}
			{children ? (
				<div className={flush ? '' : `px-5 pb-5 sm:px-6 sm:pb-6 ${title || actions ? 'pt-4' : 'pt-5 sm:pt-6'}`}>
					{children}
				</div>
			) : null}
		</Tag>
	)
}
