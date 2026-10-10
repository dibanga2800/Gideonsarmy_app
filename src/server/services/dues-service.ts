import { canAccessAdmin, canAccessMemberApp } from '@/lib/auth/access'
import { getCurrentDueMonth } from '@/lib/dates/due-month'
import {
	duesStartMonthFromJoinedAt,
	filterDuesForYear,
	getLedgerYear,
	listLedgerYears,
	parseRequestedLedgerYear,
} from '@/lib/dates/dues-year'
import { buildMemberYearLedger, summariseFellowshipLedger } from '@/lib/dues/ledger'
import { logEvent } from '@/lib/logging'
import { addPence, DEFAULT_MONTHLY_DUES_PENCE } from '@/lib/money'
import { listOwingLedgerYears, summariseDuesCompliance } from '@/lib/dues/compliance'
import { canAdminAllocateDues, canAdminReviewSubmission, canAdminWaiveDues } from '@/lib/dues/transitions'
import type { AdminRecordPaymentInput, PaymentAccount } from '@/lib/validation/payment'
import type { PaymentSubmissionStatus } from '@/types/roles'
import type { PaymentEvidence } from '@/types/database'
import { getCurrentSession } from '@/server/services/auth-service'
import { findProfileById, findProfilesByIds, listProfiles } from '@/server/repositories/profile-repository'
import {
	adminEnsureDuesRange,
	createPaymentEvidenceSignedUrl,
	ensureOwnCurrentMonthDues,
	findDuesById,
	findPaymentEvidenceById,
	findPaymentSubmissionById,
	listAdminPaymentSubmissionsPage,
	listDuesForYear,
	listEvidenceForSubmissions,
	listMemberDuesForAdmin,
	listOutstandingDuesForAdmin,
	listOwnDues,
	listOwnSubmissions,
	readPaymentAccountSetting,
	recordAdminPayment,
	reviewPaymentRecord,
	updatePaymentAccountSetting,
	waiveDuesRecord,
} from '@/server/repositories/dues-repository'

export type DuesActionResult =
	| { ok: true }
	| { ok: false; message: string }

const safeFailure = (message: string): DuesActionResult => ({
	ok: false,
	message,
})

export const getPublishedPaymentAccount = async () => {
	const account = await readPaymentAccountSetting()

	if (!account || account.accountName.trim() === '' || account.sortCode.length !== 6 || account.accountNumber.length !== 8) {
		return null
	}

	return account
}

export const getOwnDuesPage = async (requestedYear?: string) => {
	const session = await getCurrentSession()

	if (!canAccessMemberApp(session.access) || !session.userId) {
		return null
	}

	await ensureOwnCurrentMonthDues()
	const dues = await listOwnDues(session.userId)
	const submissions = await listOwnSubmissions(session.userId)
	const [evidence, paymentAccount] = await Promise.all([
		listEvidenceForSubmissions(submissions.map((row) => row.id)),
		getPublishedPaymentAccount(),
	])

	const year = parseRequestedLedgerYear(requestedYear)
	const yearLedger = buildMemberYearLedger(
		dues,
		year,
		new Date(),
		DEFAULT_MONTHLY_DUES_PENCE,
		duesStartMonthFromJoinedAt(session.profile?.joined_at ?? null),
	)
	const yearDues = filterDuesForYear(dues, year)

	return {
		dues: yearDues,
		submissions,
		evidence,
		paymentAccount,
		compliance: summariseDuesCompliance(dues, year),
		year,
		years: listLedgerYears(),
		owingYears: listOwingLedgerYears(dues).filter((owingYear) => owingYear !== year),
		yearLedger,
	}
}

