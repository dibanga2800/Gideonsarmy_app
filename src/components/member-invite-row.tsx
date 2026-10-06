'use client'

import { useState } from 'react'
import {
	resendMemberInviteAction,
	updateMemberInviteAction,
} from '@/server/actions/member-actions'
import {
	inputClass,
	labelClass,
	primaryButtonClass,
	secondaryButtonClass,
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
		<li className="rounded-xl border border-cream-200 bg-cream-50 p-4">
			{editing ? (
				<form
					action={updateMemberInviteAction}
					className="grid gap-3 sm:grid-cols-2"
				>
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
						<button type="submit" className={primaryButtonClass}>
							Save &amp; resend invitation
						</button>
						<button
							type="button"
							className={secondaryButtonClass}
							onClick={() => setEditing(false)}
						>
							Cancel
						</button>
					</div>
				</form>
			) : (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="font-medium text-navy-950">{email}</p>
						<p className="mt-1 text-sm text-navy-800">
							{fullName || 'Name not provided'} · waiting to sign in
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className={secondaryButtonClass}
							onClick={() => setEditing(true)}
						>
							Edit
						</button>
						<form action={resendMemberInviteAction}>
							<input type="hidden" name="email" value={email} />
							<button type="submit" className={secondaryButtonClass}>
								Resend email
							</button>
						</form>
					</div>
				</div>
			)}
		</li>
	)
}
