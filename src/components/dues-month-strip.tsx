import { formatDueMonth } from '@/lib/dates/due-month'
import { formatMonthShort } from '@/lib/dates/dues-year'
import type { LedgerCell, LedgerCellState } from '@/lib/dues/ledger'

const cellClass: Record<LedgerCellState, string> = {
	paid: 'bg-emerald-600 text-white',
	owing: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-400',
	waived: 'bg-cream-100 text-slate-500 ring-1 ring-inset ring-slate-300',
	not_due: 'bg-white text-slate-400 ring-1 ring-inset ring-cream-300 [background-image:repeating-linear-gradient(135deg,transparent_0_5px,rgb(225_228_234/0.7)_5px_6px)]',
	missing: 'border border-dashed border-cream-300 bg-white text-slate-400',
}

const stateLabel: Record<LedgerCellState, string> = {
	paid: 'Paid',
	owing: 'To pay',
	waived: 'Waived',
	not_due: 'Not yet due',
	missing: 'Not set up',
}

interface DuesMonthStripProps {
	cells: LedgerCell[]
	year: number
	size?: 'default' | 'compact'
	showLegend?: boolean
}

/**
 * A member's year at a glance: one cell per month, coloured by whether it has
 * been paid, is still to pay, was waived, or is not yet due.
 */
export const DuesMonthStrip = ({ cells, year, size = 'default', showLegend = true }: DuesMonthStripProps) => {
	const compact = size === 'compact'
	const present = new Set(cells.map((cell) => cell.state))

	return (
		<div>
			<ol
				className={`grid grid-cols-6 gap-1.5 sm:grid-cols-12 ${compact ? '' : 'sm:gap-2'}`}
				aria-label={`Monthly dues for ${year}`}
			>
				{cells.map((cell) => (
					<li
						key={cell.month}
						className={`flex flex-col items-center justify-center rounded-md ${compact ? 'h-9' : 'h-12 sm:h-14'} ${cellClass[cell.state]}`}
						title={`${formatDueMonth(cell.month)}: ${stateLabel[cell.state]}`}
					>
						<span className={`font-semibold ${compact ? 'text-[0.6875rem]' : 'text-xs sm:text-[0.8125rem]'}`}>
							{formatMonthShort(cell.month)}
						</span>
						<span className="sr-only">: {stateLabel[cell.state]}</span>
					</li>
				))}
			</ol>
			{showLegend ? (
				<ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500" aria-hidden="true">
					{(['paid', 'owing', 'waived', 'not_due'] as const)
						.filter((state) => present.has(state))
						.map((state) => (
							<li key={state} className="inline-flex items-center gap-1.5">
								<span className={`h-3 w-3 rounded-sm ${cellClass[state]}`} />
								{stateLabel[state]}
							</li>
						))}
				</ul>
			) : null}
		</div>
	)
}
