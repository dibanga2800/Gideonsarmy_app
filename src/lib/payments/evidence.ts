export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024

const JPEG = 'image/jpeg'
const PNG = 'image/png'
const WEBP = 'image/webp'
const PDF = 'application/pdf'

export const EVIDENCE_EXTENSIONS: Record<string, string> = {
	[JPEG]: 'jpg',
	[PNG]: 'png',
	[WEBP]: 'webp',
	[PDF]: 'pdf',
}

const startsWith = (bytes: Uint8Array, signature: number[]) => {
	if (bytes.length < signature.length) {
		return false
	}

	return signature.every((value, index) => bytes[index] === value)
}

export const detectEvidenceMime = (bytes: Uint8Array) => {
	if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
		return JPEG
	}

	if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
		return PNG
	}

	if (
		startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
		bytes.length >= 12 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x42 &&
		bytes[10] === 0x45 &&
		bytes[11] === 0x50
	) {
		return WEBP
	}

	if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) {
		return PDF
	}

	return null
}

export const evidenceExtensionForName = (filename: string) => {
	const trimmed = filename.trim().toLowerCase()
	const dot = trimmed.lastIndexOf('.')
	if (dot < 0 || dot === trimmed.length - 1) {
		return null
	}

	return trimmed.slice(dot + 1)
}

export const isAllowedEvidenceExtension = (mime: string, extension: string | null) => {
	if (mime === JPEG) {
		return extension === 'jpg' || extension === 'jpeg'
	}

	if (mime === PNG) {
		return extension === 'png'
	}

	if (mime === WEBP) {
		return extension === 'webp'
	}

	if (mime === PDF) {
		return extension === 'pdf'
	}

	return false
}

export const validateEvidenceBytes = (input: {
	bytes: Uint8Array
	filename: string
	size: number
}) => {
	if (input.size <= 0 || input.size > MAX_EVIDENCE_BYTES || input.bytes.byteLength !== input.size) {
		return null
	}

	const mime = detectEvidenceMime(input.bytes)
	if (!mime) {
		return null
	}

	const extension = evidenceExtensionForName(input.filename)
	if (!isAllowedEvidenceExtension(mime, extension)) {
		return null
	}

	return {
		mime,
		extension: EVIDENCE_EXTENSIONS[mime] ?? 'bin',
	}
}

export const sanitiseOriginalFilename = (filename: string) => {
	const base = filename.replace(/[/\\]/g, '').trim()
	if (base.length === 0) {
		return 'payment-evidence'
	}

	return base.slice(0, 80)
}
