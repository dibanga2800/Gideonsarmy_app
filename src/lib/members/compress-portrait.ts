import sharp from 'sharp'
import {
	MAX_PORTRAIT_BYTES,
	PORTRAIT_MAX_EDGE,
	TARGET_PORTRAIT_BYTES,
	isPortraitIntakeAllowed,
} from '@/lib/members/portrait'

const QUALITY_STEPS = [80, 70, 60, 50] as const
const SMALLER_EDGE = 800

const encode = async (bytes: Uint8Array, maxEdge: number, quality: number) => {
	return sharp(bytes, { failOn: 'error' })
		.rotate()
		.resize({
			width: maxEdge,
			height: maxEdge,
			fit: 'inside',
			withoutEnlargement: true,
		})
		.jpeg({ quality, mozjpeg: true })
		.toBuffer()
}

/**
 * Re-encode a portrait as JPEG, aiming for about 250–500 KB and never above 1 MB.
 * Smaller originals are left small; they are not padded up to the target.
 */
export const compressPortrait = async (bytes: Uint8Array) => {
	if (!isPortraitIntakeAllowed({ bytes, size: bytes.byteLength })) {
		return null
	}

	try {
		let output = await encode(bytes, PORTRAIT_MAX_EDGE, QUALITY_STEPS[0])

		for (const quality of QUALITY_STEPS.slice(1)) {
			if (output.byteLength <= TARGET_PORTRAIT_BYTES) {
				break
			}

			output = await encode(bytes, PORTRAIT_MAX_EDGE, quality)
		}

		if (output.byteLength > TARGET_PORTRAIT_BYTES) {
			output = await encode(bytes, SMALLER_EDGE, 60)
		}

		if (output.byteLength <= 0 || output.byteLength > MAX_PORTRAIT_BYTES) {
			return null
		}

		return {
			bytes: new Uint8Array(output),
			mime: 'image/jpeg' as const,
			extension: 'jpg' as const,
		}
	} catch {
		return null
	}
}
