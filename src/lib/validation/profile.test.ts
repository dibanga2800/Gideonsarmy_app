import { describe, expect, it } from 'vitest'
import { parseProfile, profileSchema } from './profile'

const validProfile = {
	id: '11111111-1111-1111-1111-111111111111',
	email: 'member@example.com',
	first_name: 'Test',
	last_name: 'Member',
	phone: null,
	department: null,
	occupation: null,
	address: null,
	birth_month: null,
	birth_day: null,
	wedding_anniversary: null,
	spouse_name: null,
	photo_storage_path: null,
	role: 'MEMBER',
	membership_status: 'PENDING',
	joined_at: null,
	created_at: '2026-01-01T00:00:00.000Z',
	updated_at: '2026-01-01T00:00:00.000Z',
}

describe('parseProfile', () => {
	it('accepts a complete profile', () => {
		expect(parseProfile(validProfile)).toEqual(validProfile)
	})

	it('returns null for a missing row', () => {
		expect(parseProfile(null)).toBeNull()
		expect(parseProfile(undefined)).toBeNull()
	})

	it('rejects an invalid role instead of trusting the payload', () => {
		expect(parseProfile({ ...validProfile, role: 'SUPERADMIN' })).toBeNull()
	})

	it('rejects a birthday that includes an impossible day', () => {
		expect(
			parseProfile({ ...validProfile, birth_month: 4, birth_day: 31 }),
		).toBeNull()
	})

	it('rejects a missing email', () => {
		expect(profileSchema.safeParse({ ...validProfile, email: '' }).success).toBe(
			false,
		)
	})
})
