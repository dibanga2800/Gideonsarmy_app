'use client'

import { useState, type ChangeEvent } from 'react'
import { compressPortraitFile } from '@/lib/members/compress-portrait-file'
import { helpTextClass, inputClass, labelClass } from '@/lib/ui'

export const PortraitFileField = () => {
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
			<label htmlFor="portrait" className={labelClass}>
				Portrait
			</label>
			<input
				id="portrait"
				name="portrait"
				type="file"
				accept="image/jpeg,image/png,image/webp"
				className={inputClass}
				onChange={handleChange}
			/>
			<p className={helpTextClass}>
				Optional. Shown beside your name on birthday and anniversary lists. The
				app compresses it to about 250–500 KB, and never stores more than 1 MB.
				Leave this empty to keep your current photo.
			</p>
			{error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
		</div>
	)
}
