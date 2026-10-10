import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { reviewPaymentAction } from '@/server/actions/payment-actions'
import { getAdminPaymentDetail } from '@/server/services/dues-service'
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { Icon } from '@/components/icons'
import { PageHeader } from '@/components/page-header'
import { SectionCard } from '@/components/section-card'
import { DuesStatusBadge, PaymentStatusBadge } from '@/components/status-badge'
import { formatDueMonth } from '@/lib/dates/due-month'
import { formatCalendarDate, memberDisplayName } from '@/lib/members/display'
import { formatPenceAsGbp } from '@/lib/money'
import { evidenceIdSchema } from '@/lib/validation/payment'
import {
	dangerOutlineButtonClass,
	ddClass,
	dtClass,
	labelClass,
	pageContentClass,
	primaryButtonClass,
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

	const memberName = detail.member ? memberDisplayName(detail.member) || detail.member.email : 'Member'
	const canReview = detail.submission.status === 'SUBMITTED'

	return (
		<main className={pageContentClass}>
			<PageHeader
				back={{ href: '/admin/payments', label: 'Payments' }}
				title={`${formatPenceAsGbp(detail.submission.amount_pence)} from ${memberName}`}
				meta={<PaymentStatusBadge status={detail.submission.status} />}
			/>

			<NoticeStack>
				{searchParams.updated === '1' ? (
					<AlertNotice kind="success" title="Review saved">
						The member&apos;s dues now reflect your decision.
					</AlertNotice>
				) : null}
				{searchParams.error ? (
					<AlertNotice kind="danger" title="Review not saved">
						This payment may already have been reviewed. Refresh the page and check its status.
					</AlertNotice>
				) : null}
			</NoticeStack>

			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
				<SectionCard title="Payment details">
					<dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
						<div>
							<dt className={dtClass}>Member</dt>
							<dd className={ddClass}>{memberName}</dd>
							<dd className="text-[0.8125rem] text-slate-500">{detail.member?.email ?? 'Email not available'}</dd>
						</div>
						<div>
							<dt className={dtClass}>Month</dt>
							<dd className={ddClass}>{detail.dues ? formatDueMonth(detail.dues.due_month) : 'Not available'}</dd>
							{detail.dues ? (
								<dd className="mt-1">
									<DuesStatusBadge status={detail.dues.status} />
								</dd>
							) : null}
						</div>
						<div>
							<dt className={dtClass}>Date received</dt>
							<dd className={ddClass}>{formatCalendarDate(detail.submission.payment_date)}</dd>
						</div>
						<div>
							<dt className={dtClass}>Bank reference</dt>
							<dd className={`${ddClass} break-all`}>{detail.submission.transaction_reference}</dd>
						</div>
						<div className="sm:col-span-2">
							<dt className={dtClass}>Note</dt>
							<dd className={`${ddClass} whitespace-pre-wrap font-normal`}>{detail.submission.notes ?? 'None'}</dd>
						</div>
						<div className="sm:col-span-2">
							<dt className={dtClass}>Evidence</dt>
							<dd className="mt-1">
								{detail.evidence.length === 0 ? (
									<span className="text-sm text-slate-500">None attached</span>
								) : (
									<ul className="space-y-1.5">
										{detail.evidence.map((file) => (
											<li key={file.id}>
												<Link
													href={`/payment-evidence/${file.id}`}
													className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy-900 ring-1 ring-inset ring-line hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
												>
													<Icon name="file" className="h-4 w-4 text-slate-500" />
													{file.original_filename}
												</Link>
											</li>
										))}
									</ul>
								)}
							</dd>
						</div>
					</dl>
				</SectionCard>

				{canReview ? (
					<SectionCard title="Review" description="Confirm once you've seen the money arrive in the parish account.">
						<form action={reviewPaymentAction} className="space-y-4">
							<input type="hidden" name="submissionId" value={detail.submission.id} />
							<div>
								<label htmlFor="reviewerNote" className={labelClass}>
									Note <span className="font-normal text-slate-500">(optional)</span>
								</label>
								<textarea id="reviewerNote" name="reviewerNote" maxLength={500} className={textareaClass} />
							</div>
							<div className="flex flex-col gap-2">
								<button type="submit" name="decision" value="CONFIRMED" className={primaryButtonClass}>
									<Icon name="check" className="h-4 w-4" />
									Confirm payment
								</button>
								<button type="submit" name="decision" value="REJECTED" className={dangerOutlineButtonClass}>
									Reject payment
								</button>
							</div>
						</form>
					</SectionCard>
				) : (
					<SectionCard title="Review">
						<p className="flex items-start gap-2 text-sm text-slate-600">
							<Icon name="check" className="mt-0.5 h-4 w-4 text-emerald-600" />
							This payment has already been reviewed.
						</p>
					</SectionCard>
				)}
			</div>
		</main>
	)
}

export default PaymentDetailPage
