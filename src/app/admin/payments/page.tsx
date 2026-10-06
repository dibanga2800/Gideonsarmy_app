import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { recordPaymentAction, savePaymentAccountAction, sendDuesRemindersAction } from '@/server/actions/payment-actions'
import { getAdminPaymentsPage, groupEvidenceBySubmission } from '@/server/services/dues-service'
import { RecordPaymentForm } from '@/components/record-payment-form'
import { AlertNotice } from '@/components/alert-notice'
import { DuesLedger } from '@/components/dues-ledger'
import { LedgerYearNav } from '@/components/ledger-year-nav'
import { ListPagination } from '@/components/list-pagination'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { formatSortCode, paymentSubmissionStatusLabel } from '@/lib/dues/display'
import { formatPenceAsGbp } from '@/lib/money'
import { parsePageParam } from '@/lib/list-pagination'
import { paymentSubmissionFilterSchema } from '@/lib/validation/payment'
import {
	cardClass,
	emptyStateClass,
	eyebrowClass,
	filterActiveClass,
	filterIdleClass,
	helpTextClass,
	inputClass,
	labelClass,
	navLinkClass,
	pageWideClass,
	primaryButtonClass,
	tableWrapClass,
} from '@/lib/ui'
import type { PaymentSubmissionStatus } from '@/types/roles'

export const metadata: Metadata = {
	title: 'Payments',
}

interface PaymentsPageProps {
	searchParams: {
		status?: string
		year?: string
		page?: string
		error?: string
		updated?: string
		reminded?: string
		account?: string
	}
}

const paymentsHref = (year: number, extras: Record<string, string | undefined> = {}) => {
	const params = new URLSearchParams()
	params.set('year', String(year))

	for (const [key, value] of Object.entries(extras)) {
		if (value) {
			params.set(key, value)
		}
	}

	return `/admin/payments?${params.toString()}`
}

