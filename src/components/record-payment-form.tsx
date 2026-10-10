'use client'

import { useMemo, useState } from 'react'
import { formatDueMonth, getLondonDate } from '@/lib/dates/due-month'
import { memberDisplayName } from '@/lib/members/display'
import { addPence, formatPenceAsGbp, penceToPoundsInput } from '@/lib/money'
import { formatMonthShort } from '@/lib/dates/dues-year'
import {
	ghostButtonClass,
	helpTextClass,
	inputClass,
	labelClass,
	primaryButtonClass,
	smallButtonClass,
} from '@/lib/ui'
import type { DuesRecord } from '@/types/database'
import type { Profile } from '@/types/database'

interface RecordPaymentFormProps {
	action: (formData: FormData) => Promise<void>
	members: Profile[]
	outstandingDues: DuesRecord[]
	initialMemberId?: string
	ledgerYear?: number
}

export const RecordPaymentForm = ({
	action,
	members,
	outstandingDues,
	initialMemberId,
	ledgerYear,
}: RecordPaymentFormProps) => {
	const defaultMemberId = initialMemberId ?? members[0]?.id ?? ''
	const [memberId, setMemberId] = useState(defaultMemberId)
	const [selectedIds, setSelectedIds] = useState<string[]>([])

	const months = useMemo(
		() => outstandingDues.filter((row) => row.member_id === memberId),
		[memberId, outstandingDues],
	)

	const selectedMonths = months.filter((row) => selectedIds.includes(row.id))
	const selectedTotal = addPence(...selectedMonths.map((row) => row.amount_due_pence))
	const allOutstandingTotal = addPence(...months.map((row) => row.amount_due_pence))
	const allSelected = months.length > 0 && selectedIds.length === months.length

	const handleMemberChange = (nextId: string) => {
		setMemberId(nextId)
		setSelectedIds([])
	}

	const handleToggle = (duesId: string, checked: boolean) => {
		setSelectedIds((current) =>
			checked ? [...current, duesId] : current.filter((id) => id !== duesId),
		)
	}

	const handleSelectAllOutstanding = () => {
		setSelectedIds(months.map((row) => row.id))
	}

	const handleClearMonths = () => {
		setSelectedIds([])
	}

	if (members.length === 0) {
		return <p className="text-sm leading-6 text-slate-600">No active members are available.</p>
	}

	return (
		<form action={action} className="space-y-5">
			<input type="hidden" name="source" value={initialMemberId ? 'member' : 'payments'} />
			{ledgerYear ? <input type="hidden" name="ledgerYear" value={String(ledgerYear)} /> : null}
			{initialMemberId ? (
				<input type="hidden" name="memberId" value={memberId} />
			) : (
				<div>
					<label htmlFor="memberId" className={labelClass}>
						Member
					</label>
					<select
						id="memberId"
						name="memberId"
						required
						value={memberId}
						onChange={(event) => handleMemberChange(event.target.value)}
						className={inputClass}
					>
						{members.map((member) => (
							<option key={member.id} value={member.id}>
								{memberDisplayName(member)}
							</option>
						))}
					</select>
				</div>
			)}
			<fieldset>
				<div className="flex items-center justify-between gap-3">
					<legend className={labelClass}>Months covered</legend>
					{months.length > 0 ? (
						<button
							type="button"
							className={`${ghostButtonClass} ${smallButtonClass} -mr-3`}
							onClick={allSelected ? handleClearMonths : handleSelectAllOutstanding}
						>
							{allSelected ? 'Clear' : 'Select all'}
						</button>
					) : null}
				</div>
				{months.length === 0 ? (
					<p className={`${helpTextClass} rounded-lg bg-cream-50 px-3 py-2.5 ring-1 ring-inset ring-line`}>
						{ledgerYear
							? `Nothing outstanding for this member in ${ledgerYear}. Switch year above to record an earlier year.`
							: 'Nothing outstanding. Months appear once they are set up on Payments, and can be waived from the dues history.'}
					</p>
				) : (
					<>
						<ul className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
							{months.map((row) => {
								const checked = selectedIds.includes(row.id)
								return (
									<li key={row.id}>
										<label
											className={`flex min-h-10 cursor-pointer items-center justify-center rounded-md px-2 text-center text-[0.8125rem] font-medium ring-1 ring-inset transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-gold-500 ${
												checked
													? 'bg-navy-900 text-white ring-navy-900'
													: 'bg-white text-navy-900 ring-cream-300 hover:bg-cream-50'
											}`}
										>
											<input
												type="checkbox"
												name="duesIds"
												value={row.id}
												checked={checked}
												onChange={(event) => handleToggle(row.id, event.target.checked)}
												className="sr-only"
											/>
											{formatMonthShort(row.due_month)} {row.due_month.slice(2, 4)}
											<span className="sr-only">, {formatDueMonth(row.due_month)}, {formatPenceAsGbp(row.amount_due_pence)}</span>
										</label>
									</li>
								)
							})}
						</ul>
						<p className={helpTextClass}>
							All {months.length} outstanding {months.length === 1 ? 'month' : 'months'} come to{' '}
							{formatPenceAsGbp(allOutstandingTotal)}.
						</p>
					</>
				)}
			</fieldset>
			<div>
				<label htmlFor="amountPounds" className={labelClass}>
					Amount received (£)
				</label>
				<input
					id="amountPounds"
					name="amountPounds"
					type="text"
					inputMode="decimal"
					required
					value={penceToPoundsInput(selectedTotal)}
					readOnly
					aria-describedby="amountPounds-help"
					className={`${inputClass} font-semibold`}
				/>
				<p id="amountPounds-help" className={helpTextClass}>
					Worked out from the months selected. Whole months only.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="paymentDate" className={labelClass}>
						Date received
					</label>
					<input
						id="paymentDate"
						name="paymentDate"
						type="date"
						required
						defaultValue={getLondonDate()}
						className={inputClass}
					/>
				</div>
				<div>
					<label htmlFor="transactionReference" className={labelClass}>
						Bank reference
					</label>
					<input
						id="transactionReference"
						name="transactionReference"
						type="text"
						required
						maxLength={64}
						className={inputClass}
					/>
				</div>
			</div>
			<div>
				<label htmlFor="notes" className={labelClass}>
					Note <span className="font-normal text-slate-500">(optional)</span>
				</label>
				<textarea id="notes" name="notes" maxLength={500} rows={2} className={`${inputClass} min-h-[4rem]`} />
			</div>
			<button type="submit" className={`${primaryButtonClass} w-full`} disabled={selectedIds.length === 0}>
				{selectedIds.length === 0
					? 'Select months to record'
					: `Record ${formatPenceAsGbp(selectedTotal)} payment`}
			</button>
		</form>
	)
}
