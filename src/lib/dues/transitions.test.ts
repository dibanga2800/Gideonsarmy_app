import { describe, expect, it } from 'vitest'
import {
	canAdminAllocateDues,
	canAdminReviewSubmission,
	canAdminWaiveDues,
	canMemberSubmitPayment,
	duesStatusAfterConfirmation,
	duesStatusAfterRejection,
	duesStatusAfterSubmission,
} from './transitions'

describe('payment state transitions', () => {
	it('lets an administrator allocate only outstanding months', () => {
		expect(canAdminAllocateDues('OUTSTANDING')).toBe(true)
		expect(canAdminAllocateDues('PAYMENT_SUBMITTED')).toBe(false)
		expect(canAdminAllocateDues('CONFIRMED')).toBe(false)
		expect(canAdminAllocateDues('WAIVED')).toBe(false)
	})

	it('lets a member submit only while a month is outstanding', () => {
		expect(canMemberSubmitPayment('OUTSTANDING')).toBe(true)
		expect(canMemberSubmitPayment('PAYMENT_SUBMITTED')).toBe(false)
		expect(canMemberSubmitPayment('CONFIRMED')).toBe(false)
		expect(canMemberSubmitPayment('WAIVED')).toBe(false)
	})

	it('moves dues to submitted, never confirmed, after a member payment', () => {
		expect(duesStatusAfterSubmission()).toBe('PAYMENT_SUBMITTED')
		expect(duesStatusAfterConfirmation()).toBe('CONFIRMED')
	})

	it('allows an administrator to review only a submitted payment', () => {
		expect(canAdminReviewSubmission('PAYMENT_SUBMITTED', 'SUBMITTED')).toBe(true)
		expect(canAdminReviewSubmission('OUTSTANDING', 'SUBMITTED')).toBe(false)
		expect(canAdminReviewSubmission('PAYMENT_SUBMITTED', 'CONFIRMED')).toBe(false)
		expect(canAdminReviewSubmission('CONFIRMED', 'CONFIRMED')).toBe(false)
	})

	it('returns outstanding after rejection when no other submission is waiting', () => {
		expect(duesStatusAfterRejection(0)).toBe('OUTSTANDING')
		expect(duesStatusAfterRejection(1)).toBe('PAYMENT_SUBMITTED')
	})

	it('allows waiver only while a month is still outstanding', () => {
		expect(canAdminWaiveDues('OUTSTANDING')).toBe(true)
		expect(canAdminWaiveDues('CONFIRMED')).toBe(false)
		expect(canAdminWaiveDues('PAYMENT_SUBMITTED')).toBe(false)
	})
})