export const getOwnCurrentDues = async () => {
	const session = await getCurrentSession()

	if (!canAccessMemberApp(session.access) || !session.userId) {
		return null
	}

	await ensureOwnCurrentMonthDues()
	const dues = await listOwnDues(session.userId)
	const year = getLedgerYear()
	const currentMonth = getCurrentDueMonth()

	return {
		current: dues.find((row) => row.due_month === currentMonth) ?? null,
		compliance: summariseDuesCompliance(dues, year),
		yearLedger: buildMemberYearLedger(
			dues,
			year,
			new Date(),
			DEFAULT_MONTHLY_DUES_PENCE,
			duesStartMonthFromJoinedAt(session.profile?.joined_at ?? null),
		),
		year,
		owingYears: listOwingLedgerYears(dues).filter((owingYear) => owingYear !== year),
	}
}

export const recordAllocatedPayment = async (
	input: AdminRecordPaymentInput,
): Promise<DuesActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'payments.record',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to record payments.')
	}

	const uniqueIds = [...new Set(input.duesIds)]
	const duesRows = await Promise.all(uniqueIds.map((id) => findDuesById(id)))

	if (duesRows.some((row) => row === null)) {
		return safeFailure('One of the selected months could not be found.')
	}

	const months = duesRows.flatMap((row) => (row ? [row] : []))

	if (months.some((row) => row.member_id !== input.memberId || !canAdminAllocateDues(row.status))) {
		return safeFailure('Only outstanding months for the selected member can be allocated.')
	}

	const expectedTotal = addPence(...months.map((row) => row.amount_due_pence))

	if (expectedTotal !== input.amountPounds) {
		return safeFailure('The amount must equal the total of the selected months.')
	}

	const allocated = await recordAdminPayment({
		memberId: input.memberId,
		amountPence: input.amountPounds,
		paymentDate: input.paymentDate,
		transactionReference: input.transactionReference,
		notes: input.notes,
		duesIds: uniqueIds,
	})

	if (allocated === null || Number.isNaN(allocated)) {
		return safeFailure('The payment could not be recorded. Check the details and try again.')
	}

	logEvent({
		operation: 'payments.record',
		status: 'ok',
	})

	return { ok: true }
}

export const getAdminPaymentsPage = async (
	status?: PaymentSubmissionStatus,
	requestedYear?: string,
	requestedPage?: number,
) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	const year = parseRequestedLedgerYear(requestedYear)
	await adminEnsureDuesRange()
	const [submissionPage, outstandingDues, members, yearDues] = await Promise.all([
		listAdminPaymentSubmissionsPage({ status, page: requestedPage ?? 1 }),
		listOutstandingDuesForAdmin(year),
		listProfiles('ACTIVE'),
		listDuesForYear(year),
	])
	const submissions = submissionPage.items
	const memberIds = [
		...new Set([
			...submissions.map((row) => row.member_id),
			...outstandingDues.map((row) => row.member_id),
			...yearDues.map((row) => row.member_id),
			...members.map((member) => member.id),
		]),
	]
	const loadedMembers = await findProfilesByIds(memberIds)
	const membersById = new Map(loadedMembers.map((member) => [member.id, member]))
	const evidence = await listEvidenceForSubmissions(submissions.map((row) => row.id))
	const paymentAccount = await readPaymentAccountSetting()
	const ledgerRows = members.map((member) => ({
		member,
		ledger: buildMemberYearLedger(
			yearDues.filter((row) => row.member_id === member.id),
			year,
			new Date(),
			DEFAULT_MONTHLY_DUES_PENCE,
			duesStartMonthFromJoinedAt(member.joined_at),
		),
	}))

	return {
		year,
		years: listLedgerYears(),
		submissions,
		submissionPage,
		membersById,
		activeMembers: members,
		outstandingDues,
		yearDues,
		ledgerRows,
		fellowship: summariseFellowshipLedger(ledgerRows.map((row) => row.ledger)),
		evidence,
		paymentAccount,
	}
}

