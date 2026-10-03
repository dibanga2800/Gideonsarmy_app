import { canAccessAdmin, canCompleteOwnProfile } from '@/lib/auth/access'
import { canChangeMemberPrivileges } from '@/lib/auth/member-privileges'
import { logEvent } from '@/lib/logging'
import type { MembershipStatus } from '@/types/roles'
import type { Profile } from '@/types/database'
import type {
	AdminChangePassword,
	AdminCreateMember,
	AdminInviteMember,
	OwnProfileUpdate,
} from '@/lib/validation/member'
import { getCurrentSession } from '@/server/services/auth-service'
import {
	findProfileById,
	listProfiles,
	listProfilesPage,
	updateMemberDirectoryRecord,
	updateMemberPrivilegesRecord,
	updateOwnPhotoPath,
	updateOwnProfileRecord,
} from '@/server/repositories/profile-repository'
import { createMemberInviteRecord, findOpenInviteByEmail, listOpenMemberInvites } from '@/server/repositories/invite-repository'
import { memberInviteEmail } from '@/lib/notifications/email-templates'
import { sendDirectEmail } from '@/server/notifications/notification-service'
import { memberDisplayName } from '@/lib/members/display'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { DUES_TRACKING_START_MONTH, duesStartMonthFromJoinedAt } from '@/lib/dates/dues-year'
import { DEFAULT_MEMBER_PAGE_SIZE } from '@/lib/members/pagination'
import { compressPortrait } from '@/lib/members/compress-portrait'
import { isOwnMemberPhotoPath, memberPhotoStoragePath } from '@/lib/members/portrait'
import {
	createMemberPhotoSignedUrl,
	deleteMemberPhotoObject,
	uploadMemberPhotoObject,
} from '@/server/repositories/member-photo-repository'

export type MemberActionResult =
	| { ok: true; profile: Profile }
	| { ok: false; message: string }

const safeFailure = (message: string): MemberActionResult => ({
	ok: false,
	message,
})

export const getOwnProfile = async () => {
	const session = await getCurrentSession()

	if (!canCompleteOwnProfile(session.access) || !session.userId || !session.profile) {
		return null
	}

	return session.profile
}

export const updateOwnProfile = async (update: OwnProfileUpdate): Promise<MemberActionResult> => {
	const session = await getCurrentSession()

	if (!canCompleteOwnProfile(session.access) || !session.userId) {
		return safeFailure('You need to be signed in to update your profile.')
	}

	const profile = await updateOwnProfileRecord(session.userId, update)

	if (!profile) {
		return safeFailure('Your profile could not be saved. Try again.')
	}

	return { ok: true, profile }
}

export const getOwnPortraitUrl = async () => {
	const profile = await getOwnProfile()
	if (!profile?.photo_storage_path) {
		return null
	}

	if (!isOwnMemberPhotoPath(profile.id, profile.photo_storage_path)) {
		return null
	}

	return createMemberPhotoSignedUrl(profile.photo_storage_path)
}

export const saveOwnPortrait = async (file: File): Promise<MemberActionResult> => {
	const session = await getCurrentSession()

	if (!canCompleteOwnProfile(session.access) || !session.userId) {
		return safeFailure('You need to be signed in to update your portrait.')
	}

	const intake = new Uint8Array(await file.arrayBuffer())
	const compressed = await compressPortrait(intake)

	if (!compressed) {
		return safeFailure('Use a JPEG, PNG, or WebP photo. It could not be reduced under 1 MB.')
	}

	const storagePath = memberPhotoStoragePath(session.userId)
	const uploaded = await uploadMemberPhotoObject({
		memberId: session.userId,
		storagePath,
		bytes: compressed.bytes,
	})

	if (!uploaded) {
		return safeFailure('Your portrait could not be saved. Try again.')
	}

	const profile = await updateOwnPhotoPath(session.userId, storagePath)

	if (!profile) {
		await deleteMemberPhotoObject(session.userId, storagePath)
		return safeFailure('Your portrait could not be saved. Try again.')
	}

	const previous = session.profile?.photo_storage_path
	if (previous && previous !== storagePath && isOwnMemberPhotoPath(session.userId, previous)) {
		await deleteMemberPhotoObject(session.userId, previous)
	}

	return { ok: true, profile }
}

export const removeOwnPortrait = async (): Promise<MemberActionResult> => {
	const session = await getCurrentSession()

	if (!canCompleteOwnProfile(session.access) || !session.userId || !session.profile) {
		return safeFailure('You need to be signed in to update your portrait.')
	}

	const previous = session.profile.photo_storage_path
	const profile = await updateOwnPhotoPath(session.userId, null)

	if (!profile) {
		return safeFailure('Your portrait could not be removed. Try again.')
	}

	if (previous && isOwnMemberPhotoPath(session.userId, previous)) {
		await deleteMemberPhotoObject(session.userId, previous)
	}

	return { ok: true, profile }
}

