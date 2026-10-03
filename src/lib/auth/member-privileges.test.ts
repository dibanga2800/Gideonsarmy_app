import { describe, expect, it } from 'vitest'
import { MEMBER_PRIVILEGE_ERRORS, canChangeMemberPrivileges } from './member-privileges'

const base = {
	actorId: 'admin-1',
	targetId: 'member-1',
	actorIsAdmin: true,
	currentRole: 'MEMBER' as const,
	currentStatus: 'PENDING' as const,
	nextRole: 'MEMBER' as const,
	nextStatus: 'ACTIVE' as const,
}

describe('canChangeMemberPrivileges', () => {
	it('allows an admin to approve another member', () => {
		expect(canChangeMemberPrivileges(base)).toEqual({ allowed: true })
	})

	it('blocks a member from changing another member', () => {
		expect(
			canChangeMemberPrivileges({
				...base,
				actorId: 'member-2',
				actorIsAdmin: false,
			}),
		).toEqual({ allowed: false, message: MEMBER_PRIVILEGE_ERRORS.notAdmin })
	})

	it('blocks an admin from changing their own role', () => {
		expect(
			canChangeMemberPrivileges({
				...base,
				actorId: 'admin-1',
				targetId: 'admin-1',
				currentRole: 'ADMIN',
				currentStatus: 'ACTIVE',
				nextRole: 'MEMBER',
				nextStatus: 'ACTIVE',
			}),
		).toEqual({ allowed: false, message: MEMBER_PRIVILEGE_ERRORS.ownRole })
	})

	it('blocks an admin from changing their own membership status', () => {
		expect(
			canChangeMemberPrivileges({
				...base,
				actorId: 'admin-1',
				targetId: 'admin-1',
				currentRole: 'ADMIN',
				currentStatus: 'ACTIVE',
				nextRole: 'ADMIN',
				nextStatus: 'INACTIVE',
			}),
		).toEqual({ allowed: false, message: MEMBER_PRIVILEGE_ERRORS.ownStatus })
	})

	it('requires an administrator to become a member before becoming inactive', () => {
		expect(
			canChangeMemberPrivileges({
				...base,
				currentRole: 'ADMIN',
				currentStatus: 'ACTIVE',
				nextRole: 'ADMIN',
				nextStatus: 'INACTIVE',
			}),
		).toEqual({ allowed: false, message: MEMBER_PRIVILEGE_ERRORS.adminMustBecomeMember })
	})

	it('allows an administrator to become a member before becoming inactive', () => {
		expect(
			canChangeMemberPrivileges({
				...base,
				currentRole: 'ADMIN',
				currentStatus: 'ACTIVE',
				nextRole: 'MEMBER',
				nextStatus: 'INACTIVE',
			}),
		).toEqual({ allowed: true })
	})
})
