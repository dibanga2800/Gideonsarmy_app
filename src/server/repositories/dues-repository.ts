import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logClientError, logEvent } from '@/lib/logging'
import { getCurrentDueMonth } from '@/lib/dates/due-month'
import { DUES_TRACKING_START_MONTH, listDueMonthsToDate } from '@/lib/dates/dues-year'
import {
	DEFAULT_PAYMENT_PAGE_SIZE,
	normalisePage,
	normalisePageSize,
	pageOffset,
	totalPagesFor,
} from '@/lib/list-pagination'
import {
	DUES_SELECT_COLUMNS,
	PAYMENT_EVIDENCE_SELECT_COLUMNS,
	PAYMENT_SUBMISSION_SELECT_COLUMNS,
	parseDuesRecord,
	parseDuesRecords,
	parsePaymentEvidence,
	parsePaymentEvidenceList,
	parsePaymentSubmission,
	parsePaymentSubmissions,
} from '@/lib/validation/dues'
import type { PaymentAccount, StoredPaymentAccount } from '@/lib/validation/payment'
import { storedPaymentAccountSchema } from '@/lib/validation/payment'
import type { PaymentSubmissionStatus } from '@/types/roles'

const DUES_LIST_LIMIT = 120
const PAYMENT_LIST_LIMIT = 200
const YEAR_DUES_LIMIT = 1000

export const ensureOwnCurrentMonthDues = async () => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('ensure_own_current_month_dues')

	if (error) {
		logClientError('dues.ensureOwn', error)
		return null
	}

	return parseDuesRecord(data)
}

export const listOwnDues = async (memberId: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('dues')
		.select(DUES_SELECT_COLUMNS)
		.eq('member_id', memberId)
		.order('due_month', { ascending: false })
		.limit(DUES_LIST_LIMIT)

	if (error) {
		logEvent({
			operation: 'dues.listOwn',
			status: 'error',
			errorCategory: 'database',
		})
		throw new Error('Unable to load dues')
	}

	return parseDuesRecords(data)
}

