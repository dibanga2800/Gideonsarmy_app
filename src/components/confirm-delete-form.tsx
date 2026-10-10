'use client'

import { useState } from 'react'
import { dangerButtonClass, dangerOutlineButtonClass, ghostButtonClass } from '@/lib/ui'

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
		<form action={action}>
			<input type="hidden" name={idName} value={idValue} />
			{asking ? (
				<div
					className="rounded-lg border border-red-200 bg-red-50 p-4"
					role="alertdialog"
					aria-labelledby="delete-title"
					aria-describedby="delete-body"
				>
					<p id="delete-title" className="text-sm font-semibold text-red-900">
						{title}
					</p>
					<p id="delete-body" className="mt-1 text-sm leading-6 text-red-900/80">
						{body}
					</p>
					<div className="mt-4 flex flex-wrap gap-2">
						<button
							type="button"
							className={ghostButtonClass}
							onClick={() => setAsking(false)}
						>
							Cancel
						</button>
						<button type="submit" className={dangerButtonClass}>
							Yes, {confirmLabel}
						</button>
					</div>
				</div>
			) : (
				<button type="button" className={dangerOutlineButtonClass} onClick={() => setAsking(true)}>
					{triggerLabel}
				</button>
			)}
		</form>
	)
}
