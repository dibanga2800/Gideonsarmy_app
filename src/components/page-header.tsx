import type { ReactNode } from 'react'

interface PageHeaderProps {
	eyebrow: string
	title: string
	lead?: string
	leadWide?: boolean
	actions?: ReactNode
}

export const PageHeader = ({
	eyebrow,
	title,
	lead,
	leadWide = false,
	actions,
}: PageHeaderProps) => {
	return (
		<header className="relative">
			<div className="absolute -left-4 top-1 hidden h-16 w-1 rounded-full bg-gold-500 sm:block" aria-hidden="true" />
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">{eyebrow}</p>
			<div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<h1 className="font-serif text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">
						{title}
					</h1>
					{lead ? (
						<p
							className={`mt-3 text-base leading-7 text-navy-800/80 ${
								leadWide ? 'max-w-3xl' : 'max-w-2xl'
							}`}
						>
							{lead}
						</p>
					) : null}
				</div>
				{actions ? <div className="shrink-0">{actions}</div> : null}
			</div>
		</header>
	)
}
