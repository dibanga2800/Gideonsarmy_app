import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logging'
import { isMemberPhotoPath, isOwnMemberPhotoPath } from '@/lib/members/portrait'

const BUCKET = 'member-photos'
const SIGNED_URL_SECONDS = 60 * 30

export const uploadMemberPhotoObject = async (input: {
	memberId: string
	storagePath: string
	bytes: Uint8Array
}) => {
	if (!isOwnMemberPhotoPath(input.memberId, input.storagePath)) {
		return false
	}

	const supabase = createSupabaseServerClient()
	const { error } = await supabase.storage.from(BUCKET).upload(input.storagePath, input.bytes, {
		contentType: 'image/jpeg',
		upsert: false,
	})

	if (error) {
		logEvent({
			operation: 'profiles.uploadPhoto',
			status: 'error',
			errorCategory: 'storage',
		})
		return false
	}

	return true
}

export const deleteMemberPhotoObject = async (memberId: string, storagePath: string) => {
	if (!isOwnMemberPhotoPath(memberId, storagePath)) {
		return false
	}

	const supabase = createSupabaseServerClient()
	const { error } = await supabase.storage.from(BUCKET).remove([storagePath])

	if (error) {
		logEvent({
			operation: 'profiles.deletePhoto',
			status: 'error',
			errorCategory: 'storage',
		})
		return false
	}

	return true
}

export const createMemberPhotoSignedUrl = async (storagePath: string) => {
	if (!isMemberPhotoPath(storagePath)) {
		return null
	}
	const supabase = createSupabaseAdminClient()
	const { data, error } = await supabase.storage
		.from(BUCKET)
		.createSignedUrl(storagePath, SIGNED_URL_SECONDS)

	if (error || !data?.signedUrl) {
		logEvent({
			operation: 'profiles.signPhoto',
			status: 'error',
			errorCategory: 'storage',
		})
		return null
	}

	return data.signedUrl
}
