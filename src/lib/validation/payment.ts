import { z } from 'zod'
import { getLondonDate } from '@/lib/dates/due-month'
import { MAX_PAYMENT_PENCE, parsePoundsToPence } from '@/lib/money'

const emptyToNull = (value: unknown) => {
	if (typeof value !== 'string') {
		return value
	}

	const trimmed = value.trim()
	return trimmed === '' ? null : trimmed
}

export const memberPaymentInputSchema = z.object({
	duesId: z.string().uuid(),
	amountPounds: z.string().trim().transform((value, context) => {
		const pence = parsePoundsToPence(value)

		if (pence === null || pence <= 0 || pence > MAX_PAYMENT_PENCE) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Enter a valid amount',
			})
			return z.NEVER
		}

		return pence
	}),
	paymentDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid payment date')
		.refine((value) => value <= getLondonDate(), 'Enter a payment date that is not in the future'),
	transactionReference: z.string().trim().min(1).max(64),
	notes: z.preprocess(emptyToNull, z.string().max(500).nullable()),
})

export const adminPaymentReviewSchema = z.object({
	submissionId: z.string().uuid(),
	decision: z.union([z.literal('CONFIRMED'), z.literal('REJECTED')]),
	reviewerNote: z.preprocess(emptyToNull, z.string().max(500).nullable()),
})

export const adminWaiveDuesSchema = z.object({
	duesId: z.string().uuid(),
})

export const adminRecordPaymentSchema = z.object({
	memberId: z.string().uuid(),
	duesIds: z.array(z.string().uuid()).min(1, 'Select at least one month'),
	amountPounds: z.string().trim().transform((value, context) => {
		const pence = parsePoundsToPence(value)

		if (pence === null || pence <= 0 || pence > MAX_PAYMENT_PENCE) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Enter a valid amount',
			})
			return z.NEVER
		}

		return pence
	}),
	paymentDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid payment date')
		.refine((value) => value <= getLondonDate(), 'Enter a payment date that is not in the future'),
	transactionReference: z.string().trim().min(1).max(64),
	notes: z.preprocess(emptyToNull, z.string().max(500).nullable()),
})


export const paymentAccountSchema = z.object({
	accountName: z.string().trim().min(1).max(80),
	sortCode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit sort code'),
	accountNumber: z.string().trim().regex(/^\d{8}$/, 'Enter an 8-digit account number'),
	referenceNote: z.string().trim().max(200),
})

export const storedPaymentAccountSchema = z.object({
	accountName: z.string().max(80),
	sortCode: z.string().max(6),
	accountNumber: z.string().max(8),
	referenceNote: z.string().max(200),
})

export const paymentSubmissionFilterSchema = z.union([
	z.literal('all'),
	z.literal('SUBMITTED'),
	z.literal('CONFIRMED'),
	z.literal('REJECTED'),
])

export const evidenceIdSchema = z.string().uuid()

export type AdminRecordPaymentInput = z.infer<typeof adminRecordPaymentSchema>
export type MemberPaymentInput = z.infer<typeof memberPaymentInputSchema>
export type AdminPaymentReview = z.infer<typeof adminPaymentReviewSchema>
export type PaymentAccount = z.infer<typeof paymentAccountSchema>
export type StoredPaymentAccount = z.infer<typeof storedPaymentAccountSchema>
