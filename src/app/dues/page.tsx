import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOwnDuesPage, groupEvidenceBySubmission } from '@/server/services/dues-service'
import { formatDueMonth } from '@/lib/dates/due-month'
import { LedgerYearNav } from '@/components/ledger-year-nav'
import {
	duesComplianceLabel,
	duesStatusLabel,
	formatSortCode,
	paymentSubmissionStatusLabel,
} from '@/lib/dues/display'
import { formatPenceAsGbp, DEFAULT_MONTHLY_DUES_PENCE } from '@/lib/money'
import {
	cardClass,
	ddClass,
	dtClass,
	emptyStateClass,
	eyebrowClass,
	navLinkClass,
	pageMainClass,
	tableWrapClass,
} from '@/lib/ui'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
	title: 'Dues',
}

interface DuesPageProps {
	searchParams: {
		year?: string
	}
}

const DuesPage = async ({ searchParams }: DuesPageProps) => {
	const page = await getOwnDuesPage(searchParams.year)

	if (!page) {
		redirect('/login')
	}

	const evidenceBySubmission = groupEvidenceBySubmission(page.evidence)
	const months = [...page.dues].sort((left, right) =>
		left.due_month.localeCompare(right.due_month),
	)
	const outstandingMonths = page.yearLedger.cells.filter(
		(cell) => cell.state === 'owing' || cell.state === 'missing',
	)

	return (
		<main className={pageMainClass}>
			<PageHeader
				eyebrow="Stewardship"
				title="Monthly dues"
				lead="£10 each month, £120 for a full year from January 2026. You can pay the remaining year in one bank transfer. Unpaid months stay on that year; they are not added to a later year. An administrator records the payment after it has arrived."
			/>
			<LedgerYearNav
				years={page.years}
				selectedYear={page.year}
				hrefForYear={(year) => `/dues?year=${year}`}
			/>

			<section className={`${cardClass} mt-8`}>
				<p className={eyebrowClass}>Outstanding for {page.year}</p>
				<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
					{duesComplianceLabel(page.yearLedger.isUpToDate)}
				</h2>
				{page.owingYears.length > 0 ? (
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						Unpaid months from{' '}
						{page.owingYears.map((year, index) => (
							<span key={year}>
								{index > 0 ? ', ' : null}
								<Link href={`/dues?year=${year}`} className={navLinkClass}>
									{year}
								</Link>
							</span>
						))}{' '}
						stay on those years and are not included in this total.
					</p>
				) : null}
				{page.yearLedger.isUpToDate ? (
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						You are up to date through the months due so far in {page.year} (
						{formatPenceAsGbp(page.yearLedger.dueToDatePence)} of{' '}
						{formatPenceAsGbp(page.yearLedger.annualPence)} annual).
					</p>
				) : (
					<>
						<p className="mt-2 text-sm leading-6 text-navy-800/80">
							{page.yearLedger.owingMonths === 1
								? '1 month still to pay'
								: `${page.yearLedger.owingMonths} months still to pay`}{' '}
							in {page.year} · {formatPenceAsGbp(page.yearLedger.owingPence)}{' '}
							outstanding. Annual dues for {page.year} are{' '}
							{formatPenceAsGbp(page.yearLedger.annualPence)};{' '}
							{formatPenceAsGbp(page.yearLedger.paidPence)} has been recorded.
						</p>
						<ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-navy-900">
							{outstandingMonths.map((cell) => (
								<li key={cell.month}>
									{formatDueMonth(cell.month)} ·{' '}
									{formatPenceAsGbp(
										cell.dues
											? cell.dues.amount_due_pence - cell.dues.amount_paid_pence
											: DEFAULT_MONTHLY_DUES_PENCE,
									)}
								</li>
							))}
						</ul>
					</>
				)}
			</section>

			<section className={`${cardClass} mt-8`}>
				<p className={eyebrowClass}>Pay dues</p>
				<p className="mt-3 text-sm leading-6 text-navy-800/80">
					Send a bank transfer for the outstanding months above, or the remaining
				year in one payment. Use your name as the payment reference unless a
				different note is given.
				</p>
				{page.paymentAccount ? (
					<dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
						<div>
							<dt className={dtClass}>Account name</dt>
							<dd className={ddClass}>{page.paymentAccount.accountName}</dd>
						</div>
						<div>
							<dt className={dtClass}>Sort code</dt>
							<dd className={ddClass}>{formatSortCode(page.paymentAccount.sortCode)}</dd>
						</div>
						<div>
							<dt className={dtClass}>Account number</dt>
							<dd className={ddClass}>{page.paymentAccount.accountNumber}</dd>
						</div>
						{page.paymentAccount.referenceNote ? (
							<div className="sm:col-span-2">
								<dt className={dtClass}>Reference</dt>
								<dd className={ddClass}>{page.paymentAccount.referenceNote}</dd>
							</div>
						) : null}
					</dl>
				) : (
					<p className="mt-4 text-sm leading-6 text-navy-800/80">
						Official account details have not been published yet. Contact a
						fellowship administrator before sending a payment.
					</p>
				)}
			</section>

			<section className="mt-10">
				<h2 className="font-serif text-2xl font-semibold text-navy-950">
					Months in {page.year}
				</h2>
				{months.length === 0 ? (
					<p className={emptyStateClass}>No dues records are available yet.</p>
				) : (
					<div className={tableWrapClass}>
						<table className="min-w-full text-left text-sm">
							<caption className="sr-only">Monthly dues for {page.year}</caption>
							<thead className="border-b border-cream-200 bg-cream-50">
								<tr>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Month
									</th>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Amount due
									</th>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Amount paid
									</th>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{months.map((row) => (
									<tr key={row.id} className="border-b border-cream-100 last:border-0">
										<td className="px-4 py-3 text-navy-950">{formatDueMonth(row.due_month)}</td>
										<td className="px-4 py-3 text-navy-800">
											{formatPenceAsGbp(row.amount_due_pence)}
										</td>
										<td className="px-4 py-3 text-navy-800">
											{formatPenceAsGbp(row.amount_paid_pence)}
										</td>
										<td className="px-4 py-3 text-navy-800">{duesStatusLabel(row.status)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{page.submissions.length > 0 ? (
				<section className="mt-10">
					<h2 className="font-serif text-2xl font-semibold text-navy-950">
						Recorded payments
					</h2>
					<ul className="mt-6 space-y-4">
						{page.submissions.map((submission) => {
							const files = evidenceBySubmission.get(submission.id) ?? []
							return (
								<li key={submission.id} className={cardClass}>
									<p className="font-medium text-navy-950">
										{formatPenceAsGbp(submission.amount_pence)} ·{' '}
										{paymentSubmissionStatusLabel(submission.status)}
									</p>
									<p className="mt-2 text-sm text-navy-800/80">
										Paid {submission.payment_date} · Ref {submission.transaction_reference}
									</p>
									{files.length > 0 ? (
										<p className="mt-3">
											{files.map((file) => (
												<Link
													key={file.id}
													href={`/payment-evidence/${file.id}`}
													className={navLinkClass}
												>
													View evidence
												</Link>
											))}
										</p>
									) : null}
								</li>
							)
						})}
					</ul>
				</section>
			) : null}
		</main>
	)
}

export default DuesPage
