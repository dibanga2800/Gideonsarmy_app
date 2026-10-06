import { canAccessAdmin } from '@/lib/auth/access'
import { logEvent } from '@/lib/logging'
import {
	buildCelebrationNotices,
	enqueueAndSend,
	type CelebrationNoticeScope,
} from '@/server/jobs/run-scheduled-jobs'
import { getEmailDeliveryStatus } from '@/server/notifications/email-service'
import { listActiveMembersForJobs } from '@/server/repositories/job-repository'
import { getCurrentSession } from '@/server/services/auth-service'

export const getAdminEmailStatus = async () => {
	const session = await getCurrentSession()
	if (!canAccessAdmin(session.access)) {
		return null
	}

	return getEmailDeliveryStatus()
}

export const sendCelebrationEmails = async (
	scope: CelebrationNoticeScope,
): Promise<{ ok: true; queued: number; sent: number; failed: number } | { ok: false; message: string }> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		logEvent({
			operation: 'notifications.celebrations',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return { ok: false, message: 'You do not have permission to send celebration emails.' }
	}

	const delivery = getEmailDeliveryStatus()
	if (!delivery.ready) {
		return {
			ok: false,
			message: delivery.detail,
		}
	}

	const members = await listActiveMembersForJobs()
	const items = buildCelebrationNotices(members, { scope })

	if (items.length === 0) {
		return {
			ok: false,
			message:
				scope === 'this_month'
					? 'No active members have a birthday or wedding anniversary in this month.'
					: 'No birthdays or anniversaries fall today.',
		}
	}

	const result = await enqueueAndSend(items)

	logEvent({
		operation: 'notifications.celebrations',
		status: result.failed > 0 ? 'error' : 'ok',
		errorCategory: result.failed > 0 ? 'email' : undefined,
	})

	return {
		ok: true,
		queued: result.enqueued,
		sent: result.sent,
		failed: result.failed,
	}
}