export const listMembersForAdmin = async (status?: MembershipStatus) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	return listProfiles(status)
}

export const listMembersPageForAdmin = async (input: {
	status?: MembershipStatus
	page?: number
	pageSize?: number
}) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	return listProfilesPage({
		status: input.status,
		page: input.page,
		pageSize: input.pageSize ?? DEFAULT_MEMBER_PAGE_SIZE,
	})
}

export const getMemberForAdmin = async (memberId: string) => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access)) {
		return null
	}

	return findProfileById(memberId)
}

export const changeMemberPassword = async (
	input: AdminChangePassword,
): Promise<{ ok: true } | { ok: false; code: 'denied' | 'not_found' | 'self' | 'auth' }> => {
	const session = await getCurrentSession()

	if (!session.userId || !canAccessAdmin(session.access)) {
		return { ok: false, code: 'denied' }
	}

	if (session.userId === input.memberId) {
		return { ok: false, code: 'self' }
	}

	const member = await findProfileById(input.memberId)
	if (!member) {
		return { ok: false, code: 'not_found' }
	}

	const admin = createSupabaseAdminClient()
	const { error } = await admin.auth.admin.updateUserById(input.memberId, {
		password: input.password,
	})

	if (error) {
		logEvent({
			operation: 'members.changePassword',
			status: 'error',
			errorCategory: 'auth',
			errorCode: error.code,
		})
		return { ok: false, code: 'auth' }
	}

	await admin.auth.admin.signOut(input.memberId, 'global')
	await admin.from('audit_logs').insert({
		actor_id: session.userId,
		action: 'member.change_password',
		entity_type: 'profiles',
		entity_id: input.memberId,
		old_data: null,
		new_data: { email_domain: member.email.split('@')[1] ?? null },
	})

	return { ok: true }
}

export const deleteMemberAccount = async (
	memberId: string,
): Promise<
	| { ok: true }
	| {
			ok: false
			code:
				| 'denied'
				| 'not_found'
				| 'self'
				| 'active'
				| 'dues_history'
				| 'payment_history'
				| 'financial_history'
				| 'auth'
		}
> => {
	const session = await getCurrentSession()

	if (!session.userId || !canAccessAdmin(session.access)) {
		return { ok: false, code: 'denied' }
	}

	if (session.userId === memberId) {
		return { ok: false, code: 'self' }
	}

	const member = await findProfileById(memberId)
	if (!member) {
		return { ok: false, code: 'not_found' }
	}

	if (member.membership_status !== 'INACTIVE') {
		return { ok: false, code: 'active' }
	}

	const admin = createSupabaseAdminClient()
	const [{ count: duesCount, error: duesError }, { count: paymentCount, error: paymentError }] =
		await Promise.all([
			admin.from('dues').select('id', { count: 'exact', head: true }).eq('member_id', memberId),
			admin
				.from('payment_submissions')
				.select('id', { count: 'exact', head: true })
				.eq('member_id', memberId),
		])

	if (duesError || paymentError) {
		return { ok: false, code: 'financial_history' }
	}

	if ((paymentCount ?? 0) > 0) {
		return { ok: false, code: 'payment_history' }
	}

	if ((duesCount ?? 0) > 0) {
		return { ok: false, code: 'dues_history' }
	}

	const { error } = await admin.auth.admin.deleteUser(memberId)
	if (error) {
		logEvent({
			operation: 'members.deleteAccount',
			status: 'error',
			errorCategory: 'auth',
			errorCode: error.code,
		})
		return { ok: false, code: 'auth' }
	}

	await admin.from('audit_logs').insert({
		actor_id: session.userId,
		action: 'member.delete_account',
		entity_type: 'profiles',
		entity_id: memberId,
		old_data: {
			email_domain: member.email.split('@')[1] ?? null,
			membership_status: member.membership_status,
		},
		new_data: null,
	})

	return { ok: true }
}

