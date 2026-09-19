'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
	adminPaymentReviewSchema,
	adminRecordPaymentSchema,
	adminWaiveDuesSchema,
	paymentAccountSchema,
} from '@/lib/validation/payment'
import {
	recordAllocatedPayment,
	reviewPayment,
	savePaymentAccount,
	sendOutstandingDuesReminders,
	waiveOutstandingDues,
} from '@/server/services/dues-service'

const formValue = (formData: FormData, key: string) => {
	const value = formData.get(key)
	return typeof value === 'string' ? value : ''
}

const paymentsPath = (formData: FormData, params: Record<string, string>) => {
	const search = new URLSearchParams(params)
	const year = formValue(formData, 'ledgerYear')

	if (/^\d{4}$/.test(year)) {
		search.set('year', year)
	}

	return `/admin/payments?${search.toString()}`
}

export const recordPaymentAction = async (formData: FormData) => {
	const memberId = formValue(formData, 'memberId')
	const parsed = adminRecordPaymentSchema.safeParse({
		memberId,
		duesIds: formData.getAll('duesIds').filter((value): value is string => typeof value === 'string'),
		amountPounds: formValue(formData, 'amountPounds'),
		paymentDate: formValue(formData, 'paymentDate'),
		transactionReference: formValue(formData, 'transactionReference'),
		notes: formValue(formData, 'notes'),
	})

	if (!parsed.success) {
		redirect(memberId ? `/admin/members/${memberId}?error=dues` : paymentsPath(formData, { error: 'invalid' }))
	}

	const result = await recordAllocatedPayment(parsed.data)

	if (!result.ok) {
		redirect(
			formValue(formData, 'source') === 'member'
				? `/admin/members/${parsed.data.memberId}?error=dues`
				: paymentsPath(formData, { error: 'save' }),
		)
	}

	revalidatePath('/admin/payments')
	revalidatePath('/dues')
	revalidatePath('/dashboard')
	revalidatePath(`/admin/members/${parsed.data.memberId}`)

	if (formValue(formData, 'source') === 'member') {
		redirect(`/admin/members/${parsed.data.memberId}?updated=1`)
	}

	redirect(paymentsPath(formData, { updated: '1' }))
}

export const reviewPaymentAction = async (formData: FormData) => {
	const parsed = adminPaymentReviewSchema.safeParse({
		submissionId: formValue(formData, 'submissionId'),
		decision: formValue(formData, 'decision'),
		reviewerNote: formValue(formData, 'reviewerNote'),
	})

	if (!parsed.success) {
		redirect('/admin/payments?error=invalid')
	}

	const result = await reviewPayment({
		submissionId: parsed.data.submissionId,
		decision: parsed.data.decision,
		reviewerNote: parsed.data.reviewerNote,
	})

	if (!result.ok) {
		redirect(`/admin/payments/${parsed.data.submissionId}?error=save`)
	}

	revalidatePath('/admin/payments')
	revalidatePath(`/admin/payments/${parsed.data.submissionId}`)
	revalidatePath('/dues')
	redirect(`/admin/payments/${parsed.data.submissionId}?updated=1`)
}

export const waiveDuesAction = async (formData: FormData) => {
	const parsed = adminWaiveDuesSchema.safeParse({
		duesId: formValue(formData, 'duesId'),
	})
	const memberId = formValue(formData, 'memberId')

	if (!parsed.success) {
		redirect('/admin/members?error=invalid')
	}

	const result = await waiveOutstandingDues(parsed.data.duesId)

	if (!result.ok) {
		redirect(memberId ? `/admin/members/${memberId}?error=dues` : paymentsPath(formData, { error: 'save' }))
	}

	revalidatePath('/admin/payments')
	if (memberId) {
		revalidatePath(`/admin/members/${memberId}`)
		redirect(`/admin/members/${memberId}?updated=1`)
	}

	redirect(paymentsPath(formData, { updated: '1' }))
}

export const savePaymentAccountAction = async (formData: FormData) => {
	const parsed = paymentAccountSchema.safeParse({
		accountName: formValue(formData, 'accountName'),
		sortCode: formValue(formData, 'sortCode').replace(/\D/g, ''),
		accountNumber: formValue(formData, 'accountNumber').replace(/\D/g, ''),
		referenceNote: formValue(formData, 'referenceNote'),
	})

	if (!parsed.success) {
		redirect(paymentsPath(formData, { error: 'account' }))
	}

	const result = await savePaymentAccount(parsed.data)

	if (!result.ok) {
		redirect(paymentsPath(formData, { error: 'account' }))
	}

	revalidatePath('/admin/payments')
	revalidatePath('/dues')
	redirect(paymentsPath(formData, { account: '1' }))
}

export const sendDuesRemindersAction = async (formData: FormData) => {
	const result = await sendOutstandingDuesReminders()

	if (!result.ok) {
		redirect(paymentsPath(formData, { error: 'remind' }))
	}

	revalidatePath('/admin/payments')
	redirect(paymentsPath(formData, { reminded: '1' }))
}
