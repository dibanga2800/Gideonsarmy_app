import { z } from 'zod'
import { DUES_STATUSES, PAYMENT_SUBMISSION_STATUSES } from '@/types/roles'
import { logEvent } from '@/lib/logging'
import type { DuesRecord, PaymentEvidence, PaymentSubmission } from '@/types/database'

const dateOnly = z
	.string()
	.transform((value) => value.slice(0, 10))
	.refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), 'Enter a valid date')

const dueMonth = dateOnly.refine(
	(value) => value.endsWith('-01'),
	'Due month must be the first day of the month',
)

export const DUES_SELECT_COLUMNS =
	'id, member_id, due_month, amount_due_pence, amount_paid_pence, status, created_at, updated_at'

export const PAYMENT_SUBMISSION_SELECT_COLUMNS =
	'id, dues_id, member_id, amount_pence, payment_date, transaction_reference, notes, status, submitted_at, reviewed_at, reviewed_by, reviewer_note, created_at, updated_at'

export const PAYMENT_EVIDENCE_SELECT_COLUMNS =
	'id, payment_submission_id, member_id, storage_path, original_filename, mime_type, file_size, created_at'

export const duesRecordSchema = z.object({
	id: z.string().uuid(),
	member_id: z.string().uuid(),
	due_month: dueMonth,
	amount_due_pence: z.number().int().min(0),
	amount_paid_pence: z.number().int().min(0),
	status: z.enum(DUES_STATUSES),
	created_at: z.string().min(1),
	updated_at: z.string().min(1),
})

export const paymentSubmissionSchema = z.object({
	id: z.string().uuid(),
	dues_id: z.string().uuid(),
	member_id: z.string().uuid(),
	amount_pence: z.number().int().positive(),
	payment_date: dateOnly,
	transaction_reference: z.string().min(1).max(64),
	notes: z.string().max(500).nullable(),
	status: z.enum(PAYMENT_SUBMISSION_STATUSES),
	submitted_at: z.string().min(1),
	reviewed_at: z.string().min(1).nullable(),
	reviewed_by: z.string().uuid().nullable(),
	reviewer_note: z.string().max(500).nullable(),
	created_at: z.string().min(1),
	updated_at: z.string().min(1),
})

export const paymentEvidenceSchema = z.object({
	id: z.string().uuid(),
	payment_submission_id: z.string().uuid(),
	member_id: z.string().uuid(),
	storage_path: z.string().min(1),
	original_filename: z.string().min(1).max(80),
	mime_type: z.string().min(1),
	file_size: z.number().int().positive(),
	created_at: z.string().min(1),
})

const parseOrNull = <T>(
	schema: z.ZodType<T>,
	value: unknown,
	operation: string,
): T | null => {
	if (value === null || value === undefined) {
		return null
	}

	const parsed = schema.safeParse(value)

	if (!parsed.success) {
		logEvent({
			operation,
			status: 'error',
			errorCategory: 'validation',
		})
		return null
	}

	return parsed.data
}

export const parseDuesRecord = (value: unknown): DuesRecord | null =>
	parseOrNull(duesRecordSchema, value, 'dues.parse')

export const parseDuesRecords = (value: unknown): DuesRecord[] => {
	if (!Array.isArray(value)) {
		return []
	}

	return value.flatMap((row) => {
		const record = parseDuesRecord(row)
		return record ? [record] : []
	})
}

export const parsePaymentSubmission = (value: unknown): PaymentSubmission | null =>
	parseOrNull(paymentSubmissionSchema, value, 'payments.parseSubmission')

export const parsePaymentSubmissions = (value: unknown): PaymentSubmission[] => {
	if (!Array.isArray(value)) {
		return []
	}

	return value.flatMap((row) => {
		const record = parsePaymentSubmission(row)
		return record ? [record] : []
	})
}

export const parsePaymentEvidence = (value: unknown): PaymentEvidence | null =>
	parseOrNull(paymentEvidenceSchema, value, 'payments.parseEvidence')

export const parsePaymentEvidenceList = (value: unknown): PaymentEvidence[] => {
	if (!Array.isArray(value)) {
		return []
	}

	return value.flatMap((row) => {
		const record = parsePaymentEvidence(row)
		return record ? [record] : []
	})
}
