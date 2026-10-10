'use client'

import { useState, type ChangeEvent } from 'react'
import { compressPortraitFile } from '@/lib/members/compress-portrait-file'
import { helpTextClass, labelClass } from '@/lib/ui'

const fileInputClass =
	'mt-1.5 block w-full rounded-lg border border-dashed border-cream-300 bg-cream-50 p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-900 file:shadow-card file:ring-1 file:ring-line hover:file:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500'

interface PortraitFileFieldProps {
	name?: string
	label?: string
	helpText?: string
}

export const PortraitFileField = ({
	name = 'portrait',
	label = 'Birthday portrait',
	helpText = 'Shown with your name on birthday lists. JPEG, PNG, or WebP; compressed to under 1 MB.',
}: PortraitFileFieldProps) => {
	const [error, setError] = useState<string | null>(null)

	const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
		setError(null)
		const file = event.target.files?.[0]

		if (!file) {
			return
		}

		const compressed = await compressPortraitFile(file)

		if (!compressed) {
			event.target.value = ''
			setError('That photo could not be reduced under 1 MB. Try a smaller image.')
			return
		}

		const transfer = new DataTransfer()
		transfer.items.add(compressed)
		event.target.files = transfer.files
	}

	return (
		<div>
			<label htmlFor={name} className={labelClass}>
				{label}
			</label>
			<input
				id={name}
				name={name}
				type="file"
				required
				accept="image/jpeg,image/png,image/webp"
				className={fileInputClass}
				aria-describedby={`${name}-help`}
				onChange={handleChange}
			/>
			<p id={`${name}-help`} className={helpTextClass}>
				{helpText}
			</p>
			{error ? (
				<p className="mt-2 text-sm text-red-700" role="alert">
					{error}
				</p>
			) : null}
		</div>
	)
}
