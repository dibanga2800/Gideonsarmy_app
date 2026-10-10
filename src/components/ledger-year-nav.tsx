import Link from 'next/link'

interface LedgerYearNavProps {
	years: number[]
	selectedYear: number
	hrefForYear: (year: number) => string
}

/** Segmented year switcher for dues ledgers. Hidden when there is only one year. */
export const LedgerYearNav = ({ years, selectedYear, hrefForYear }: LedgerYearNavProps) => {
	if (years.length <= 1) {
		return null
	}

	return (
		<nav className="inline-flex rounded-lg bg-cream-100 p-1 ring-1 ring-inset ring-line" aria-label="Dues year">
			{years.map((year) => {
				const active = year === selectedYear
				return (
					<Link
						key={year}
						href={hrefForYear(year)}
						className={`inline-flex min-h-8 items-center rounded-md px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold-500 ${
							active ? 'bg-white font-semibold text-navy-950 shadow-card' : 'font-medium text-slate-600 hover:text-navy-900'
						}`}
						aria-current={active ? 'page' : undefined}
					>
						{year}
					</Link>
				)
			})}
		</nav>
	)
}
