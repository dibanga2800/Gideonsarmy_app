'use client'

import { useState } from 'react'
import { dangerButtonClass, secondaryButtonClass } from '@/lib/ui'

interface ConfirmDeleteFormProps {
	action: (formData: FormData) => Promise<void>
	idName: string
	idValue: string
	triggerLabel: string
	title: string
	body: string
	confirmLabel: string
}

export const ConfirmDeleteForm = ({
	action,
	idName,
	idValue,
	triggerLabel,
	title,
	body,
	confirmLabel,
}: ConfirmDeleteFormProps) => {
	const [asking, setAsking] = useState(false)

	return (
		<form action={action} className="mt-6">
			<input type="hidden" name={idName} value={idValue} />
			{asking ? (
				<div
					className="rounded-md border border-red-200 bg-red-50 p-4"
					role="alertdialog"
					aria-labelledby="delete-title"
					aria-describedby="delete-body"
				>
					<p id="delete-title" className="font-medium text-navy-950">
						{title}
					</p>
					<p id="delete-body" className="mt-2 text-sm leading-6 text-navy-800">
						{body}
					</p>
					<div className="mt-4 flex flex-wrap gap-3">
						<button
							type="button"
							className={secondaryButtonClass}
							onClick={() => setAsking(false)}
						>
							No
						</button>
						<button type="submit" className={dangerButtonClass}>
							Yes, {confirmLabel}
						</button>
					</div>
				</div>
			) : (
				<button type="button" className={secondaryButtonClass} onClick={() => setAsking(true)}>
					{triggerLabel}
				</button>
			)}
		</form>
	)
}
