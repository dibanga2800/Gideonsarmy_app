import { describe, expect, it } from 'vitest'
import { summariseDuesCompliance, listOwingLedgerYears } from './compliance'
import type { DuesRecord } from '@/types/database'

const row = (overrides: Partial<DuesRecord>): DuesRecord => ({
	id: '11111111-1111-4111-8111-111111111111',
	member_id: '22222222-2222-4222-8222-222222222222',
	due_month: '2026-09-01',
	amount_due_pence: 1000,
	amount_paid_pence: 0,
	status: 'OUTSTANDING',
	created_at: '2026-09-01T00:00:00.000Z',
	updated_at: '2026-09-01T00:00:00.000Z',
	...overrides,
})

describe('summariseDuesCompliance', () => {
	it('treats confirmed and waived months as up to date', () => {
		expect(
			summariseDuesCompliance([
				row({ status: 'CONFIRMED', amount_paid_pence: 1000 }),
				row({ id: '33333333-3333-4333-8333-333333333333', status: 'WAIVED' }),
			]),
		).toEqual({
			isUpToDate: true,
			owingMonths: 0,
			outstandingPence: 0,
		})
	})

	it('counts outstanding and submitted months as owing', () => {
		expect(
			summariseDuesCompliance([
				row({ status: 'OUTSTANDING' }),
				row({
					id: '33333333-3333-4333-8333-333333333333',
					due_month: '2026-10-01',
					status: 'PAYMENT_SUBMITTED',
					amount_due_pence: 1000,
					amount_paid_pence: 0,
				}),
			]),
		).toEqual({
			isUpToDate: false,
			owingMonths: 2,
			outstandingPence: 2000,
		})
	})

	it('does not add a previous year unpaid balance to the current year', () => {
		const rows = [
			row({ status: 'OUTSTANDING' }),
			row({
				id: '33333333-3333-4333-8333-333333333333',
				due_month: '2027-01-01',
				status: 'CONFIRMED',
				amount_paid_pence: 1000,
			}),
			row({
				id: '44444444-4444-4444-8444-444444444444',
				due_month: '2027-02-01',
				status: 'OUTSTANDING',
			}),
		]

		expect(summariseDuesCompliance(rows, 2027)).toEqual({
			isUpToDate: false,
			owingMonths: 1,
			outstandingPence: 1000,
		})
		expect(summariseDuesCompliance(rows, 2026)).toEqual({
			isUpToDate: false,
			owingMonths: 1,
			outstandingPence: 1000,
		})
		expect(listOwingLedgerYears(rows)).toEqual([2026, 2027])
	})
})
