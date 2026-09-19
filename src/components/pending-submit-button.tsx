'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

interface PendingSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	pendingLabel?: string
	children: ReactNode
}

export const PendingSubmitButton = ({
	pendingLabel = 'Please wait…',
	children,
	className = '',
	disabled,
	...props
}: PendingSubmitButtonProps) => {
	const { pending } = useFormStatus()
	const isDisabled = Boolean(disabled || pending)

	return (
		<button type="submit" className={className} disabled={isDisabled} aria-busy={pending} {...props}>
			{pending ? (
				<span className="inline-flex items-center gap-2">
					<span
						className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
						aria-hidden="true"
					/>
					{pendingLabel}
				</span>
			) : (
				children
			)}
		</button>
	)
}
