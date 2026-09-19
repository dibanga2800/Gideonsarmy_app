import type { DuesStatus, PaymentSubmissionStatus } from '@/types/roles'

export const duesStatusLabel = (status: DuesStatus) => {
	if (status === 'OUTSTANDING') {
		return 'Outstanding'
	}

	if (status === 'PAYMENT_SUBMITTED') {
		return 'Payment submitted'
	}

	if (status === 'CONFIRMED') {
		return 'Confirmed'
	}

	if (status === 'WAIVED') {
		return 'Waived'
	}

	return 'Not applicable'
}

export const paymentSubmissionStatusLabel = (status: PaymentSubmissionStatus) => {
	if (status === 'SUBMITTED') {
		return 'Submitted'
	}

	if (status === 'CONFIRMED') {
		return 'Confirmed'
	}

	return 'Rejected'
}

export const duesComplianceLabel = (isUpToDate: boolean) =>
	isUpToDate ? 'Up to date' : 'Owing'

export const formatSortCode = (sortCode: string) => {
	if (!/^\d{6}$/.test(sortCode)) {
		return sortCode
	}

	return `${sortCode.slice(0, 2)}-${sortCode.slice(2, 4)}-${sortCode.slice(4, 6)}`
}
