import type { Profile } from '@/types/database'

export type AccessDecision =
	| { status: 'unauthenticated' }
	| { status: 'pending' }
	| { status: 'inactive' }
	| { status: 'member'; isAdmin: boolean }

export const resolveAccess = (
	userId: string | null,
	profile: Profile | null,
): AccessDecision => {
	if (!userId) {
		return { status: 'unauthenticated' }
	}

	if (!profile || profile.membership_status === 'PENDING') {
		return { status: 'pending' }
	}

	if (profile.membership_status !== 'ACTIVE') {
		return { status: 'inactive' }
	}

	return {
		status: 'member',
		isAdmin: profile.role === 'ADMIN',
	}
}

export const canAccessMemberApp = (access: AccessDecision) => access.status === 'member'

export const canCompleteOwnProfile = (access: AccessDecision) =>
	access.status === 'member' || access.status === 'pending'

export const canAccessAdmin = (access: AccessDecision) =>
	access.status === 'member' && access.isAdmin

export const getPostAuthPath = (access: AccessDecision) => {
	if (access.status === 'member') {
		return '/dashboard'
	}

	if (access.status === 'pending' || access.status === 'inactive') {
		return '/pending'
	}

	return '/login'
}