export const listMemberDuesForAdmin = async (memberId: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('dues')
		.select(DUES_SELECT_COLUMNS)
		.eq('member_id', memberId)
		.order('due_month', { ascending: false })
		.limit(DUES_LIST_LIMIT)

	if (error) {
		logEvent({
			operation: 'dues.listForAdmin',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parseDuesRecords(data)
}

export const findDuesById = async (id: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('dues')
		.select(DUES_SELECT_COLUMNS)
		.eq('id', id)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'dues.findById',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseDuesRecord(data)
}

export const listOwnSubmissions = async (memberId: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('payment_submissions')
		.select(PAYMENT_SUBMISSION_SELECT_COLUMNS)
		.eq('member_id', memberId)
		.order('submitted_at', { ascending: false })
		.limit(PAYMENT_LIST_LIMIT)

	if (error) {
		logEvent({
			operation: 'payments.listOwn',
			status: 'error',
			errorCategory: 'database',
		})
		throw new Error('Unable to load payment submissions')
	}

	return parsePaymentSubmissions(data)
}

export const adminEnsureDuesRange = async (fromMonth = DUES_TRACKING_START_MONTH, toMonth = getCurrentDueMonth()) => {
	const supabase = createSupabaseServerClient()
	const months = listDueMonthsToDate().filter((month) => month >= fromMonth && month <= toMonth)
	let generatedAny = false

	for (const month of months) {
		const { error: monthError } = await supabase.rpc('admin_generate_month_dues', {
			p_due_month: month,
		})

		if (monthError) {
			logClientError('dues.generateMonth', monthError)
			continue
		}

		generatedAny = true
	}

	if (generatedAny) {
		return true
	}

	const { error } = await supabase.rpc('admin_ensure_dues_range', {
		p_from: fromMonth,
		p_to: toMonth,
	})

	if (error) {
		logClientError('dues.ensureRange', error)
		return false
	}

	return true
}

export const listDuesForYear = async (year: number) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('dues')
		.select(DUES_SELECT_COLUMNS)
		.gte('due_month', `${year}-01-01`)
		.lt('due_month', `${year + 1}-01-01`)
		.order('due_month', { ascending: true })
		.limit(YEAR_DUES_LIMIT)

	if (error) {
		logEvent({
			operation: 'dues.listYear',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parseDuesRecords(data)
}

export const insertPaymentEvidenceRecord = async (input: {
	paymentSubmissionId: string
	memberId: string
	storagePath: string
	originalFilename: string
	mimeType: string
	fileSize: number
}) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('payment_evidence')
		.insert({
			payment_submission_id: input.paymentSubmissionId,
			member_id: input.memberId,
			storage_path: input.storagePath,
			original_filename: input.originalFilename,
			mime_type: input.mimeType,
			file_size: input.fileSize,
		})
		.select(PAYMENT_EVIDENCE_SELECT_COLUMNS)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'payments.insertEvidence',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parsePaymentEvidence(data)
}

export const uploadPaymentEvidenceObject = async (input: {
	storagePath: string
	bytes: Uint8Array
	mimeType: string
}) => {
	const supabase = createSupabaseServerClient()
	const { error } = await supabase.storage.from('payment-evidence').upload(input.storagePath, input.bytes, {
		contentType: input.mimeType,
		upsert: false,
	})

	if (error) {
		logEvent({
			operation: 'payments.uploadEvidence',
			status: 'error',
			errorCategory: 'storage',
		})
		return false
	}

	return true
}

export const listEvidenceForSubmissions = async (submissionIds: string[]) => {
	if (submissionIds.length === 0) {
		return []
	}

	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('payment_evidence')
		.select(PAYMENT_EVIDENCE_SELECT_COLUMNS)
		.in('payment_submission_id', submissionIds)

	if (error) {
		logEvent({
			operation: 'payments.listEvidence',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parsePaymentEvidenceList(data)
}

export const findPaymentEvidenceById = async (id: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('payment_evidence')
		.select(PAYMENT_EVIDENCE_SELECT_COLUMNS)
		.eq('id', id)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'payments.findEvidence',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parsePaymentEvidence(data)
}

export const createPaymentEvidenceSignedUrl = async (storagePath: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.storage
		.from('payment-evidence')
		.createSignedUrl(storagePath, 60)

	if (error || !data?.signedUrl) {
		logEvent({
			operation: 'payments.signEvidence',
			status: 'error',
			errorCategory: 'storage',
		})
		return null
	}

	return data.signedUrl
}

export const listAdminPaymentSubmissions = async (status?: PaymentSubmissionStatus) => {
	const page = await listAdminPaymentSubmissionsPage({ status, page: 1, pageSize: PAYMENT_LIST_LIMIT })
	return page.items
}

export const listAdminPaymentSubmissionsPage = async (input: {
	status?: PaymentSubmissionStatus
	page?: number
	pageSize?: number
}) => {
	const pageSize = normalisePageSize(input.pageSize ?? DEFAULT_PAYMENT_PAGE_SIZE, DEFAULT_PAYMENT_PAGE_SIZE)
	const requestedPage = Math.max(1, Math.floor(input.page ?? 1) || 1)
	const supabase = createSupabaseServerClient()

	let countQuery = supabase
		.from('payment_submissions')
		.select('id', { count: 'exact', head: true })

	if (input.status) {
		countQuery = countQuery.eq('status', input.status)
	}

	const { count, error: countError } = await countQuery
	if (countError) {
		logEvent({
			operation: 'payments.countAdmin',
			status: 'error',
			errorCategory: 'database',
		})
		throw new Error('Unable to load payment submissions')
	}

	const total = count ?? 0
	const totalPages = totalPagesFor(total, pageSize)
	const page = normalisePage(requestedPage, totalPages)
	const from = pageOffset(page, pageSize)
	const to = from + pageSize - 1

	let query = supabase
		.from('payment_submissions')
		.select(PAYMENT_SUBMISSION_SELECT_COLUMNS)
		.order('submitted_at', { ascending: false })
		.range(from, to)

	if (input.status) {
		query = query.eq('status', input.status)
	}

	const { data, error } = await query

	if (error) {
		logEvent({
			operation: 'payments.listAdmin',
			status: 'error',
			errorCategory: 'database',
		})
		throw new Error('Unable to load payment submissions')
	}

	return {
		items: parsePaymentSubmissions(data),
		total,
		page,
		pageSize,
		totalPages,
	}
}

export const findPaymentSubmissionById = async (id: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('payment_submissions')
		.select(PAYMENT_SUBMISSION_SELECT_COLUMNS)
		.eq('id', id)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'payments.findById',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parsePaymentSubmission(data)
}

export const reviewPaymentRecord = async (input: {
	submissionId: string
	decision: 'CONFIRMED' | 'REJECTED'
	reviewerNote: string | null
}) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_review_payment', {
		p_submission_id: input.submissionId,
		p_decision: input.decision,
		p_reviewer_note: input.reviewerNote,
	})

	if (error) {
		logEvent({
			operation: 'payments.review',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parsePaymentSubmission(data)
}

export const waiveDuesRecord = async (duesId: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_waive_dues', {
		p_dues_id: duesId,
	})

	if (error) {
		logEvent({
			operation: 'dues.waive',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseDuesRecord(data)
}

export const listOutstandingDuesForAdmin = async (year?: number) => {
	const supabase = createSupabaseServerClient()
	let query = supabase.from('dues').select(DUES_SELECT_COLUMNS).eq('status', 'OUTSTANDING')

	if (year !== undefined) {
		query = query.gte('due_month', `${year}-01-01`).lt('due_month', `${year + 1}-01-01`)
	}

	const { data, error } = await query.order('due_month', { ascending: true }).limit(PAYMENT_LIST_LIMIT)

	if (error) {
		logEvent({
			operation: 'dues.listOutstandingAdmin',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parseDuesRecords(data)
}

export const recordAdminPayment = async (input: {
	memberId: string
	amountPence: number
	paymentDate: string
	transactionReference: string
	notes: string | null
	duesIds: string[]
}) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_record_payment', {
		p_member_id: input.memberId,
		p_amount_pence: input.amountPence,
		p_payment_date: input.paymentDate,
		p_transaction_reference: input.transactionReference,
		p_notes: input.notes,
		p_dues_ids: input.duesIds,
	})

	if (error) {
		logClientError('payments.record', error)
		return null
	}

	return typeof data === 'number' ? data : Number(data)
}

export const readPaymentAccountSetting = async (): Promise<StoredPaymentAccount | null> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('app_settings')
		.select('value')
		.eq('key', 'payment_account')
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'settings.readPaymentAccount',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	const parsed = storedPaymentAccountSchema.safeParse(data?.value)
	return parsed.success ? parsed.data : null
}

export const updatePaymentAccountSetting = async (value: PaymentAccount) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_update_payment_account', {
		p_value: value,
	})

	if (error) {
		logEvent({
			operation: 'settings.updatePaymentAccount',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	const parsed = storedPaymentAccountSchema.safeParse(data)
	return parsed.success ? parsed.data : null
}
