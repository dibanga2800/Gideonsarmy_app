import type { CSSProperties } from 'react'
import { formatDueMonth } from '@/lib/dates/due-month'
import { formatMonthShort } from '@/lib/dates/dues-year'
import type { LedgerCell, LedgerCellState } from '@/lib/dues/ledger'

type StripTone = 'light' | 'dark'

const notDueHatch =
	'[background-image:repeating-linear-gradient(135deg,transparent_0_5px,var(--hatch)_5px_6px)]'

const cellClass: Record<StripTone, Record<LedgerCellState, string>> = {
	light: {
		paid: 'bg-emerald-700 text-white',
		owing: 'bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-600',
		waived: 'bg-cream-100 text-slate-600 ring-1 ring-inset ring-slate-300',
		not_due: `bg-white text-slate-500 ring-1 ring-inset ring-cream-300 [--hatch:rgb(225_228_234/0.7)] ${notDueHatch}`,
		missing: 'border border-dashed border-field bg-white text-slate-500',
	},
	dark: {
		paid: 'bg-emerald-500 text-navy-950',
		owing: 'bg-amber-300 text-navy-950',
		waived: 'bg-white/10 text-white/75 ring-1 ring-inset ring-white/25',
		not_due: `bg-white/[0.03] text-white/60 ring-1 ring-inset ring-white/15 [--hatch:rgb(255_255_255/0.06)] ${notDueHatch}`,
		missing: 'border border-dashed border-white/30 text-white/60',
	},
}

const stateLabel: Record<LedgerCellState, string> = {
	paid: 'Paid',
	owing: 'To pay',
	waived: 'Waived',
	not_due: 'Not yet due',
	missing: 'Not set up',
}

/**
 * A shape cue under each month so paid and owing differ by more than colour:
 * green and amber are close in lightness for colour-blind members.
 */
const StateMark = ({ state }: { state: LedgerCellState }) => {
	if (state === 'paid') {
		return (
			<svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
				<path d="m5 12.5 4.5 4.5L19 7.5" />
			</svg>
		)
	}

	if (state === 'owing') {
		return (
			<span className="mt-0.5 text-[0.6875rem] font-bold leading-none" aria-hidden="true">
				£
			</span>
		)
	}

	return null
}

interface DuesMonthStripProps {
	cells: LedgerCell[]
	year: number
	tone?: StripTone
	size?: 'default' | 'compact'
	showLegend?: boolean
}

/**
 * A member's year at a glance: one cell per month, coloured by whether it has
 * been paid, is still to pay, was waived, or is not yet due. The months rise
 * in sequence on load; reduced-motion users see them in place.
 */
export const DuesMonthStrip = ({
	cells,
	year,
	tone = 'light',
	size = 'default',
	showLegend = true,
}: DuesMonthStripProps) => {
	const compact = size === 'compact'
	const present = new Set(cells.map((cell) => cell.state))
	const palette = cellClass[tone]

	return (
		<div>
			<ol
				className={`grid grid-cols-6 gap-1.5 sm:grid-cols-12 ${compact ? '' : 'sm:gap-2'}`}
				aria-label={`Monthly dues for ${year}`}
			>
				{cells.map((cell, index) => (
					<li
						key={cell.month}
						style={{ animationDelay: `${index * 35}ms` } as CSSProperties}
						className={`flex flex-col items-center justify-center rounded-md motion-safe:animate-rise ${
							compact ? 'h-9' : 'h-12 sm:h-14'
						} ${palette[cell.state]}`}
						title={`${formatDueMonth(cell.month)}: ${stateLabel[cell.state]}`}
					>
						<span className={`font-semibold ${compact ? 'text-[0.6875rem]' : 'text-xs sm:text-[0.8125rem]'}`}>
							{formatMonthShort(cell.month)}
						</span>
						{compact ? null : <StateMark state={cell.state} />}
						<span className="sr-only">: {stateLabel[cell.state]}</span>
					</li>
				))}
			</ol>
			{showLegend ? (
				<ul
					className={`mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs ${tone === 'dark' ? 'text-white/70' : 'text-slate-600'}`}
					aria-hidden="true"
				>
					{(['paid', 'owing', 'waived', 'not_due'] as const)
						.filter((state) => present.has(state))
						.map((state) => (
							<li key={state} className="inline-flex items-center gap-1.5">
								<span className={`h-3 w-3 rounded-sm ${palette[state]}`} />
								{stateLabel[state]}
							</li>
						))}
				</ul>
			) : null}
		</div>
	)
}
