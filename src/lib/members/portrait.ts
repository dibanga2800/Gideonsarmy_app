export const MAX_PORTRAIT_BYTES = 1024 * 1024
export const TARGET_PORTRAIT_BYTES = 500 * 1024
export const PORTRAIT_MAX_EDGE = 1024
export const MAX_PORTRAIT_INTAKE_BYTES = 8 * 1024 * 1024

const JPEG = 'image/jpeg'
const PNG = 'image/png'
const WEBP = 'image/webp'

const startsWith = (bytes: Uint8Array, signature: number[]) => {
	if (bytes.length < signature.length) {
		return false
	}

	return signature.every((value, index) => bytes[index] === value)
}

export const detectPortraitMime = (bytes: Uint8Array) => {
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

	return null
}

export const isPortraitIntakeAllowed = (input: { bytes: Uint8Array; size: number }) => {
	if (input.size <= 0 || input.size > MAX_PORTRAIT_INTAKE_BYTES) {
		return false
	}

	if (input.bytes.byteLength !== input.size) {
		return false
	}

	return detectPortraitMime(input.bytes) !== null
}

const PHOTO_PATH =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i

export const memberPhotoStoragePath = (memberId: string) => {
	return `${memberId}/${crypto.randomUUID()}.jpg`
}

export type MemberPhotoKind = 'portrait' | 'anniversary'

export const memberPhotoColumn = (kind: MemberPhotoKind) =>
	kind === 'anniversary' ? 'anniversary_photo_storage_path' : 'photo_storage_path'

export const isMemberPhotoPath = (storagePath: string) => PHOTO_PATH.test(storagePath)

export const isOwnMemberPhotoPath = (memberId: string, storagePath: string) => {
	if (!isMemberPhotoPath(storagePath)) {
		return false
	}

	return storagePath.toLowerCase().startsWith(`${memberId.toLowerCase()}/`)
}
