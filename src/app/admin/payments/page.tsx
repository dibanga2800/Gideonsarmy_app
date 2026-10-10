import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { recordPaymentAction, savePaymentAccountAction, sendDuesRemindersAction } from '@/server/actions/payment-actions'
import { getAdminPaymentsPage, groupEvidenceBySubmission } from '@/server/services/dues-service'
import { RecordPaymentForm } from '@/components/record-payment-form'
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { DuesLedger } from '@/components/dues-ledger'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { LedgerYearNav } from '@/components/ledger-year-nav'
import { ListPagination } from '@/components/list-pagination'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { SectionCard } from '@/components/section-card'
import { StatTile } from '@/components/stat-tile'
import { PaymentStatusBadge } from '@/components/status-badge'
import { formatSortCode } from '@/lib/dues/display'
import { formatCalendarDate, memberDisplayName } from '@/lib/members/display'
import { formatPenceAsGbp } from '@/lib/money'
import { parsePageParam } from '@/lib/list-pagination'
import { paymentSubmissionFilterSchema } from '@/lib/validation/payment'
import {
	filterActiveClass,
	filterIdleClass,
	ghostButtonClass,
	helpTextClass,
	inputClass,
	labelClass,
	pageWideClass,
	primaryButtonClass,
	secondaryButtonClass,
	smallButtonClass,
	tableClass,
	tdClass,
	thClass,
	theadClass,
	trClass,
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

	const hasMissingMonths = page.ledgerRows.some(({ ledger }) =>
		ledger.cells.some((cell) => cell.state === 'missing'),
	)

	return (
		<main className={pageWideClass}>
			<PageHeader
				title="Payments"
				description="Record bank transfers against the months they cover, and keep the bank details members see up to date. £10 a month, £120 for a full year."
				actions={
					<LedgerYearNav
						years={page.years}
						selectedYear={page.year}
						hrefForYear={(year) => paymentsHref(year, { status: searchParams.status })}
					/>
				}
			/>

			<NoticeStack>
				{searchParams.updated === '1' ? (
					<AlertNotice kind="success" title="Payment recorded">
						The selected months are now marked as paid.
					</AlertNotice>
				) : null}
				{searchParams.reminded === '1' ? (
					<AlertNotice kind="success" title="Reminders sent">
						Members with months to pay this year have been reminded.
					</AlertNotice>
				) : null}
				{searchParams.account === '1' ? (
					<AlertNotice kind="success" title="Bank details saved">
						Members now see the updated payment instructions.
					</AlertNotice>
				) : null}
				{searchParams.error === 'invalid' ? (
					<AlertNotice kind="danger" title="Payment not recorded">
						Check the amount, date, reference and selected months.
					</AlertNotice>
				) : searchParams.error === 'save' ? (
					<AlertNotice kind="danger" title="Payment not recorded">
						The database rejected the change. Apply{' '}
						<code>supabase/migrations/0010_repair_dues_writes.sql</code> in the Supabase SQL editor, refresh
						this page, then record the months again.
					</AlertNotice>
				) : searchParams.error ? (
					<AlertNotice kind="danger" title="Payment not updated">
						That change couldn&apos;t be completed. Try again.
					</AlertNotice>
				) : null}
				{hasMissingMonths ? (
					<AlertNotice kind="danger" title="Some months aren't set up">
						Cells showing a dash have no dues row. Apply <code>0010_repair_dues_writes.sql</code> in the SQL
						editor, then refresh so January to this month can be ticked.
					</AlertNotice>
				) : null}
			</NoticeStack>

			<div className="grid gap-4 sm:grid-cols-3">
				<StatTile
					label={`Members owing in ${page.year}`}
					value={
						<>
							{page.fellowship.owingMembers}
							<span className="text-base font-normal text-slate-500"> of {page.fellowship.memberCount}</span>
						</>
					}
					icon="users"
					tone={page.fellowship.owingMembers > 0 ? 'attention' : 'default'}
				/>
				<StatTile
					label="Outstanding this year"
					value={formatPenceAsGbp(page.fellowship.owingPence)}
					icon="alert"
					detail="Months after this one aren't due yet."
				/>
				<StatTile label="Recorded this year" value={formatPenceAsGbp(page.fellowship.paidPence)} icon="check" />
			</div>

			<SectionCard
				title={`${page.year} ledger`}
				description="Every active member's year. Amber cells are owing; tick them to record a payment."
				className="mt-5"
				flush
				actions={
					<form action={sendDuesRemindersAction}>
						<input type="hidden" name="ledgerYear" value={String(page.year)} />
						<PendingSubmitButton className={secondaryButtonClass} pendingLabel="Sending…">
							<Icon name="mail" className="h-4 w-4" />
							Send reminders
						</PendingSubmitButton>
					</form>
				}
			>
				<DuesLedger action={recordPaymentAction} year={page.year} rows={page.ledgerRows} />
				<p className="border-t border-line px-5 py-3 text-[0.8125rem] leading-5 text-slate-500 sm:px-6">
					Reminders go only to members with months to pay this year. They are also sent automatically on the
					last day of each month.
				</p>
			</SectionCard>

			<div className="mt-5 grid gap-5 lg:grid-cols-2">
				<SectionCard
					title="Record a bank transfer"
					description={`For a transfer that covers months in ${page.year}. The amount must match the months selected.`}
				>
					<RecordPaymentForm
						action={recordPaymentAction}
						members={page.activeMembers}
						outstandingDues={page.outstandingDues}
						ledgerYear={page.year}
					/>
				</SectionCard>

				<SectionCard
					title="Bank details for members"
					description="Shown only to approved members on their Dues page. Stored in the database, never in the app's code."
				>
					<form action={savePaymentAccountAction} className="grid gap-4 sm:grid-cols-2">
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
								aria-describedby="sortCode-help"
								defaultValue={page.paymentAccount?.sortCode ? formatSortCode(page.paymentAccount.sortCode) : ''}
								className={inputClass}
							/>
							<p id="sortCode-help" className={helpTextClass}>
								Six digits, hyphens optional.
							</p>
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
								Reference note <span className="font-normal text-slate-500">(optional)</span>
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
								Save bank details
							</PendingSubmitButton>
						</div>
					</form>
				</SectionCard>
			</div>

			<SectionCard title="Payment history" className="mt-5" flush>
				<nav className="flex flex-wrap gap-1 border-b border-line px-5 py-3 sm:px-6" aria-label="Filter payments">
					<FilterLink href={paymentsHref(page.year, { status: 'SUBMITTED' })} active={status === 'SUBMITTED'}>
						Awaiting review
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
					<EmptyState icon="receipt" title="No payments in this view" compact>
						Try another filter.
					</EmptyState>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className={tableClass}>
								<caption className="sr-only">Payment submissions</caption>
								<thead className={theadClass}>
									<tr>
										<th scope="col" className={thClass}>Member</th>
										<th scope="col" className={`${thClass} text-right`}>Amount</th>
										<th scope="col" className={thClass}>Received</th>
										<th scope="col" className={thClass}>Status</th>
										<th scope="col" className={thClass}>Evidence</th>
										<th scope="col" className={thClass}>
											<span className="sr-only">Open</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{page.submissions.map((submission) => {
										const member = page.membersById.get(submission.member_id)
										const files = evidenceBySubmission.get(submission.id) ?? []
										const name = member ? memberDisplayName(member) : 'Member'
										return (
											<tr key={submission.id} className={`${trClass} hover:bg-cream-50`}>
												<td className={`${tdClass} font-medium`}>{name}</td>
												<td className={`${tdClass} text-right font-semibold`}>
													{formatPenceAsGbp(submission.amount_pence)}
												</td>
												<td className={`${tdClass} whitespace-nowrap text-slate-600`}>
													{formatCalendarDate(submission.payment_date)}
												</td>
												<td className={tdClass}>
													<PaymentStatusBadge status={submission.status} />
												</td>
												<td className={`${tdClass} text-slate-600`}>
													{files.length > 0 ? (
														<span className="inline-flex items-center gap-1">
															<Icon name="file" className="h-4 w-4" />
															Attached
														</span>
													) : (
														<span className="text-slate-500">None</span>
													)}
												</td>
												<td className={`${tdClass} text-right`}>
													<Link
														href={`/admin/payments/${submission.id}`}
														className={`${ghostButtonClass} ${smallButtonClass}`}
														aria-label={`Open payment from ${name}`}
													>
														{submission.status === 'SUBMITTED' ? 'Review' : 'Open'}
														<Icon name="arrow-right" className="h-4 w-4" />
													</Link>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
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
							label="Payment history pages"
						/>
					</>
				)}
			</SectionCard>
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
