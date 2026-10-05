'use client'

import { useState, type ChangeEvent } from 'react'
import { compressPortraitFile } from '@/lib/members/compress-portrait-file'
import { helpTextClass, inputClass, labelClass } from '@/lib/ui'

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
				className={inputClass}
				onChange={handleChange}
			/>
			<p className={helpTextClass}>{helpText}</p>
			{error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
		</div>
	)
}
