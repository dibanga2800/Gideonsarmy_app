'use client'

import { useState } from 'react'
import {
	resendMemberInviteAction,
	updateMemberInviteAction,
} from '@/server/actions/member-actions'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import {
	ghostButtonClass,
	inputClass,
	labelClass,
	primaryButtonClass,
	secondaryButtonClass,
	smallButtonClass,
} from '@/lib/ui'

interface MemberInviteRowProps {
	id: string
	email: string
	firstName: string | null
	lastName: string | null
}

export const MemberInviteRow = ({
	id,
	email,
	firstName,
	lastName,
}: MemberInviteRowProps) => {
	const [editing, setEditing] = useState(false)
	const fullName = [firstName, lastName].filter(Boolean).join(' ')

	return (
		<li className="rounded-lg border border-line bg-cream-50 px-3.5 py-3">
			{editing ? (
				<form action={updateMemberInviteAction} className="grid gap-3 sm:grid-cols-2">
					<input type="hidden" name="inviteId" value={id} />
					<div className="sm:col-span-2">
						<label htmlFor={`invite-email-${id}`} className={labelClass}>
							Email
						</label>
						<input
							id={`invite-email-${id}`}
							name="email"
							type="email"
							required
							maxLength={254}
							defaultValue={email}
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor={`invite-first-${id}`} className={labelClass}>
							First name
						</label>
						<input
							id={`invite-first-${id}`}
							name="first_name"
							type="text"
							maxLength={80}
							defaultValue={firstName ?? ''}
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor={`invite-last-${id}`} className={labelClass}>
							Last name
						</label>
						<input
							id={`invite-last-${id}`}
							name="last_name"
							type="text"
							maxLength={80}
							defaultValue={lastName ?? ''}
							className={inputClass}
						/>
					</div>
					<div className="flex flex-wrap gap-2 sm:col-span-2">
						<PendingSubmitButton className={`${primaryButtonClass} ${smallButtonClass}`} pendingLabel="Saving…">
							Save and resend
						</PendingSubmitButton>
						<button
							type="button"
							className={`${ghostButtonClass} ${smallButtonClass}`}
							onClick={() => setEditing(false)}
						>
							Cancel
						</button>
					</div>
				</form>
			) : (
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<p className="truncate text-sm font-medium text-navy-950">{email}</p>
						<p className="text-[0.8125rem] text-slate-500">{fullName || 'No name given'}</p>
					</div>
					<div className="flex flex-wrap gap-1.5">
						<button
							type="button"
							className={`${ghostButtonClass} ${smallButtonClass}`}
							onClick={() => setEditing(true)}
						>
							Edit
						</button>
						<form action={resendMemberInviteAction}>
							<input type="hidden" name="email" value={email} />
							<PendingSubmitButton className={`${secondaryButtonClass} ${smallButtonClass}`} pendingLabel="Sending…">
								Resend
							</PendingSubmitButton>
						</form>
					</div>
				</div>
			)}
		</li>
	)
}
