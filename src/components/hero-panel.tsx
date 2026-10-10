import type { ReactNode } from 'react'

interface HeroPanelProps {
	children: ReactNode
	labelledBy?: string
	className?: string
}

/**
 * The navy "lamplight" surface. Use at most once per page, for the single
 * fact that page exists to show.
 */
export const HeroPanel = ({ children, labelledBy, className = '' }: HeroPanelProps) => (
	<section
		aria-labelledby={labelledBy}
		className={`lamplight relative overflow-hidden rounded-2xl p-5 text-white shadow-raised sm:p-7 lg:p-8 ${className}`}
	>
		{children}
	</section>
)