export const approveMember = async (memberId: string): Promise<MemberActionResult> => {
	const session = await getCurrentSession()

	if (!session.userId || !session.profile || !canAccessAdmin(session.access)) {
		logEvent({
			operation: 'members.approve',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to approve members.')
	}

	const current = await findProfileById(memberId)

	if (!current) {
		return safeFailure('That member could not be found.')
	}

	if (session.userId === current.id) {
		return safeFailure('You cannot approve your own membership.')
	}

	if (current.membership_status === 'ACTIVE') {
		return { ok: true, profile: current }
	}

	const decision = canChangeMemberPrivileges({
		actorId: session.userId,
		targetId: current.id,
		actorIsAdmin: session.access.status === 'member' && session.access.isAdmin,
		currentRole: current.role,
		currentStatus: current.membership_status,
		nextRole: current.role,
		nextStatus: 'ACTIVE',
	})

	if (!decision.allowed) {
		logEvent({
			operation: 'members.approve',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure(decision.message)
	}

	const profile = await updateMemberPrivilegesRecord({
		memberId: current.id,
		role: current.role,
		membershipStatus: 'ACTIVE',
		joinedOn: duesStartMonthFromJoinedAt(current.joined_at),
	})

	if (!profile) {
		return safeFailure('That membership could not be approved. Try again.')
	}

	logEvent({
		operation: 'members.approve',
		status: 'ok',
	})

	return { ok: true, profile }
}

export const updateMemberRecord = async (input: {
	memberId: string
	directory: OwnProfileUpdate
	privileges: {
		role: Profile['role']
		membershipStatus: Profile['membership_status']
		joinedOn: string | null
	} | null
}): Promise<MemberActionResult> => {
	const session = await getCurrentSession()

	if (!session.userId || !session.profile || !canAccessAdmin(session.access)) {
		logEvent({
			operation: 'members.updateRecord',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return safeFailure('You do not have permission to manage members.')
	}

	const current = await findProfileById(input.memberId)

	if (!current) {
		return safeFailure('That member could not be found.')
	}

	const isSelf = session.userId === current.id

	if (!isSelf) {
		if (!input.privileges) {
			return safeFailure('Enter membership status, first dues month, and role.')
		}

		const decision = canChangeMemberPrivileges({
			actorId: session.userId,
			targetId: current.id,
			actorIsAdmin: session.access.status === 'member' && session.access.isAdmin,
			currentRole: current.role,
			currentStatus: current.membership_status,
			nextRole: input.privileges.role,
			nextStatus: input.privileges.membershipStatus,
		})

		if (!decision.allowed) {
			logEvent({
				operation: 'members.updateRecord',
				status: 'denied',
				errorCategory: 'authorization',
			})
			return safeFailure(decision.message)
		}

		const privileges = await updateMemberPrivilegesRecord({
			memberId: input.memberId,
			role: input.privileges.role,
			membershipStatus: input.privileges.membershipStatus,
			joinedOn: input.privileges.joinedOn,
		})

		if (!privileges) {
			return safeFailure('The membership update could not be saved. Try again.')
		}
	}

	const profile = await updateMemberDirectoryRecord(input.memberId, input.directory)

	if (!profile) {
		return safeFailure('The member record could not be saved. Try again.')
	}

	logEvent({
		operation: 'members.updateRecord',
		status: 'ok',
	})

	return { ok: true, profile }
}

export const listInvitesForAdmin = async () => {
	const session = await getCurrentSession()
	if (!canAccessAdmin(session.access)) {
		return null
	}

	return listOpenMemberInvites()
}

export const inviteMember = async (
	input: AdminInviteMember,
): Promise<
	| { ok: true; emailed: boolean }
	| { ok: false; message: string; code: 'exists' | 'used' | 'database' | 'invalid' | 'denied' }
> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access) || !session.profile || !session.userId) {
		logEvent({
			operation: 'members.invite',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return {
			ok: false,
			code: 'denied',
			message: 'You do not have permission to invite members.',
		}
	}

	const created = await createMemberInviteRecord(input, session.userId)

	if (!created.ok) {
		const messages = {
			exists: 'A member with that email already exists.',
			used: 'That invitation has already been used.',
			invalid: 'Enter a valid email address and optional names.',
			database: 'That invitation could not be saved. Try again, or add the member manually.',
		} as const

		return { ok: false, code: created.reason, message: messages[created.reason] }
	}

	const mail = memberInviteEmail({
		firstName: input.first_name,
		inviterName: memberDisplayName(session.profile),
	})
	const sent = await sendDirectEmail({ ...mail, to: created.invite.email })

	logEvent({
		operation: 'members.invite',
		status: sent.ok ? 'ok' : 'error',
		errorCategory: sent.ok ? undefined : 'email',
	})

	return { ok: true, emailed: sent.ok }
}

export const resendMemberInviteEmail = async (
	email: string,
): Promise<
	| { ok: true }
	| { ok: false; message: string; code: 'missing' | 'database' | 'denied' | 'email' }
> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access) || !session.profile) {
		logEvent({
			operation: 'members.inviteResend',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return {
			ok: false,
			code: 'denied',
			message: 'You do not have permission to resend invitations.',
		}
	}

	const invite = await findOpenInviteByEmail(email)
	if (!invite) {
		return {
			ok: false,
			code: 'missing',
			message: 'No open invitation was found for that email.',
		}
	}

	const mail = memberInviteEmail({
		firstName: invite.first_name,
		inviterName: memberDisplayName(session.profile),
	})
	const sent = await sendDirectEmail({ ...mail, to: invite.email })

	logEvent({
		operation: 'members.inviteResend',
		status: sent.ok ? 'ok' : 'error',
		errorCategory: sent.ok ? undefined : 'email',
	})

	if (!sent.ok) {
		return {
			ok: false,
			code: 'email',
			message: 'The invitation email could not be sent. Check Gmail settings, or add the member manually.',
		}
	}

	return { ok: true }
}

export const createMemberManually = async (
	input: AdminCreateMember,
): Promise<
	| { ok: true; memberId: string; emailed: boolean }
	| { ok: false; message: string; code: 'exists' | 'database' | 'denied' | 'auth' }
> => {
	const session = await getCurrentSession()

	if (!canAccessAdmin(session.access) || !session.profile || !session.userId) {
		logEvent({
			operation: 'members.createManual',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return {
			ok: false,
			code: 'denied',
			message: 'You do not have permission to add members.',
		}
	}

	const admin = createSupabaseAdminClient()
	const email = input.email.trim().toLowerCase()

	const { data: existingProfile } = await admin
		.from('profiles')
		.select('id')
		.ilike('email', email)
		.maybeSingle()

	if (existingProfile) {
		return {
			ok: false,
			code: 'exists',
			message: 'A member with that email already exists.',
		}
	}

	const { data: createdAuth, error: createError } = await admin.auth.admin.createUser({
		email,
		password: input.password,
		email_confirm: true,
		user_metadata: {
			given_name: input.first_name,
			family_name: input.last_name,
		},
	})

	if (createError || !createdAuth.user) {
		logEvent({
			operation: 'members.createManual',
			status: 'error',
			errorCategory: 'auth',
			errorCode: createError?.code,
		})

		const message = (createError?.message ?? '').toLowerCase()
		if (message.includes('already') || message.includes('registered')) {
			return {
				ok: false,
				code: 'exists',
				message: 'A member with that email already exists.',
			}
		}

		return {
			ok: false,
			code: 'auth',
			message: 'The account could not be created. Check the email and try again.',
		}
	}

	const userId = createdAuth.user.id

	const { error: nameError } = await admin
		.from('profiles')
		.update({
			first_name: input.first_name,
			last_name: input.last_name,
			email,
		})
		.eq('id', userId)

	if (nameError) {
		// Trigger may not have created the row yet; insert a pending profile.
		const { error: insertError } = await admin.from('profiles').insert({
			id: userId,
			email,
			first_name: input.first_name,
			last_name: input.last_name,
			role: 'MEMBER',
			membership_status: 'PENDING',
		})

		if (insertError) {
			logEvent({
				operation: 'members.createManual',
				status: 'error',
				errorCategory: 'database',
				errorCode: insertError.code,
			})
			return {
				ok: false,
				code: 'database',
				message: 'The account was created, but the member profile could not be saved.',
			}
		}
	}

	if (input.membership_status === 'ACTIVE') {
		const updated = await updateMemberPrivilegesRecord({
			memberId: userId,
			role: 'MEMBER',
			membershipStatus: 'ACTIVE',
			joinedOn: DUES_TRACKING_START_MONTH,
		})

		if (!updated) {
			logEvent({
				operation: 'members.createManual',
				status: 'error',
				errorCategory: 'database',
			})
			return {
				ok: false,
				code: 'database',
				message:
					'The account was created as pending, but it could not be approved automatically. Open the member record to approve.',
			}
		}
	}

	const { data: existingInvite } = await admin
		.from('member_invites')
		.select('id')
		.eq('email', email)
		.maybeSingle()

	if (existingInvite?.id) {
		await admin
			.from('member_invites')
			.update({
				first_name: input.first_name,
				last_name: input.last_name,
				accepted_at: new Date().toISOString(),
			})
			.eq('id', existingInvite.id)
	} else {
		await admin.from('member_invites').insert({
			email,
			first_name: input.first_name,
			last_name: input.last_name,
			invited_by: session.userId,
			accepted_at: new Date().toISOString(),
		})
	}

	await admin.from('audit_logs').insert({
		actor_id: session.userId,
		action: 'member.create_manual',
		entity_type: 'profiles',
		entity_id: userId,
		old_data: null,
		new_data: {
			email_domain: email.split('@')[1] ?? null,
			membership_status: input.membership_status,
		},
	})

	const mail = memberInviteEmail({
		firstName: input.first_name,
		inviterName: memberDisplayName(session.profile),
	})
	const sent = await sendDirectEmail({ ...mail, to: email })

	logEvent({
		operation: 'members.createManual',
		status: 'ok',
	})

	return { ok: true, memberId: userId, emailed: sent.ok }
}
