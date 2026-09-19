'use client'

import { useMemo, useState } from 'react'
import { formatDueMonth, getLondonDate } from '@/lib/dates/due-month'
import { memberDisplayName } from '@/lib/members/display'
import { addPence, formatPenceAsGbp, penceToPoundsInput } from '@/lib/money'
import {
	helpTextClass,
	inputClass,
	labelClass,
	primaryButtonClass,
	secondaryButtonClass,
	textareaClass,
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
		return <p className="text-sm leading-6 text-navy-800/80">No active members are available.</p>
	}

	return (
		<form action={action} className="mt-6 space-y-5">
			{initialMemberId ? <input type="hidden" name="source" value="member" /> : (
				<input type="hidden" name="source" value="payments" />
			)}
			{ledgerYear ? <input type="hidden" name="ledgerYear" value={String(ledgerYear)} /> : null}
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
			<fieldset>
				<legend className={labelClass}>Months</legend>
				{months.length === 0 ? (
					<p className={`${helpTextClass} mt-2`}>
						{ledgerYear
							? `This brother has no outstanding months in ${ledgerYear}. Open another year on Payments if you need to record an earlier year.`
							: 'This brother has no outstanding months. Open Payments after the month is generated, or waive a month from his member record.'}
					</p>
				) : (
					<>
						<p className={`${helpTextClass} mt-2`}>
							Select every outstanding month to record a full-year payment of{' '}
							{formatPenceAsGbp(allOutstandingTotal)}. Or tick individual months.
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<button
								type="button"
								className={secondaryButtonClass}
								onClick={allSelected ? handleClearMonths : handleSelectAllOutstanding}
							>
								{allSelected ? 'Clear months' : 'Select all outstanding months'}
							</button>
						</div>
						<ul className="mt-3 space-y-2">
							{months.map((row) => (
								<li key={row.id}>
									<label className="flex items-start gap-3 text-sm text-navy-900">
										<input
											type="checkbox"
											name="duesIds"
											value={row.id}
											checked={selectedIds.includes(row.id)}
											onChange={(event) => handleToggle(row.id, event.target.checked)}
											className="mt-1 h-4 w-4 rounded border-cream-200"
										/>
										<span>
											{formatDueMonth(row.due_month)} · {formatPenceAsGbp(row.amount_due_pence)}
										</span>
									</label>
								</li>
							))}
						</ul>
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
					className={inputClass}
				/>
				<p className={helpTextClass}>
					Must equal the selected months. Whole months only.
				</p>
			</div>
			<div>
				<label htmlFor="paymentDate" className={labelClass}>
					Payment date
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
					Transaction reference
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
			<div>
				<label htmlFor="notes" className={labelClass}>
					Note
				</label>
				<textarea id="notes" name="notes" maxLength={500} className={textareaClass} />
				<p className={helpTextClass}>Optional.</p>
			</div>
			<button type="submit" className={primaryButtonClass} disabled={selectedIds.length === 0}>
				Record payment
			</button>
		</form>
	)
}
