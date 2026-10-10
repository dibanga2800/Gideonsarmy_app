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
	smallButtonClass,
} from '@/lib/ui'
import type { LedgerCell, MemberYearLedger } from '@/lib/dues/ledger'
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
		return <p className="px-5 py-8 text-center text-sm text-slate-600 sm:px-6">No active members yet.</p>
	}

	return (
		<div>
			<div className="grid gap-4 border-b border-line bg-cream-50 px-5 py-4 sm:grid-cols-[12rem_minmax(0,18rem)_1fr] sm:items-end sm:px-6">
				<div>
					<label htmlFor="ledgerPaymentDate" className={labelClass}>
						Date received
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
						Bank reference
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
				</div>
				<p className={`${helpTextClass} sm:mb-2`}>
					Tick the months a member has paid, then press Record on his row. Date and reference apply to
					each row you record.
				</p>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<caption className="sr-only">{year} dues ledger</caption>
					<thead className="border-b border-line text-[0.8125rem] text-slate-500">
						<tr>
							<th scope="col" className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium sm:pl-6">
								Member
							</th>
							{rows[0]?.ledger.cells.map((cell) => (
								<th key={cell.month} scope="col" className="px-1 py-2.5 text-center font-medium">
									{formatMonthShort(cell.month)}
								</th>
							))}
							<th scope="col" className="px-3 py-2.5 text-right font-medium">
								Paid
							</th>
							<th scope="col" className="px-3 py-2.5 text-right font-medium">
								Owing
							</th>
							<th scope="col" className="px-3 py-2.5 sm:pr-6">
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

const cellBase = 'mx-auto flex h-8 w-9 items-center justify-center rounded-md text-xs font-semibold'

const StateCell = ({ state }: { state: LedgerCell['state'] }) => {
	if (state === 'paid') {
		return (
			<span className={`${cellBase} bg-emerald-600 text-white`} title="Paid">
				<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
					<path d="m5 12.5 4.5 4.5L19 7.5" />
				</svg>
				<span className="sr-only">Paid</span>
			</span>
		)
	}

	if (state === 'owing') {
		return (
			<span className={`${cellBase} bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-300`} title="Owing">
				£<span className="sr-only"> owing</span>
			</span>
		)
	}

	if (state === 'waived') {
		return (
			<span className={`${cellBase} bg-cream-100 text-slate-500 ring-1 ring-inset ring-slate-300`} title="Waived">
				W<span className="sr-only">aived</span>
			</span>
		)
	}

	return (
		<span className={`${cellBase} text-slate-300`} title={state === 'missing' ? 'Not set up' : 'Not yet due'}>
			–<span className="sr-only">{state === 'missing' ? 'Not set up' : 'Not yet due'}</span>
		</span>
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
		<tr className="border-b border-cream-100 last:border-0 hover:bg-cream-50/60">
			<th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2 font-medium text-navy-950 sm:pl-6">
				{memberDisplayName(member)}
			</th>
			{ledger.cells.map((cell) => {
				const canSelect = cell.state === 'owing' && cell.dues
				const checked = cell.dues ? selectedIds.includes(cell.dues.id) : false
				return (
					<td key={cell.month} className="px-1 py-2 text-center">
						{canSelect && cell.dues ? (
							<label
								className={`${cellBase} cursor-pointer ring-1 ring-inset transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold-500 ${
									checked
										? 'bg-navy-900 text-white ring-navy-900'
										: 'bg-amber-50 text-amber-800 ring-amber-300 hover:bg-amber-100'
								}`}
								title={checked ? 'Selected to record' : 'Owing: tick to record'}
							>
								<input
									type="checkbox"
									checked={checked}
									onChange={(event) => onToggle(member.id, cell.dues?.id ?? '', event.target.checked)}
									className="sr-only"
								/>
								<span className="sr-only">
									{formatMonthShort(cell.month)} for {memberDisplayName(member)}, owing
								</span>
								<span aria-hidden="true">{checked ? '✓' : '£'}</span>
							</label>
						) : (
							<StateCell state={cell.state} />
						)}
					</td>
				)
			})}
			<td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">{formatPenceAsGbp(ledger.paidPence)}</td>
			<td className="whitespace-nowrap px-3 py-2 text-right">
				{ledger.isUpToDate ? (
					<span className="text-emerald-700">Up to date</span>
				) : (
					<span className="font-semibold text-amber-800">{formatPenceAsGbp(ledger.owingPence)}</span>
				)}
			</td>
			<td className="px-3 py-2 sm:pr-6">
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
						className={`${primaryButtonClass} ${smallButtonClass} whitespace-nowrap`}
						disabled={selectedIds.length === 0}
					>
						{selectedIds.length === 0 ? 'Record' : `Record ${formatPenceAsGbp(selectedTotal)}`}
					</button>
				</form>
			</td>
		</tr>
	)
}
