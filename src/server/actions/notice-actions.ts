'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { markNoticeRead } from '@/server/services/notice-service'

const notificationIdSchema = z.string().uuid()

export const markNoticeReadAction = async (formData: FormData) => {
	const value = formData.get('notificationId')
	const parsed = notificationIdSchema.safeParse(typeof value === 'string' ? value : '')

	if (!parsed.success) {
		return
	}

	await markNoticeRead(parsed.data)
	revalidatePath('/notifications')
	revalidatePath('/dashboard')
}
