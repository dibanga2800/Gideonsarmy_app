import { MAX_PORTRAIT_BYTES, PORTRAIT_MAX_EDGE, TARGET_PORTRAIT_BYTES } from '@/lib/members/portrait'

const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5]

const canvasToJpeg = (canvas: HTMLCanvasElement, quality: number) =>
	new Promise<Blob | null>((resolve) => {
		canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
	})

/**
 * Shrink a chosen photo in the browser before upload.
 * The server compresses again and rejects anything over 1 MB.
 */
export const compressPortraitFile = async (file: File): Promise<File | null> => {
	if (file.size <= 0) {
		return null
	}

	const bitmap = await createImageBitmap(file)
	const scale = Math.min(1, PORTRAIT_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
	const width = Math.max(1, Math.round(bitmap.width * scale))
	const height = Math.max(1, Math.round(bitmap.height * scale))
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const context = canvas.getContext('2d')

	if (!context) {
		bitmap.close()
		return null
	}

	context.drawImage(bitmap, 0, 0, width, height)
	bitmap.close()

	let blob = await canvasToJpeg(canvas, QUALITY_STEPS[0] ?? 0.8)

	for (const quality of QUALITY_STEPS.slice(1)) {
		if (!blob || blob.size <= TARGET_PORTRAIT_BYTES) {
			break
		}

		blob = await canvasToJpeg(canvas, quality)
	}

	if (blob && blob.size > TARGET_PORTRAIT_BYTES) {
		const smaller = Math.min(1, 800 / Math.max(width, height))
		canvas.width = Math.max(1, Math.round(width * smaller))
		canvas.height = Math.max(1, Math.round(height * smaller))
		const smallerContext = canvas.getContext('2d')
		if (smallerContext) {
			const again = await createImageBitmap(file)
			smallerContext.drawImage(again, 0, 0, canvas.width, canvas.height)
			again.close()
			blob = await canvasToJpeg(canvas, 0.6)
		}
	}

	if (!blob || blob.size <= 0 || blob.size > MAX_PORTRAIT_BYTES) {
		return null
	}

	return new File([blob], 'portrait.jpg', { type: 'image/jpeg' })
}
