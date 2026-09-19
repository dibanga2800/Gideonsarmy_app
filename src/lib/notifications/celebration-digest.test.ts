import { describe, expect, it } from 'vitest'
import { monthCelebrationsFromSources } from '@/lib/celebrations/month-list'
import {
	buildMonthCelebrationDigestsForRecipient,
	monthCelebrationDigestKey,
} from './celebration-digest'

const brother = {
	id: '11111111-1111-4111-8111-111111111111',
	first_name: 'David',
	last_name: 'Ibanga',
	birth_month: 9,
	birth_day: 16,
	anniversary_month: 10,
	anniversary_day: 8,
	spouse_name: 'Joy',
}

describe('month celebration digest', () => {
	it('creates in-app notices from profile birthday and anniversary months', () => {
		const now = new Date('2026-09-16T12:00:00.000Z')
		const current = monthCelebrationsFromSources([brother], 2026, 9, now)
		const upcoming = monthCelebrationsFromSources([brother], 2026, 10, now)
		const recipientId = '33333333-3333-4333-8333-333333333333'
		const notices = buildMonthCelebrationDigestsForRecipient(
			recipientId,
			current,
			upcoming,
			now,
		)

		expect(notices).toHaveLength(2)
		expect(notices[0]?.memberId).toBe(recipientId)
		expect(notices[0]).toMatchObject({
			type: 'CELEBRATION_DIGEST',
			title: 'Celebrations in September 2026',
			idempotencyKey: monthCelebrationDigestKey(recipientId, 2026, 9, 'current'),
		})
		expect(notices[0]?.message).toContain('David Ibanga — 16 September')
		expect(notices[1]).toMatchObject({
			title: 'Coming in October 2026',
			idempotencyKey: monthCelebrationDigestKey(recipientId, 2026, 10, 'upcoming'),
		})
		expect(notices[1]?.message).toContain('David Ibanga and Joy — 8 October')
	})

	it('omits an empty month', () => {
		const now = new Date('2026-09-16T12:00:00.000Z')
		const empty = monthCelebrationsFromSources([], 2026, 11, now)
		const current = monthCelebrationsFromSources([brother], 2026, 9, now)

		expect(
			buildMonthCelebrationDigestsForRecipient('33333333-3333-4333-8333-333333333333', current, empty, now),
		).toHaveLength(1)
	})
})
