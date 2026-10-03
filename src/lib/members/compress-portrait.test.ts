import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { compressPortrait } from '@/lib/members/compress-portrait'
import { MAX_PORTRAIT_BYTES, TARGET_PORTRAIT_BYTES } from '@/lib/members/portrait'

const noisyJpeg = async () => {
	const width = 1800
	const height = 1800
	const raw = Buffer.alloc(width * height * 3)

	for (let index = 0; index < raw.length; index += 1) {
		raw[index] = (index * 17) % 256
	}

	return sharp(raw, { raw: { width, height, channels: 3 } })
		.jpeg({ quality: 100 })
		.toBuffer()
}

describe('compressPortrait', () => {
	it('reduces a large photo to at most 1 MB, aiming for 500 KB', async () => {
		const source = await noisyJpeg()
		expect(source.byteLength).toBeGreaterThan(MAX_PORTRAIT_BYTES)

		const compressed = await compressPortrait(new Uint8Array(source))

		expect(compressed).not.toBeNull()
		expect(compressed?.mime).toBe('image/jpeg')
		expect(compressed?.bytes.byteLength).toBeLessThanOrEqual(MAX_PORTRAIT_BYTES)
		expect(compressed?.bytes.byteLength).toBeLessThanOrEqual(TARGET_PORTRAIT_BYTES)
		expect(compressed?.bytes[0]).toBe(0xff)
		expect(compressed?.bytes[1]).toBe(0xd8)
	})

	it('rejects a file that is not a JPEG, PNG, or WebP', async () => {
		const text = new TextEncoder().encode('not-a-photo')
		expect(await compressPortrait(text)).toBeNull()
	})
})
