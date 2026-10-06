import { describe, expect, it } from 'vitest'
import type { Profile } from '@/types/database'
import { buildCelebrationNotices } from './run-scheduled-jobs'

const activeMember = (
	id: string,
	input: {
		birthMonth?: number | null
		birthDay?: number | null
		weddingAnniversary?: string | null
	},
): Profile => ({
	id,
	email: `${id}@example.com`,
	first_name: 'David',
	last_name: 'Umeh',
	phone: null,
	department: null,
	occupation: null,
	address: null,
	birth_month: input.birthMonth ?? null,
	birth_day: input.birthDay ?? null,
	wedding_anniversary: input.weddingAnniversary ?? null,
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

describe('buildCelebrationNotices', () => {
	it('sends a special message to the celebrant and notifies every other member on the day', () => {
		const members = [
			activeMember(celebrantId, {
				birthMonth: 10,
				birthDay: 6,
				weddingAnniversary: '2010-10-06',
			}),
			activeMember(brotherId, {}),
		]

		const notices = buildCelebrationNotices(members, {
			now: new Date('2026-10-06T05:00:00.000Z'),
		})

		expect(notices).toHaveLength(4)
		expect(
			notices.filter((notice) => notice.type === 'BIRTHDAY_CELEBRANT'),
		).toMatchObject([{ memberId: celebrantId }])
		expect(
			notices.filter((notice) => notice.type === 'ANNIVERSARY_CELEBRANT'),
		).toMatchObject([{ memberId: celebrantId }])
		expect(
			notices.filter((notice) => notice.type === 'BIRTHDAY_FELLOWSHIP'),
		).toMatchObject([{ memberId: brotherId }])
		expect(
			notices.filter((notice) => notice.type === 'ANNIVERSARY_FELLOWSHIP'),
		).toMatchObject([{ memberId: brotherId }])
		expect(
			notices.some(
				(notice) =>
					(notice.type === 'BIRTHDAY_FELLOWSHIP'
						|| notice.type === 'ANNIVERSARY_FELLOWSHIP')
					&& notice.memberId === celebrantId,
			),
		).toBe(false)
	})

	it('sends the seven-day advance greeting only to the celebrant', () => {
		const members = [
			activeMember(celebrantId, {
				birthMonth: 10,
				birthDay: 6,
				weddingAnniversary: '2010-10-06',
			}),
			activeMember(brotherId, {}),
		]

		const notices = buildCelebrationNotices(members, {
			now: new Date('2026-09-29T05:00:00.000Z'),
		})

		expect(notices).toHaveLength(2)
		expect(notices.map((notice) => notice.memberId)).toEqual([
			celebrantId,
			celebrantId,
		])
		expect(notices.every((notice) => notice.idempotencyKey.endsWith(':week'))).toBe(
			true,
		)
	})
})
