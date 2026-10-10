import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@/types/database'
import type { ScheduledNotification } from '@/server/notifications/notification-service'

const notificationMocks = vi.hoisted(() => ({
	cancelStaleNotifications: vi.fn(async () => 0),
	enqueueNotifications: vi.fn(async (items: ScheduledNotification[]) => items.length),
	enqueueInAppNotices: vi.fn(async () => 0),
	sendDueNotifications: vi.fn(async () => ({ sent: 0, failed: 0, deferred: 0 })),
}))

const repositoryMocks = vi.hoisted(() => ({
	listActiveMembersForJobs: vi.fn(async (): Promise<Profile[]> => []),
	listOutstandingDuesForJobs: vi.fn(async () => []),
	listStoredEventsForJobs: vi.fn(async () => []),
}))

vi.mock('@/server/notifications/notification-service', () => notificationMocks)
vi.mock('@/server/repositories/job-repository', () => repositoryMocks)
vi.mock('@/lib/logging', () => ({ logEvent: vi.fn() }))

const { runDailyJobs, SEND_BUDGET_MS } = await import('./run-scheduled-jobs')

const member = (id: string, input: { birthMonth?: number; birthDay?: number } = {}): Profile => ({
	id,
	email: `${id}@example.com`,
	first_name: 'Samuel',
	last_name: 'Adeyemi',
	phone: null,
	department: null,
	occupation: null,
	address: null,
	birth_month: input.birthMonth ?? null,
	birth_day: input.birthDay ?? null,
	wedding_anniversary: null,
	spouse_name: null,
	photo_storage_path: null,
	anniversary_photo_storage_path: null,
	role: 'MEMBER',
	membership_status: 'ACTIVE',
	joined_at: null,
	created_at: '2026-01-01T00:00:00.000Z',
	updated_at: '2026-01-01T00:00:00.000Z',
})

const celebrantId = '11111111-1111-4111-8111-111111111111'
const brotherId = '22222222-2222-4222-8222-222222222222'

const queuedItems = () =>
	notificationMocks.enqueueNotifications.mock.calls.flatMap(([items]) => items)

describe('runDailyJobs', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		repositoryMocks.listActiveMembersForJobs.mockResolvedValue([
			member(celebrantId, { birthMonth: 10, birthDay: 8 }),
			member(brotherId),
		])
	})

	it('queues "today" reminders for the prayer meeting on the morning of the meeting', async () => {
		// Thursday 8 October 2026 is the second Thursday; morning run lands 07:40 BST
		await runDailyJobs('morning', new Date('2026-10-08T06:40:00.000Z'))

		const keys = queuedItems()
			.filter((item) => item.type === 'EVENT_REMINDER')
			.map((item) => item.idempotencyKey)

		expect(keys).toContain(`event:prayer-2026-10-08T19:00:00.000Z:day:${brotherId}`)
		expect(keys.some((key) => key.includes(':2h:'))).toBe(false)
	})

	it('sends a morning gathering its "today" reminder, which a two-hour rule never could', async () => {
		repositoryMocks.listStoredEventsForJobs.mockResolvedValueOnce([
			{
				id: '33333333-3333-4333-8333-333333333333',
				title: "Men's breakfast",
				description: null,
				event_type: 'FELLOWSHIP',
				// 10:30 BST
				start_at: '2026-10-24T09:30:00.000Z',
				end_at: null,
				is_recurring: false,
				created_at: '2026-10-01T00:00:00.000Z',
				updated_at: '2026-10-01T00:00:00.000Z',
			},
		] as never)

		await runDailyJobs('morning', new Date('2026-10-24T06:20:00.000Z'))

		expect(
			queuedItems().some(
				(item) => item.idempotencyKey === `event:33333333-3333-4333-8333-333333333333:day:${brotherId}`,
			),
		).toBe(true)
	})

	it('queues birthday emails from 6am London time, wherever the run lands in its hour', async () => {
		// 06:55 UTC in October is 07:55 BST
		const result = await runDailyJobs('morning', new Date('2026-10-08T06:55:00.000Z'))

		expect(result.celebrationsOpen).toBe(true)
		expect(queuedItems().filter((item) => item.type === 'BIRTHDAY_CELEBRANT')).toMatchObject([
			{ memberId: celebrantId, idempotencyKey: `birthday:${celebrantId}:2026` },
		])
		expect(queuedItems().filter((item) => item.type === 'BIRTHDAY_FELLOWSHIP')).toMatchObject([
			{ memberId: brotherId },
		])
	})

	it('holds birthday emails before 6am London time', async () => {
		// 04:30 UTC is 05:30 BST
		const result = await runDailyJobs('morning', new Date('2026-10-08T04:30:00.000Z'))

		expect(result.celebrationsOpen).toBe(false)
		expect(queuedItems().some((item) => item.type === 'BIRTHDAY_CELEBRANT')).toBe(false)
	})

	it('lets the evening run catch up a celebration the morning run missed', async () => {
		await runDailyJobs('evening', new Date('2026-10-08T18:10:00.000Z'))

		expect(queuedItems().some((item) => item.type === 'BIRTHDAY_CELEBRANT')).toBe(true)
	})

	it('cancels stale same-day emails before sending, and sends within the time budget', async () => {
		const now = new Date('2026-10-08T06:40:00.000Z')
		const before = Date.now()
		await runDailyJobs('morning', now)

		expect(notificationMocks.cancelStaleNotifications).toHaveBeenCalledWith(
			now,
			expect.arrayContaining(['BIRTHDAY_CELEBRANT', 'EVENT_REMINDER', 'DUES_REMINDER']),
		)
		const [, options] = notificationMocks.sendDueNotifications.mock.calls[0] as unknown as [
			Date,
			{ deadline: number; types: string[] },
		]
		expect(options.deadline).toBeGreaterThanOrEqual(before + SEND_BUDGET_MS)
		expect(options.deadline).toBeLessThanOrEqual(Date.now() + SEND_BUDGET_MS)
		expect(options.types).toEqual(expect.arrayContaining(['BIRTHDAY_FELLOWSHIP', 'EVENT_REMINDER']))
	})
})
