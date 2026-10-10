import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOwnDuesPage, groupEvidenceBySubmission } from '@/server/services/dues-service'
import { formatDueMonth } from '@/lib/dates/due-month'
import { formatCalendarDate } from '@/lib/members/display'
import { formatSortCode } from '@/lib/dues/display'
import { formatPenceAsGbp } from '@/lib/money'
import {
	navLinkClass,
	pageMainClass,
	tableClass,
	tdClass,
	thClass,
	theadClass,
	trClass,
} from '@/lib/ui'
import { CopyValue } from '@/components/copy-value'
import { DuesMonthStrip } from '@/components/dues-month-strip'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { LedgerYearNav } from '@/components/ledger-year-nav'
import { PageHeader } from '@/components/page-header'
import { SectionCard } from '@/components/section-card'
import { ComplianceBadge, DuesStatusBadge, PaymentStatusBadge } from '@/components/status-badge'

export const metadata: Metadata = {
	title: 'Dues',
}

interface DuesPageProps {
	searchParams: {
		year?: string
	}
}

const Figure = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
	<div>
		<dt className="text-[0.8125rem] text-slate-500">{label}</dt>
		<dd className={`mt-0.5 text-lg font-semibold ${emphasis ? 'text-amber-800' : 'text-navy-950'}`}>{value}</dd>
	</div>
)

const DuesPage = async ({ searchParams }: DuesPageProps) => {
	const page = await getOwnDuesPage(searchParams.year)

	if (!page) {
		redirect('/login')
	}

	const evidenceBySubmission = groupEvidenceBySubmission(page.evidence)
	const months = [...page.dues].sort((left, right) => left.due_month.localeCompare(right.due_month))
	const ledger = page.yearLedger

	return (
		<main className={pageMainClass}>
			<PageHeader
				title="Dues"
				description="£10 a month, or £120 for the full year. Pay by bank transfer; an administrator records the payment once it reaches the parish account."
				actions={
					<LedgerYearNav years={page.years} selectedYear={page.year} hrefForYear={(year) => `/dues?year=${year}`} />
				}
			/>

			<div className="grid gap-5 lg:grid-cols-3">
				<SectionCard title={`${page.year} at a glance`} className="lg:col-span-2">
					<div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
						<p className="text-3xl font-semibold tracking-tight text-navy-950">
							{ledger.isUpToDate ? 'All paid to date' : `${formatPenceAsGbp(ledger.owingPence)} to pay`}
						</p>
						<ComplianceBadge isUpToDate={ledger.isUpToDate} />
					</div>
					<div className="mt-5">
						<DuesMonthStrip cells={ledger.cells} year={page.year} />
					</div>
					<dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
						<Figure label="Due so far" value={formatPenceAsGbp(ledger.dueToDatePence)} />
						<Figure label="Recorded" value={formatPenceAsGbp(ledger.paidPence)} />
						<Figure
							label={ledger.owingMonths === 1 ? '1 month to pay' : `${ledger.owingMonths} months to pay`}
							value={formatPenceAsGbp(ledger.owingPence)}
							emphasis={!ledger.isUpToDate}
						/>
					</dl>
					<p className="mt-4 text-[0.8125rem] leading-5 text-slate-500">
						Full year {formatPenceAsGbp(ledger.annualPence)}. Unpaid months stay on the year they belong to and
						aren&apos;t carried into the next.
					</p>
					{page.owingYears.length > 0 ? (
						<p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
							<Icon name="alert" className="mt-0.5 h-4 w-4 text-amber-600" />
							<span>
								You also have unpaid months in{' '}
								{page.owingYears.map((year, index) => (
									<span key={year}>
										{index > 0 ? ', ' : null}
										<Link href={`/dues?year=${year}`} className="font-semibold underline underline-offset-2">
											{year}
										</Link>
									</span>
								))}
								.
							</span>
						</p>
					) : null}
				</SectionCard>

				<SectionCard
					title="Pay by bank transfer"
					description="Use your name as the reference unless the note below says otherwise."
				>
					{page.paymentAccount ? (
						<div className="space-y-2">
							<CopyValue label="Account name" value={page.paymentAccount.accountName} />
							<CopyValue
								label="Sort code"
								value={formatSortCode(page.paymentAccount.sortCode)}
								copyText={page.paymentAccount.sortCode}
							/>
							<CopyValue label="Account number" value={page.paymentAccount.accountNumber} />
							{page.paymentAccount.referenceNote ? (
								<p className="pt-2 text-sm leading-6 text-slate-600">
									<span className="font-semibold text-navy-900">Reference: </span>
									{page.paymentAccount.referenceNote}
								</p>
							) : null}
						</div>
					) : (
						<EmptyState icon="wallet" title="Bank details not published yet" compact>
							Speak to a fellowship administrator before sending a payment.
						</EmptyState>
					)}
				</SectionCard>
			</div>

			<div className="mt-5 grid gap-5 xl:grid-cols-2">
				<SectionCard title={`Month by month, ${page.year}`} flush>
					{months.length === 0 ? (
						<EmptyState icon="calendar" title="No months set up yet" compact>
							Months appear here as they fall due.
						</EmptyState>
					) : (
						<div className="overflow-x-auto">
							<table className={tableClass}>
								<caption className="sr-only">Monthly dues for {page.year}</caption>
								<thead className={theadClass}>
									<tr>
										<th scope="col" className={thClass}>Month</th>
										<th scope="col" className={`${thClass} text-right`}>Due</th>
										<th scope="col" className={`${thClass} text-right`}>Paid</th>
										<th scope="col" className={thClass}>Status</th>
									</tr>
								</thead>
								<tbody>
									{months.map((row) => (
										<tr key={row.id} className={trClass}>
											<td className={`${tdClass} font-medium`}>{formatDueMonth(row.due_month)}</td>
											<td className={`${tdClass} text-right`}>{formatPenceAsGbp(row.amount_due_pence)}</td>
											<td className={`${tdClass} text-right`}>{formatPenceAsGbp(row.amount_paid_pence)}</td>
											<td className={tdClass}>
												<DuesStatusBadge status={row.status} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</SectionCard>

				<SectionCard title="Payments recorded" flush>
					{page.submissions.length === 0 ? (
						<EmptyState icon="receipt" title="No payments recorded yet" compact>
							Once an administrator records your transfer, it shows here.
						</EmptyState>
					) : (
						<ul className="divide-y divide-cream-100">
							{page.submissions.map((submission) => {
								const files = evidenceBySubmission.get(submission.id) ?? []
								return (
									<li key={submission.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:px-6">
										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-navy-950">
												{formatPenceAsGbp(submission.amount_pence)}
											</p>
											<p className="truncate text-[0.8125rem] text-slate-500">
												{formatCalendarDate(submission.payment_date)}, ref {submission.transaction_reference}
											</p>
										</div>
										{files.map((file) => (
											<Link key={file.id} href={`/payment-evidence/${file.id}`} className={`${navLinkClass} text-sm`}>
												Evidence
											</Link>
										))}
										<PaymentStatusBadge status={submission.status} />
									</li>
								)
							})}
						</ul>
					)}
				</SectionCard>
			</div>
		</main>
	)
}

export default DuesPage
