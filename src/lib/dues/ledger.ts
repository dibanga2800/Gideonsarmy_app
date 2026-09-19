import { isOwingDuesStatus } from '@/lib/dues/compliance'
import {
	countMonthsDueToDateInYear,
	DUES_TRACKING_START_MONTH,
	isDueMonthDue,
	listChargeableMonthsInYear,
	listYearDueMonths,
} from '@/lib/dates/dues-year'
import { addPence, DEFAULT_MONTHLY_DUES_PENCE } from '@/lib/money'
import type { DuesRecord } from '@/types/database'

export type LedgerCellState = 'paid' | 'owing' | 'waived' | 'not_due' | 'missing'

export interface LedgerCell {
	month: string
	state: LedgerCellState
	dues: DuesRecord | null
}

export interface MemberYearLedger {
	cells: LedgerCell[]
	dueToDatePence: number
	paidPence: number
	owingPence: number
	owingMonths: number
	annualPence: number
	isUpToDate: boolean
}

const dueMonthKey = (value: string) => value.slice(0, 10)

export const buildMemberYearLedger = (
	dues: DuesRecord[],
	year: number,
	from = new Date(),
	monthlyPence = DEFAULT_MONTHLY_DUES_PENCE,
	duesStartMonth = DUES_TRACKING_START_MONTH,
): MemberYearLedger => {
	const byMonth = new Map(
		dues
			.filter((row) => dueMonthKey(row.due_month).startsWith(`${year}-`))
			.map((row) => [dueMonthKey(row.due_month), row]),
	)

	const cells = listYearDueMonths(year).map((month): LedgerCell => {
		const row = byMonth.get(month) ?? null

		if (row?.status === 'CONFIRMED') {
			return { month, state: 'paid', dues: row }
		}

		if (row?.status === 'WAIVED') {
			return { month, state: 'waived', dues: row }
		}

		if (
			month < duesStartMonth
			|| row?.status === 'NOT_APPLICABLE'
			|| !isDueMonthDue(month, from)
		) {
			return { month, state: 'not_due', dues: row }
		}

		if (!row) {
			return { month, state: 'missing', dues: null }
		}

		if (isOwingDuesStatus(row.status)) {
			return { month, state: 'owing', dues: row }
		}

		return { month, state: 'missing', dues: row }
	})

	const monthsDue = countMonthsDueToDateInYear(year, from, duesStartMonth)
	const monthsInYear = listChargeableMonthsInYear(year, duesStartMonth, from, false).length
	const owingCells = cells.filter((cell) => cell.state === 'owing' || cell.state === 'missing')
	const paidPence = addPence(
		...cells
			.filter((cell) => cell.state === 'paid')
			.map((cell) => cell.dues?.amount_paid_pence ?? monthlyPence),
	)
	const owingPence = addPence(
		...owingCells.map((cell) =>
			cell.dues
				? cell.dues.amount_due_pence - cell.dues.amount_paid_pence
				: monthlyPence,
		),
	)

	return {
		cells,
		dueToDatePence: monthsDue * monthlyPence,
		paidPence,
		owingPence,
		owingMonths: owingCells.length,
		annualPence: monthsInYear * monthlyPence,
		isUpToDate: owingCells.length === 0,
	}
}

export const summariseFellowshipLedger = (rows: MemberYearLedger[]) => {
	const owingMembers = rows.filter((row) => !row.isUpToDate)

	return {
		memberCount: rows.length,
		owingMembers: owingMembers.length,
		owingPence: addPence(...rows.map((row) => row.owingPence)),
		paidPence: addPence(...rows.map((row) => row.paidPence)),
	}
}
