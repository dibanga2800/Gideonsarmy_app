import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logging'
import {
	DEFAULT_NOTICE_PAGE_SIZE,
	normalisePage,
	normalisePageSize,
	pageOffset,
	totalPagesFor,
} from '@/lib/list-pagination'
import { NOTIFICATION_STATUSES, NOTIFICATION_TYPES } from '@/types/roles'

const notificationRowSchema = z.object({
	id: z.string().uuid(),
	member_id: z.string().uuid(),
	notification_type: z.enum(NOTIFICATION_TYPES),
	title: z.string().min(1),
	message: z.string().min(1),
	scheduled_at: z.string().min(1),
	sent_at: z.string().min(1).nullable(),
	read_at: z.string().min(1).nullable(),
	status: z.enum(NOTIFICATION_STATUSES),
	idempotency_key: z.string().min(1),
	created_at: z.string().min(1),
})

export type MemberNotification = z.infer<typeof notificationRowSchema>

const NOTIFICATION_SELECT =
	'id, member_id, notification_type, title, message, scheduled_at, sent_at, read_at, status, idempotency_key, created_at'

const parseRows = (value: unknown) => {
	if (!Array.isArray(value)) {
		return []
	}

	return value.flatMap((row) => {
		const parsed = notificationRowSchema.safeParse(row)
		return parsed.success ? [parsed.data] : []
	})
}

const IN_APP_TYPES = [
	'BIRTHDAY_CELEBRANT',
	'BIRTHDAY_FELLOWSHIP',
	'ANNIVERSARY_CELEBRANT',
	'ANNIVERSARY_FELLOWSHIP',
	'EVENT_REMINDER',
	'CELEBRATION_DIGEST',
] as const

export const listOwnNotifications = async (memberId: string): Promise<MemberNotification[]> => {
	const page = await listOwnNotificationsPage({ memberId, page: 1, pageSize: 50 })
	return page.items
}

export const listOwnNotificationsPage = async (input: {
	memberId: string
	page?: number
	pageSize?: number
}): Promise<{
	items: MemberNotification[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}> => {
	const pageSize = normalisePageSize(input.pageSize ?? DEFAULT_NOTICE_PAGE_SIZE, DEFAULT_NOTICE_PAGE_SIZE)
	const requestedPage = Math.max(1, Math.floor(input.page ?? 1) || 1)
	const supabase = createSupabaseServerClient()

	const countQuery = supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('member_id', input.memberId)
		.in('notification_type', [...IN_APP_TYPES])
		.neq('status', 'CANCELLED')
		.lte('scheduled_at', new Date().toISOString())

	const { count, error: countError } = await countQuery
	if (countError) {
		logEvent({
			operation: 'notifications.countOwn',
			status: 'error',
			errorCategory: 'database',
		})
		return {
			items: [],
			total: 0,
			page: 1,
			pageSize,
			totalPages: 1,
		}
	}

	const total = count ?? 0
	const totalPages = totalPagesFor(total, pageSize)
	const page = normalisePage(requestedPage, totalPages)
	const from = pageOffset(page, pageSize)
	const to = from + pageSize - 1

	const { data, error } = await supabase
		.from('notifications')
		.select(NOTIFICATION_SELECT)
		.eq('member_id', input.memberId)
		.in('notification_type', [...IN_APP_TYPES])
		.neq('status', 'CANCELLED')
		.lte('scheduled_at', new Date().toISOString())
		.order('scheduled_at', { ascending: false })
		.range(from, to)

	if (error) {
		logEvent({
			operation: 'notifications.listOwn',
			status: 'error',
			errorCategory: 'database',
		})
		return {
			items: [],
			total,
			page,
			pageSize,
			totalPages,
		}
	}

	return {
		items: parseRows(data),
		total,
		page,
		pageSize,
		totalPages,
	}
}

export const countOwnUnreadNotifications = async (memberId: string): Promise<number> => {
	const supabase = createSupabaseServerClient()
	const { count, error } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('member_id', memberId)
		.in('notification_type', [...IN_APP_TYPES])
		.neq('status', 'CANCELLED')
		.is('read_at', null)
		.lte('scheduled_at', new Date().toISOString())

	if (error || count === null) {
		if (error) {
			logEvent({
				operation: 'notifications.countUnread',
				status: 'error',
				errorCategory: 'database',
			})
		}

		return 0
	}

	return count
}

export const markOwnNotificationRead = async (
	memberId: string,
	notificationId: string,
): Promise<boolean> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('id', notificationId)
		.eq('member_id', memberId)
		.is('read_at', null)
		.select('id')
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'notifications.markRead',
			status: 'error',
			errorCategory: 'database',
		})
		return false
	}

	return Boolean(data)
}
