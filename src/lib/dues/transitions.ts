import type { DuesStatus, PaymentSubmissionStatus } from '@/types/roles'

export const canMemberSubmitPayment = (status: DuesStatus) => status === 'OUTSTANDING'

export const canAdminAllocateDues = (status: DuesStatus) => status === 'OUTSTANDING'

export const duesStatusAfterSubmission = (): DuesStatus => 'PAYMENT_SUBMITTED'

export const canAdminReviewSubmission = (
	duesStatus: DuesStatus,
	submissionStatus: PaymentSubmissionStatus,
) => submissionStatus === 'SUBMITTED' && duesStatus === 'PAYMENT_SUBMITTED'

export const duesStatusAfterConfirmation = (): DuesStatus => 'CONFIRMED'

export const duesStatusAfterRejection = (remainingSubmittedCount: number): DuesStatus =>
	remainingSubmittedCount > 0 ? 'PAYMENT_SUBMITTED' : 'OUTSTANDING'

export const canAdminWaiveDues = (status: DuesStatus) => status === 'OUTSTANDING'
