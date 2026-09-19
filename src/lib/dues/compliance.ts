import { filterDuesForYear } from '@/lib/dates/dues-year'
import { addPence } from '@/lib/money'
import type { DuesRecord } from '@/types/database'

export const isOwingDuesStatus = (status: DuesRecord['status']) =>
	status === 'OUTSTANDING' || status === 'PAYMENT_SUBMITTED'

export const summariseDuesCompliance = (dues: DuesRecord[], year?: number) => {
	const scoped = year === undefined ? dues : filterDuesForYear(dues, year)
	const owing = scoped.filter((row) => isOwingDuesStatus(row.status))
	const outstandingPence = addPence(
		...owing.map((row) => row.amount_due_pence - row.amount_paid_pence),
	)

	return {
		isUpToDate: owing.length === 0,
		owingMonths: owing.length,
		outstandingPence,
	}
}

export const listOwingLedgerYears = (dues: DuesRecord[]) => {
	const years = new Set<number>()

	for (const row of dues) {
		if (!isOwingDuesStatus(row.status)) {
			continue
		}

		const year = Number(row.due_month.slice(0, 4))
		if (Number.isInteger(year)) {
			years.add(year)
		}
	}

	return [...years].sort((left, right) => left - right)
}