export const getAdminPaymentDetail = async (submissionId: string) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	const submission = await findPaymentSubmissionById(submissionId)

	if (!submission) {
		return null
	}

	const [member, dues, evidence] = await Promise.all([
		findProfileById(submission.member_id),
		findDuesById(submission.dues_id),
		listEvidenceForSubmissions([submission.id]),
	])

	return {
		submission,
		member,
		dues,
		evidence,
	}
}

export const reviewPayment = async (input: {
	submissionId: string
	decision: 'CONFIRMED' | 'REJECTED'
	reviewerNote: string | null
}): Promise<DuesActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access) || !session.userId) {
		logEvent({
			operation: 'payments.review',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to confirm payments.')
	}

	const submission = await findPaymentSubmissionById(input.submissionId)
	const dues = submission ? await findDuesById(submission.dues_id) : null

	if (!submission || !dues) {
		return safeFailure('That payment could not be found.')
	}

	if (!canAdminReviewSubmission(dues.status, submission.status)) {
		return safeFailure('Only a submitted payment waiting for confirmation can be reviewed.')
	}

	const updated = await reviewPaymentRecord(input)

	if (!updated) {
		return safeFailure('That payment could not be reviewed. Try again.')
	}

	logEvent({
		operation: 'payments.review',
		status: 'ok',
	})

	return { ok: true }
}

export const waiveOutstandingDues = async (duesId: string): Promise<DuesActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'dues.waive',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to waive dues.')
	}

	const dues = await findDuesById(duesId)

	if (!dues) {
		return safeFailure('That dues record could not be found.')
	}

	if (!canAdminWaiveDues(dues.status)) {
		return safeFailure('Only outstanding dues can be waived.')
	}

	const updated = await waiveDuesRecord(duesId)

	if (!updated) {
		return safeFailure('That month could not be waived. Try again.')
	}

	logEvent({
		operation: 'dues.waive',
		status: 'ok',
	})

	return { ok: true }
}

export const getMemberDuesForAdmin = async (memberId: string) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	return listMemberDuesForAdmin(memberId)
}

export const sendOutstandingDuesReminders = async (): Promise<DuesActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'payments.remind',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to send reminders.')
	}

	const { listActiveMembersForJobs } = await import('@/server/repositories/job-repository')
	const { buildDuesReminderNotifications, enqueueAndSend } = await import(
		'@/server/jobs/run-scheduled-jobs'
	)
	const members = await listActiveMembersForJobs()
	const items = await buildDuesReminderNotifications(members, new Date(), true)
	await enqueueAndSend(items)

	logEvent({
		operation: 'payments.remind',
		status: 'ok',
	})

	return { ok: true }
}

export const savePaymentAccount = async (value: PaymentAccount): Promise<DuesActionResult> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'settings.updatePaymentAccount',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to update payment instructions.')
	}

	const updated = await updatePaymentAccountSetting(value)

	if (!updated) {
		return safeFailure('Payment instructions could not be saved.')
	}

	logEvent({
		operation: 'settings.updatePaymentAccount',
		status: 'ok',
	})

	return { ok: true }
}

export const getPaymentEvidenceDownloadUrl = async (evidenceId: string) => {
	const session = await getCurrentSession()

	if (!session.userId || (!canAccessMemberApp(session.access) && !canAccessAdmin(session.access))) {
		return null
	}

	const evidence = await findPaymentEvidenceById(evidenceId)

	if (!evidence) {
		return null
	}

	if (!canAccessAdmin(session.access) && evidence.member_id !== session.userId) {
		logEvent({
			operation: 'payments.signEvidence',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return null
	}

	return createPaymentEvidenceSignedUrl(evidence.storage_path)
}

export const groupEvidenceBySubmission = (evidence: PaymentEvidence[]) => {
	const grouped = new Map<string, PaymentEvidence[]>()

	for (const item of evidence) {
		const current = grouped.get(item.payment_submission_id) ?? []
		current.push(item)
		grouped.set(item.payment_submission_id, current)
	}

	return grouped
}
