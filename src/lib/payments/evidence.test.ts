import { describe, expect, it } from 'vitest'
import { detectEvidenceMime, validateEvidenceBytes } from './evidence'

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])

describe('payment evidence', () => {
	it('detects allowed file signatures', () => {
		expect(detectEvidenceMime(jpeg)).toBe('image/jpeg')
		expect(detectEvidenceMime(png)).toBe('image/png')
		expect(detectEvidenceMime(pdf)).toBe('application/pdf')
		expect(detectEvidenceMime(Uint8Array.from([0x00, 0x01]))).toBeNull()
	})

	it('accepts a jpeg whose extension matches the detected type', () => {
		expect(
			validateEvidenceBytes({
				bytes: jpeg,
				filename: 'receipt.JPG',
				size: jpeg.byteLength,
			}),
		).toEqual({ mime: 'image/jpeg', extension: 'jpg' })
	})

	it('rejects a mismatched extension even when bytes look valid', () => {
		expect(
			validateEvidenceBytes({
				bytes: jpeg,
				filename: 'receipt.exe',
				size: jpeg.byteLength,
			}),
		).toBeNull()
	})

	it('rejects an empty file', () => {
		expect(
			validateEvidenceBytes({
				bytes: new Uint8Array(),
				filename: 'receipt.jpg',
				size: 0,
			}),
		).toBeNull()
	})
})
