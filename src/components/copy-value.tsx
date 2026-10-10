'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/icons'

interface CopyValueProps {
	label: string
	value: string
	/** What is written to the clipboard, when it differs from what is shown. */
	copyText?: string
}

/** A labelled value with a copy button, for bank details members type into their banking app. */
export const CopyValue = ({ label, value, copyText }: CopyValueProps) => {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!copied) {
			return
		}
		const timer = window.setTimeout(() => setCopied(false), 2000)
		return () => window.clearTimeout(timer)
	}, [copied])

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(copyText ?? value)
			setCopied(true)
		} catch {
			// Clipboard access can be refused by the browser; the value stays visible to copy by hand.
			setCopied(false)
		}
	}

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg bg-cream-50 px-3.5 py-2.5 ring-1 ring-inset ring-line">
			<div className="min-w-0">
				<p className="text-xs font-medium text-slate-500">{label}</p>
				<p className="mt-0.5 break-words text-[0.9375rem] font-semibold text-navy-950">{value}</p>
			</div>
			<button
				type="button"
				onClick={handleCopy}
				className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
				aria-label={`Copy ${label.toLowerCase()}`}
			>
				<Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
				<span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
			</button>
		</div>
	)
}
