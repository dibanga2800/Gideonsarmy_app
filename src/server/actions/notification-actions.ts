'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendCelebrationEmails } from '@/server/services/notification-admin-service'

export const sendTodayCelebrationEmailsAction = async () => {
	const result = await sendCelebrationEmails('scheduled')

	if (!result.ok) {
		redirect(`/celebrations?error=email`)
	}

	revalidatePath('/celebrations')
	revalidatePath('/notifications')
	redirect(`/celebrations?emailed=1&sent=${result.sent}`)
}

export const sendMonthCelebrationEmailsAction = async () => {
	const result = await sendCelebrationEmails('this_month')

	if (!result.ok) {
		redirect(`/celebrations?error=email`)
	}

	revalidatePath('/celebrations')
	revalidatePath('/notifications')
	redirect(`/celebrations?emailed=1&sent=${result.sent}`)
}
