import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/logging'
import { NOTIFICATION_STATUSES, NOTIFICATION_TYPES } from '@/types/roles'
import type { NotificationStatus, NotificationType } from '@/types/roles'
import {
	emailFromStoredNotice,
	type EmailMessage,
} from '@/lib/notifications/email-templates'
import { createEmailService } from '@/server/notifications/email-service'
import { startOfLondonDay } from '@/lib/notifications/schedule'
import { parseProfiles, PROFILE_SELECT_COLUMNS } from '@/lib/validation/profile'

const notificationRowSchema = z.object({
	id: z.string().uuid(),
	member_id: z.string().uuid(),
	notification_type: z.enum(NOTIFICATION_TYPES),
	title: z.string().min(1),
	message: z.string().min(1),
	scheduled_at: z.string().min(1),
	sent_at: z.string().min(1).nullable(),
	status: z.enum(NOTIFICATION_STATUSES),
	idempotency_key: z.string().min(1),
	created_at: z.string().min(1),
})

export interface ScheduledNotification {
	memberId: string
	type: NotificationType
	title: string
	message: string
	scheduledAt: string
	idempotencyKey: string
}

const NOTIFICATION_SELECT =
	'id, member_id, notification_type, title, message, scheduled_at, sent_at, status, idempotency_key, created_at'

export const enqueueNotifications = async (items: ScheduledNotification[]) => {
	if (items.length === 0) {
		return 0
	}

	const supabase = createSupabaseAdminClient()
	const { error } = await supabase.from('notifications').upsert(
		items.map((item) => ({
			member_id: item.memberId,
			notification_type: item.type,
			title: item.title,
			message: item.message,
			scheduled_at: item.scheduledAt,
			status: 'PENDING',
			idempotency_key: item.idempotencyKey,
		})),
		{ onConflict: 'idempotency_key', ignoreDuplicates: true },
	)

	if (error) {
		logEvent({
			operation: 'notifications.enqueue',
			status: 'error',
			errorCategory: 'database',
		})
		return 0
	}

	return items.length
}

export const enqueueInAppNotices = async (items: ScheduledNotification[]) => {
	if (items.length === 0) {
		return 0
	}

	const supabase = createSupabaseAdminClient()
	const sentAt = new Date().toISOString()
	const { error } = await supabase.from('notifications').upsert(
		items.map((item) => ({
			member_id: item.memberId,
			notification_type: item.type,
			title: item.title,
			message: item.message,
			scheduled_at: item.scheduledAt,
			status: 'SENT',
			sent_at: sentAt,
			idempotency_key: item.idempotencyKey,
		})),
		{ onConflict: 'idempotency_key' },
	)

	if (error) {
		logEvent({
			operation: 'notifications.enqueueInApp',
			status: 'error',
			errorCategory: 'database',
		})
		return 0
	}

	return items.length
}

const parsePending = (value: unknown) => {
	if (!Array.isArray(value)) {
		return []
	}

	return value.flatMap((row) => {
		const parsed = notificationRowSchema.safeParse(row)
		return parsed.success ? [parsed.data] : []
	})
}

export interface SendResult {
	sent: number
	failed: number
	/** Left pending because the time budget ran out; a later run sends them. */
	deferred: number
}

export const sendDueNotifications = async (
	now = new Date(),
	filters: { types?: NotificationType[]; memberIds?: string[]; deadline?: number } = {},
): Promise<SendResult> => {
	if (filters.types?.length === 0 || filters.memberIds?.length === 0) {
		return { sent: 0, failed: 0, deferred: 0 }
	}

	const supabase = createSupabaseAdminClient()
	let query = supabase
		.from('notifications')
		.select(NOTIFICATION_SELECT)
		.eq('status', 'PENDING')
		.lte('scheduled_at', now.toISOString())

	if (filters.types) {
		query = query.in('notification_type', filters.types)
	}
	if (filters.memberIds) {
		query = query.in('member_id', filters.memberIds)
	}

	const { data, error } = await query.limit(200)

	if (error) {
		logEvent({
			operation: 'notifications.listDue',
			status: 'error',
			errorCategory: 'database',
		})
		return { sent: 0, failed: 0, deferred: 0 }
	}

	const due = parsePending(data)
	const memberIds = [...new Set(due.map((row) => row.member_id))]
	const emailsById = await loadMemberEmails(memberIds)
	const email = createEmailService()
	let sent = 0
	let failed = 0
	let deferred = 0

	try {
		for (const row of due) {
			// Stop before the function time limit so rows are never left half-sent;
			// whatever remains stays PENDING for the next run the same day.
			if (filters.deadline !== undefined && Date.now() >= filters.deadline) {
				deferred = due.length - sent - failed
				break
			}

			if (row.notification_type === 'CELEBRATION_DIGEST') {
				await markNotification(row.id, 'SENT')
				sent += 1
				continue
			}

			const to = emailsById.get(row.member_id)

			if (!to) {
				failed += 1
				await markNotification(row.id, 'FAILED')
				continue
			}

			const styled = emailFromStoredNotice(row.title, row.message)
			const result = await email.send({
				to,
				subject: styled.subject,
				text: styled.text,
				html: styled.html,
			})

			if (result.ok) {
				sent += 1
				await markNotification(row.id, 'SENT')
			} else {
				failed += 1
				await markNotification(row.id, 'FAILED')
			}
		}
	} finally {
		email.close()
	}

	return { sent, failed, deferred }
}

/**
 * Cancels time-sensitive emails that were queued on an earlier London day and
 * never went out. Sending them now would mean a birthday greeting a day late,
 * or an "in two days" reminder arriving the day before.
 */
export const cancelStaleNotifications = async (now: Date, types: NotificationType[]) => {
	if (types.length === 0) {
		return 0
	}

	const supabase = createSupabaseAdminClient()
	const { data, error } = await supabase
		.from('notifications')
		.update({ status: 'CANCELLED' })
		.eq('status', 'PENDING')
		.in('notification_type', types)
		.lt('scheduled_at', startOfLondonDay(now).toISOString())
		.select('id')

	if (error) {
		logEvent({
			operation: 'notifications.cancelStale',
			status: 'error',
			errorCategory: 'database',
		})
		return 0
	}

	return Array.isArray(data) ? data.length : 0
}

const loadMemberEmails = async (ids: string[]) => {
	const emails = new Map<string, string>()
	if (ids.length === 0) {
		return emails
	}

	const supabase = createSupabaseAdminClient()
	const { data, error } = await supabase
		.from('profiles')
		.select(PROFILE_SELECT_COLUMNS)
		.in('id', ids)

	if (error) {
		logEvent({
			operation: 'notifications.loadEmails',
			status: 'error',
			errorCategory: 'database',
		})
		return emails
	}

	for (const profile of parseProfiles(data)) {
		emails.set(profile.id, profile.email)
	}

	return emails
}

const markNotification = async (id: string, status: NotificationStatus) => {
	const supabase = createSupabaseAdminClient()
	const { error } = await supabase
		.from('notifications')
		.update({
			status,
			sent_at: status === 'SENT' ? new Date().toISOString() : null,
		})
		.eq('id', id)

	if (error) {
		logEvent({
			operation: 'notifications.mark',
			status: 'error',
			errorCategory: 'database',
		})
	}
}

export const sendDirectEmail = async (message: EmailMessage) => {
	if (!message.to) {
		return { ok: false as const }
	}

	const email = createEmailService()
	try {
		return await email.send(message)
	} finally {
		email.close()
	}
}
