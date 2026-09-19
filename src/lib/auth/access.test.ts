import { describe, expect, it } from 'vitest'
import type { Profile } from '@/types/database'
import {
	canAccessAdmin,
	canAccessMemberApp,
	canCompleteOwnProfile,
	getPostAuthPath,
	resolveAccess,
} from './access'

const profile = (
	overrides: Partial<Profile> = {},
): Profile => ({
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
	role: 'MEMBER',
	membership_status: 'PENDING',
	joined_at: null,
	created_at: '2026-01-01T00:00:00.000Z',
	updated_at: '2026-01-01T00:00:00.000Z',
	...overrides,
})

describe('resolveAccess', () => {
	it('does not treat a Google login as membership', () => {
		const access = resolveAccess('user-1', profile())
		expect(access.status).toBe('pending')
		expect(canAccessMemberApp(access)).toBe(false)
		expect(canCompleteOwnProfile(access)).toBe(true)
		expect(getPostAuthPath(access)).toBe('/pending')
	})

	it('blocks inactive members from the member app', () => {
		const access = resolveAccess(
			'user-1',
			profile({ membership_status: 'INACTIVE' }),
		)
		expect(access.status).toBe('inactive')
		expect(canAccessMemberApp(access)).toBe(false)
		expect(canCompleteOwnProfile(access)).toBe(false)
	})

	it('allows approved members and not admin tools', () => {
		const access = resolveAccess(
			'user-1',
			profile({ membership_status: 'ACTIVE' }),
		)
		expect(canAccessMemberApp(access)).toBe(true)
		expect(canAccessAdmin(access)).toBe(false)
		expect(getPostAuthPath(access)).toBe('/dashboard')
	})

	it('allows approved admins', () => {
		const access = resolveAccess(
			'user-1',
			profile({ membership_status: 'ACTIVE', role: 'ADMIN' }),
		)
		expect(canAccessAdmin(access)).toBe(true)
	})

	it('treats missing profile as pending, not as a member', () => {
		const access = resolveAccess('user-1', null)
		expect(access.status).toBe('pending')
		expect(canAccessMemberApp(access)).toBe(false)
	})

	it('requires authentication', () => {
		const access = resolveAccess(null, profile({ membership_status: 'ACTIVE' }))
		expect(access.status).toBe('unauthenticated')
		expect(getPostAuthPath(access)).toBe('/login')
	})
})
