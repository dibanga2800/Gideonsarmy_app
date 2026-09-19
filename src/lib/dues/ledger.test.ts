import { describe, expect, it } from 'vitest'
import { buildMemberYearLedger } from './ledger'
import type { DuesRecord } from '@/types/database'

const dues = (month: string, status: DuesRecord['status'], paid = 0): DuesRecord => ({
	id: `${month}-id`,
	member_id: '11111111-1111-4111-8111-111111111111',
	due_month: month,
	amount_due_pence: 1000,
	amount_paid_pence: paid,
	status,
	created_at: '2026-01-01T00:00:00.000Z',
	updated_at: '2026-01-01T00:00:00.000Z',
})

describe('member year ledger', () => {
	it('treats January to current month as due, later months as not yet due', () => {
		const now = new Date('2026-09-16T12:00:00.000Z')
		const ledger = buildMemberYearLedger(
			[
				dues('2026-01-01', 'CONFIRMED', 1000),
				dues('2026-02-01', 'CONFIRMED', 1000),
				dues('2026-03-01', 'OUTSTANDING'),
			],
			2026,
			now,
		)

		expect(ledger.annualPence).toBe(12_000)
		expect(ledger.dueToDatePence).toBe(9000)
		expect(ledger.paidPence).toBe(2000)
		expect(ledger.owingMonths).toBe(7)
		expect(ledger.owingPence).toBe(7000)
		expect(ledger.cells[2]?.state).toBe('owing')
		expect(ledger.cells[8]?.state).toBe('missing')
		expect(ledger.cells[9]?.state).toBe('not_due')
		expect(ledger.isUpToDate).toBe(false)
	})

	it('does not charge months before a September joining month', () => {
		const now = new Date('2026-09-16T12:00:00.000Z')
		const ledger = buildMemberYearLedger(
			[dues('2026-09-01', 'OUTSTANDING')],
			2026,
			now,
			1000,
			'2026-09-01',
		)

		expect(ledger.cells[0]?.state).toBe('not_due')
		expect(ledger.cells[7]?.state).toBe('not_due')
		expect(ledger.cells[8]?.state).toBe('owing')
		expect(ledger.dueToDatePence).toBe(1000)
		expect(ledger.annualPence).toBe(4000)
		expect(ledger.owingMonths).toBe(1)
		expect(ledger.owingPence).toBe(1000)
	})

	it('keeps 2026 unpaid months off the 2027 ledger', () => {
		const now = new Date('2027-03-16T12:00:00.000Z')
		const ledger = buildMemberYearLedger(
			[
				dues('2026-12-01', 'OUTSTANDING'),
				dues('2027-01-01', 'CONFIRMED', 1000),
				dues('2027-02-01', 'OUTSTANDING'),
			],
			2027,
			now,
		)

		expect(ledger.dueToDatePence).toBe(3000)
		expect(ledger.paidPence).toBe(1000)
		expect(ledger.owingMonths).toBe(2)
		expect(ledger.owingPence).toBe(2000)
		expect(ledger.cells[0]?.state).toBe('paid')
		expect(ledger.cells[1]?.state).toBe('owing')
	})
})
