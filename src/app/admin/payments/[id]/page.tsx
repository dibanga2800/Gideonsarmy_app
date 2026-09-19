import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { reviewPaymentAction } from '@/server/actions/payment-actions'
import { getAdminPaymentDetail } from '@/server/services/dues-service'
import { AlertNotice } from '@/components/alert-notice'
import { formatDueMonth } from '@/lib/dates/due-month'
import { duesStatusLabel, paymentSubmissionStatusLabel } from '@/lib/dues/display'
import { formatPenceAsGbp } from '@/lib/money'
import { evidenceIdSchema } from '@/lib/validation/payment'
import {
	cardClass,
	ddClass,
	dtClass,
	eyebrowClass,
	labelClass,
	navLinkClass,
	pageLeadClass,
	pageNarrowClass,
	pageTitleClass,
	primaryButtonClass,
	secondaryButtonClass,
	textareaClass,
} from '@/lib/ui'

interface PaymentDetailPageProps {
	params: { id: string }
	searchParams: {
		updated?: string
		error?: string
	}
}

export const generateMetadata = async (): Promise<Metadata> => {
	return { title: 'Payment review' }
}

const PaymentDetailPage = async ({ params, searchParams }: PaymentDetailPageProps) => {
	const parsedId = evidenceIdSchema.safeParse(params.id)
	if (!parsedId.success) {
		notFound()
	}

	const detail = await getAdminPaymentDetail(parsedId.data)

	if (!detail) {
		redirect('/admin/payments')
	}

	const memberName = detail.member
		? `${detail.member.first_name} ${detail.member.last_name}`
		: 'Member'
	const canReview = detail.submission.status === 'SUBMITTED'

	return (
		<main className={pageNarrowClass}>
			<p className="mb-6">
				<Link href="/admin/payments" className={navLinkClass}>
					Back to payments
				</Link>
			</p>
			<p className={eyebrowClass}>Payment submission</p>
			<h1 className={`${pageTitleClass} mt-3`}>{memberName}</h1>
			<p className={pageLeadClass}>
				{formatPenceAsGbp(detail.submission.amount_pence)} ·{' '}
				{paymentSubmissionStatusLabel(detail.submission.status)}
			</p>

			{searchParams.updated === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						The payment review has been saved.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save">
						That review could not be saved. Check that the payment is still waiting
						for confirmation.
					</AlertNotice>
				</div>
			) : null}

			<dl className={`${cardClass} mt-8 grid gap-4 text-sm`}>
				<div>
					<dt className={dtClass}>Email</dt>
					<dd className={ddClass}>{detail.member?.email ?? 'Not available'}</dd>
				</div>
				<div>
					<dt className={dtClass}>Month</dt>
					<dd className={ddClass}>
						{detail.dues ? formatDueMonth(detail.dues.due_month) : 'Not available'}
					</dd>
				</div>
				<div>
					<dt className={dtClass}>Dues status</dt>
					<dd className={ddClass}>
						{detail.dues ? duesStatusLabel(detail.dues.status) : 'Not available'}
					</dd>
				</div>
				<div>
					<dt className={dtClass}>Payment date</dt>
					<dd className={ddClass}>{detail.submission.payment_date}</dd>
				</div>
				<div>
					<dt className={dtClass}>Transaction reference</dt>
					<dd className={ddClass}>{detail.submission.transaction_reference}</dd>
				</div>
				<div>
					<dt className={dtClass}>Note</dt>
					<dd className={ddClass}>{detail.submission.notes ?? 'None'}</dd>
				</div>
				<div>
					<dt className={dtClass}>Evidence</dt>
					<dd className={ddClass}>
						{detail.evidence.length === 0
							? 'None'
							: detail.evidence.map((file) => (
									<Link
										key={file.id}
										href={`/payment-evidence/${file.id}`}
										className={navLinkClass}
									>
										{file.original_filename}
									</Link>
								))}
					</dd>
				</div>
			</dl>

			{canReview ? (
				<form action={reviewPaymentAction} className={`${cardClass} mt-8 space-y-5`}>
					<input type="hidden" name="submissionId" value={detail.submission.id} />
					<div>
						<label htmlFor="reviewerNote" className={labelClass}>
							Reviewer note
						</label>
						<textarea
							id="reviewerNote"
							name="reviewerNote"
							maxLength={500}
							className={textareaClass}
						/>
					</div>
					<div className="flex flex-wrap gap-3">
						<button
							type="submit"
							name="decision"
							value="CONFIRMED"
							className={primaryButtonClass}
						>
							Confirm payment
						</button>
						<button
							type="submit"
							name="decision"
							value="REJECTED"
							className={secondaryButtonClass}
						>
							Reject
						</button>
					</div>
				</form>
			) : (
				<p className={`${cardClass} mt-8 text-navy-800`}>
					This submission has already been reviewed.
				</p>
			)}
		</main>
	)
}

export default PaymentDetailPage
