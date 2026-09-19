'use client'

import { useMemo, useState } from 'react'
import { formatMonthShort } from '@/lib/dates/dues-year'
import { getLondonDate } from '@/lib/dates/due-month'
import { memberDisplayName } from '@/lib/members/display'
import { addPence, formatPenceAsGbp, penceToPoundsInput } from '@/lib/money'
import {
	helpTextClass,
	inputClass,
	labelClass,
	primaryButtonClass,
} from '@/lib/ui'
import type { MemberYearLedger } from '@/lib/dues/ledger'
import type { Profile } from '@/types/database'

interface LedgerRow {
	member: Profile
	ledger: MemberYearLedger
}

interface DuesLedgerProps {
	action: (formData: FormData) => Promise<void>
	year: number
	rows: LedgerRow[]
}

export const DuesLedger = ({ action, year, rows }: DuesLedgerProps) => {
	const [selectedByMember, setSelectedByMember] = useState<Record<string, string[]>>({})
	const [paymentDate, setPaymentDate] = useState(getLondonDate())
	const [reference, setReference] = useState(`Excel ${year}`)

	const handleToggle = (memberId: string, duesId: string, checked: boolean) => {
		setSelectedByMember((current) => {
			const existing = current[memberId] ?? []
			const next = checked
				? [...existing, duesId]
				: existing.filter((id) => id !== duesId)
			return { ...current, [memberId]: next }
		})
	}

	if (rows.length === 0) {
		return (
			<p className="mt-6 text-sm leading-6 text-navy-800/80">
				No active members are available.
			</p>
		)
	}

	return (
		<div className="mt-6 space-y-5">
			<div className="grid gap-5 sm:grid-cols-2">
				<div>
					<label htmlFor="ledgerPaymentDate" className={labelClass}>
						Payment date
					</label>
					<input
						id="ledgerPaymentDate"
						type="date"
						required
						value={paymentDate}
						onChange={(event) => setPaymentDate(event.target.value)}
						className={inputClass}
					/>
				</div>
				<div>
					<label htmlFor="ledgerReference" className={labelClass}>
						Transaction reference
					</label>
					<input
						id="ledgerReference"
						type="text"
						required
						maxLength={64}
						value={reference}
						onChange={(event) => setReference(event.target.value)}
						className={inputClass}
					/>
					<p className={helpTextClass}>
						Use this when copying paid months from your Excel book.
					</p>
				</div>
			</div>
			<div className="overflow-x-auto rounded-xl border border-cream-200">
				<table className="min-w-full text-left text-sm">
					<caption className="sr-only">{year} dues ledger</caption>
					<thead className="border-b border-cream-200 bg-cream-50">
						<tr>
							<th scope="col" className="sticky left-0 bg-cream-50 px-3 py-3 font-medium text-navy-800">
								Member
							</th>
							{rows[0]?.ledger.cells.map((cell) => (
								<th
									key={cell.month}
									scope="col"
									className="px-2 py-3 text-center font-medium text-navy-800"
								>
									{formatMonthShort(cell.month)}
								</th>
							))}
							<th scope="col" className="px-3 py-3 font-medium text-navy-800">
								Paid
							</th>
							<th scope="col" className="px-3 py-3 font-medium text-navy-800">
								Owing
							</th>
							<th scope="col" className="px-3 py-3 font-medium text-navy-800">
								Year
							</th>
							<th scope="col" className="px-3 py-3 font-medium text-navy-800">
								<span className="sr-only">Record</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(({ member, ledger }) => (
							<LedgerMemberRow
								key={member.id}
								action={action}
								year={year}
								member={member}
								ledger={ledger}
								selectedIds={selectedByMember[member.id] ?? []}
								paymentDate={paymentDate}
								reference={reference}
								onToggle={handleToggle}
							/>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

const LedgerMemberRow = ({
	action,
	year,
	member,
	ledger,
	selectedIds,
	paymentDate,
	reference,
	onToggle,
}: {
	action: (formData: FormData) => Promise<void>
	year: number
	member: Profile
	ledger: MemberYearLedger
	selectedIds: string[]
	paymentDate: string
	reference: string
	onToggle: (memberId: string, duesId: string, checked: boolean) => void
}) => {
	const selectedMonths = useMemo(
		() => ledger.cells.filter((cell) => cell.dues && selectedIds.includes(cell.dues.id)),
		[ledger.cells, selectedIds],
	)
	const selectedTotal = addPence(
		...selectedMonths.map((cell) => cell.dues?.amount_due_pence ?? 0),
	)

	return (
		<tr className="border-b border-cream-100 last:border-0">
			<th
				scope="row"
				className="sticky left-0 bg-white px-3 py-3 font-medium text-navy-950"
			>
				{memberDisplayName(member)}
			</th>
			{ledger.cells.map((cell) => {
				const canSelect = cell.state === 'owing' && cell.dues
				return (
					<td key={cell.month} className="px-2 py-3 text-center">
						{canSelect && cell.dues ? (
							<label className="inline-flex items-center justify-center">
								<span className="sr-only">
									{formatMonthShort(cell.month)} for {memberDisplayName(member)}
								</span>
								<input
									type="checkbox"
									checked={selectedIds.includes(cell.dues.id)}
									onChange={(event) =>
										onToggle(member.id, cell.dues?.id ?? '', event.target.checked)
									}
									className="h-4 w-4 rounded border-cream-200"
								/>
							</label>
						) : (
							<span
								className={
									cell.state === 'paid'
										? 'font-semibold text-green-800'
										: cell.state === 'waived'
											? 'text-navy-500'
											: 'text-navy-400'
								}
							>
								{cell.state === 'paid'
									? 'Paid'
									: cell.state === 'waived'
										? 'Waived'
										: cell.state === 'not_due' || cell.state === 'missing'
											? '—'
											: 'Owing'}
							</span>
						)}
					</td>
				)
			})}
			<td className="whitespace-nowrap px-3 py-3 text-navy-800">
				{formatPenceAsGbp(ledger.paidPence)}
			</td>
			<td className="whitespace-nowrap px-3 py-3 text-navy-800">
				{ledger.isUpToDate ? 'Up to date' : formatPenceAsGbp(ledger.owingPence)}
			</td>
			<td className="whitespace-nowrap px-3 py-3 text-navy-800">
				{formatPenceAsGbp(ledger.annualPence)}
			</td>
			<td className="px-3 py-3">
				<form action={action} className="flex justify-end">
					<input type="hidden" name="source" value="payments" />
					<input type="hidden" name="ledgerYear" value={String(year)} />
					<input type="hidden" name="memberId" value={member.id} />
					<input type="hidden" name="paymentDate" value={paymentDate} />
					<input type="hidden" name="transactionReference" value={reference} />
					<input type="hidden" name="notes" value={`Recorded from ${year} ledger`} />
					<input type="hidden" name="amountPounds" value={penceToPoundsInput(selectedTotal)} />
					{selectedIds.map((id) => (
						<input key={id} type="hidden" name="duesIds" value={id} />
					))}
					<button
						type="submit"
						className={primaryButtonClass}
						disabled={selectedIds.length === 0}
					>
						Record
					</button>
				</form>
			</td>
		</tr>
	)
}
