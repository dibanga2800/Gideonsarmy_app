import { canAccessMemberApp } from '@/lib/auth/access'
import { getCurrentSession } from '@/server/services/auth-service'
import { getCelebrationBoard } from '@/server/services/celebration-service'
import { buildMonthCelebrationDigestsForRecipient } from '@/lib/notifications/celebration-digest'
import { enqueueInAppNotices } from '@/server/notifications/notification-service'
import {
	countOwnUnreadNotifications,
	listOwnNotificationsPage,
	markOwnNotificationRead,
} from '@/server/repositories/notification-repository'
import { DEFAULT_NOTICE_PAGE_SIZE } from '@/lib/list-pagination'

const ensureOwnCelebrationNotices = async (memberId: string) => {
	const board = await getCelebrationBoard()
	if (!board) {
		return
	}

	await enqueueInAppNotices(
		buildMonthCelebrationDigestsForRecipient(memberId, board.current, board.upcoming),
	)
}

export const getOwnNotices = async (input?: { page?: number; pageSize?: number }) => {
	const session = await getCurrentSession()
	if (!canAccessMemberApp(session.access) || !session.userId) {
		return null
	}

	await ensureOwnCelebrationNotices(session.userId)
	return listOwnNotificationsPage({
		memberId: session.userId,
		page: input?.page ?? 1,
		pageSize: input?.pageSize ?? DEFAULT_NOTICE_PAGE_SIZE,
	})
}

export const getOwnUnreadNoticeCount = async () => {
	const session = await getCurrentSession()
	if (!canAccessMemberApp(session.access) || !session.userId) {
		return 0
	}

	// Do not enqueue celebration digests here — the app shell calls this on every
	// navigation. Digests are ensured when the member opens Notices.
	return countOwnUnreadNotifications(session.userId)
}

export const markNoticeRead = async (notificationId: string) => {
	const session = await getCurrentSession()
	if (!canAccessMemberApp(session.access) || !session.userId) {
		return false
	}

	return markOwnNotificationRead(session.userId, notificationId)
}