const PaymentsPage = async ({ searchParams }: PaymentsPageProps) => {
	const filter = paymentSubmissionFilterSchema.safeParse(searchParams.status ?? 'CONFIRMED')
	const status =
		filter.success && filter.data !== 'all' ? (filter.data as PaymentSubmissionStatus) : undefined
	const page = await getAdminPaymentsPage(
		status,
		searchParams.year,
		parsePageParam(searchParams.page),
	)

	if (!page) {
		redirect('/dashboard')
	}

	const evidenceBySubmission = groupEvidenceBySubmission(page.evidence)
	const statusParam = searchParams.status ?? 'CONFIRMED'

	return (
		<main className={pageWideClass}>
			<PageHeader
				eyebrow="Administration"
				title="Payments"
				lead="£10 each month, £120 for a full year from January 2026. Record one month or select all outstanding months for a full-year payment. Outstanding is for this year only; unpaid months in an earlier year stay on that year."
				leadWide
			/>

			{searchParams.updated === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						The payment has been recorded against the selected months.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.reminded === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Reminders queued">
						Outstanding-dues reminders have been queued.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.account === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						Payment instructions have been saved.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error === 'invalid' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Check the details">
						Check the amount, date, reference, and selected months.
					</AlertNotice>
				</div>
			) : searchParams.error === 'save' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save">
						The payment could not be saved. Apply{' '}
						<code>supabase/migrations/0010_repair_dues_writes.sql</code> in the
						Supabase SQL editor, then refresh this page and record the months
						again.
					</AlertNotice>
				</div>
			) : searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not update">
						That payment update could not be completed.
					</AlertNotice>
				</div>
			) : null}

			<section className={`${cardClass} mt-8`}>
				<p className={eyebrowClass}>{page.year} ledger</p>
				<LedgerYearNav
					years={page.years}
					selectedYear={page.year}
					hrefForYear={(year) => paymentsHref(year, { status: searchParams.status })}
				/>
				<p className="mt-3 text-sm leading-6 text-navy-800/80">
					{page.fellowship.owingMembers} of {page.fellowship.memberCount}{' '}
					active members owing in {page.year} ·{' '}
					{formatPenceAsGbp(page.fellowship.owingPence)} outstanding this year ·{' '}
					{formatPenceAsGbp(page.fellowship.paidPence)} recorded this year.
					Months after the current month are not yet due.
				</p>
				{page.ledgerRows.some(({ ledger }) =>
					ledger.cells.some((cell) => cell.state === 'missing'),
				) ? (
					<div className="mt-4">
						<AlertNotice kind="danger" title="Missing months">
							Some months still show a dash because dues rows were not created.
							Apply <code>0010_repair_dues_writes.sql</code> in the SQL editor,
							then refresh so January to this month can be ticked.
						</AlertNotice>
					</div>
				) : null}
				<DuesLedger
					action={recordPaymentAction}
					year={page.year}
					rows={page.ledgerRows}
				/>
				<form action={sendDuesRemindersAction} className="mt-6">
					<input type="hidden" name="ledgerYear" value={String(page.year)} />
					<PendingSubmitButton className={primaryButtonClass} pendingLabel="Queuing…">
						Send payment reminders
					</PendingSubmitButton>
					<p className={`${helpTextClass} mt-2`}>
						Reminders go only to members with outstanding months in the current
						year. Earlier years are not added to that total. The system also
						emails them on the last day of each month, Europe/London.
					</p>
				</form>
			</section>

			<section className={`${cardClass} mt-8`}>
				<p className={eyebrowClass}>Record a bank transfer</p>
				<p className="mt-3 text-sm leading-6 text-navy-800/80">
					Use this when a new transfer arrives for {page.year}. Select all
					outstanding months to record a full-year payment, or tick individual
					months. The amount must equal the selected months exactly.
				</p>
				<RecordPaymentForm
					action={recordPaymentAction}
					members={page.activeMembers}
					outstandingDues={page.outstandingDues}
					ledgerYear={page.year}
				/>
			</section>

			<section className={`${cardClass} mt-8`}>
				<p className={eyebrowClass}>Bank details</p>
				<p className="mt-3 text-sm leading-6 text-navy-800/80">
					These details are shown to approved members only. They are not stored
					in the application source.
				</p>
				<form action={savePaymentAccountAction} className="mt-6 grid gap-5 sm:grid-cols-2">
					<input type="hidden" name="ledgerYear" value={String(page.year)} />
					<div className="sm:col-span-2">
						<label htmlFor="accountName" className={labelClass}>
							Account name
						</label>
						<input
							id="accountName"
							name="accountName"
							type="text"
							required
							maxLength={80}
							defaultValue={page.paymentAccount?.accountName ?? ''}
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="sortCode" className={labelClass}>
							Sort code
						</label>
						<input
							id="sortCode"
							name="sortCode"
							type="text"
							inputMode="numeric"
							required
							defaultValue={
								page.paymentAccount?.sortCode
									? formatSortCode(page.paymentAccount.sortCode)
									: ''
							}
							className={inputClass}
						/>
						<p className={helpTextClass}>Six digits, with or without hyphens.</p>
					</div>
					<div>
						<label htmlFor="accountNumber" className={labelClass}>
							Account number
						</label>
						<input
							id="accountNumber"
							name="accountNumber"
							type="text"
							inputMode="numeric"
							required
							defaultValue={page.paymentAccount?.accountNumber ?? ''}
							className={inputClass}
						/>
					</div>
					<div className="sm:col-span-2">
						<label htmlFor="referenceNote" className={labelClass}>
							Reference note
						</label>
						<input
							id="referenceNote"
							name="referenceNote"
							type="text"
							maxLength={200}
							defaultValue={page.paymentAccount?.referenceNote ?? ''}
							className={inputClass}
						/>
					</div>
					<div className="sm:col-span-2">
						<PendingSubmitButton className={primaryButtonClass} pendingLabel="Saving…">
							Save payment instructions
						</PendingSubmitButton>
					</div>
				</form>
			</section>

			<nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter payments">
				<FilterLink href={paymentsHref(page.year, { status: 'SUBMITTED' })} active={status === 'SUBMITTED'}>
					Submitted
				</FilterLink>
				<FilterLink href={paymentsHref(page.year, { status: 'CONFIRMED' })} active={status === 'CONFIRMED'}>
					Confirmed
				</FilterLink>
				<FilterLink href={paymentsHref(page.year, { status: 'REJECTED' })} active={status === 'REJECTED'}>
					Rejected
				</FilterLink>
				<FilterLink href={paymentsHref(page.year, { status: 'all' })} active={!status}>
					All
				</FilterLink>
			</nav>

			{page.submissions.length === 0 ? (
				<p className={emptyStateClass}>No payment submissions match this filter.</p>
			) : (
				<div className={tableWrapClass}>
					<table className="min-w-full text-left text-sm">
						<caption className="sr-only">Payment submissions</caption>
						<thead className="border-b border-cream-200 bg-cream-50">
							<tr>
								<th scope="col" className="px-4 py-3 font-medium text-navy-800">
									Member
								</th>
								<th scope="col" className="px-4 py-3 font-medium text-navy-800">
									Amount
								</th>
								<th scope="col" className="px-4 py-3 font-medium text-navy-800">
									Date
								</th>
								<th scope="col" className="px-4 py-3 font-medium text-navy-800">
									Status
								</th>
								<th scope="col" className="px-4 py-3 font-medium text-navy-800">
									Evidence
								</th>
							</tr>
						</thead>
						<tbody>
							{page.submissions.map((submission) => {
								const member = page.membersById.get(submission.member_id)
								const files = evidenceBySubmission.get(submission.id) ?? []
								return (
									<tr key={submission.id} className="border-b border-cream-100 last:border-0">
										<td className="px-4 py-3">
											<Link href={`/admin/payments/${submission.id}`} className={navLinkClass}>
												{member
													? `${member.first_name} ${member.last_name}`
													: 'Member'}
											</Link>
										</td>
										<td className="px-4 py-3 text-navy-800">
											{formatPenceAsGbp(submission.amount_pence)}
										</td>
										<td className="px-4 py-3 text-navy-800">{submission.payment_date}</td>
										<td className="px-4 py-3 text-navy-800">
											{paymentSubmissionStatusLabel(submission.status)}
										</td>
										<td className="px-4 py-3 text-navy-800">
											{files.length > 0 ? 'Attached' : 'None'}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
					<ListPagination
						page={page.submissionPage.page}
						totalPages={page.submissionPage.totalPages}
						total={page.submissionPage.total}
						pageSize={page.submissionPage.pageSize}
						hrefForPage={(nextPage) =>
							paymentsHref(page.year, {
								status: statusParam,
								page: nextPage > 1 ? String(nextPage) : undefined,
							})
						}
						label="Payment submission pages"
					/>
				</div>
			)}
		</main>
	)
}

const FilterLink = ({
	href,
	active,
	children,
}: {
	href: string
	active: boolean
	children: string
}) => {
	return (
		<Link
			href={href}
			className={active ? filterActiveClass : filterIdleClass}
			aria-current={active ? 'page' : undefined}
		>
			{children}
		</Link>
	)
}

export default PaymentsPage
