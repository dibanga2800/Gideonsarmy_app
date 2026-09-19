import type { MemberRole, MembershipStatus } from '@/types/roles'

export const MEMBER_PRIVILEGE_ERRORS = {
	notAdmin: 'Only an administrator can change membership or role.',
	ownRole: 'You cannot change your own role.',
	ownStatus: 'You cannot change your own membership status.',
} as const

export const canChangeMemberPrivileges = (input: {
	actorId: string
	targetId: string
	actorIsAdmin: boolean
	currentRole: MemberRole
	currentStatus: MembershipStatus
	nextRole: MemberRole
	nextStatus: MembershipStatus
}) => {
	if (!input.actorIsAdmin) {
		return { allowed: false as const, message: MEMBER_PRIVILEGE_ERRORS.notAdmin }
	}

	if (input.actorId === input.targetId && input.nextRole !== input.currentRole) {
		return { allowed: false as const, message: MEMBER_PRIVILEGE_ERRORS.ownRole }
	}

	if (input.actorId === input.targetId && input.nextStatus !== input.currentStatus) {
		return { allowed: false as const, message: MEMBER_PRIVILEGE_ERRORS.ownStatus }
	}

	return { allowed: true as const }
}
