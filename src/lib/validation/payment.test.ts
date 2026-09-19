import { describe, expect, it } from 'vitest'
import { adminRecordPaymentSchema, adminWaiveDuesSchema } from './payment'

describe('adminRecordPaymentSchema', () => {
	it('converts pounds to integer pence', () => {
		expect(
			adminRecordPaymentSchema.parse({
				memberId: '11111111-1111-4111-8111-111111111111',
				duesIds: ['22222222-2222-4222-8222-222222222222'],
				amountPounds: '20.00',
				paymentDate: '2020-01-15',
				transactionReference: 'BANK-REF-1',
				notes: '',
			}),
		).toMatchObject({
			amountPounds: 2000,
			notes: null,
		})
	})

	it('rejects leftover fractional amounts that are not whole pence', () => {
		expect(
			adminRecordPaymentSchema.safeParse({
				memberId: '11111111-1111-4111-8111-111111111111',
				duesIds: ['22222222-2222-4222-8222-222222222222'],
				amountPounds: '10.001',
				paymentDate: '2020-01-15',
				transactionReference: 'BANK-REF-1',
				notes: null,
			}).success,
		).toBe(false)
	})
})

describe('adminWaiveDuesSchema', () => {
	it('requires a dues id', () => {
		expect(adminWaiveDuesSchema.safeParse({ duesId: 'not-a-uuid' }).success).toBe(false)
	})
})
