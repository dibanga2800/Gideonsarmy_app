import Link from 'next/link'
import { filterActiveClass, filterIdleClass } from '@/lib/ui'

interface LedgerYearNavProps {
	years: number[]
	selectedYear: number
	hrefForYear: (year: number) => string
}

export const LedgerYearNav = ({ years, selectedYear, hrefForYear }: LedgerYearNavProps) => {
	return (
		<nav className="mt-4 flex flex-wrap gap-2" aria-label="Dues year">
			{years.map((year) => (
				<Link
					key={year}
					href={hrefForYear(year)}
					className={year === selectedYear ? filterActiveClass : filterIdleClass}
					aria-current={year === selectedYear ? 'page' : undefined}
				>
					{year}
				</Link>
			))}
		</nav>
	)
}
