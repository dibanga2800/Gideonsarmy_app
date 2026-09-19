'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
	adminCreateMemberSchema,
	adminInviteMemberSchema,
	adminMemberUpdateSchema,
	memberIdSchema,
	ownProfileUpdateSchema,
} from '@/lib/validation/member'
import {
	approveMember,
	createMemberManually,
	inviteMember,
	resendMemberInviteEmail,
	updateMemberRecord,
	updateOwnProfile,
} from '@/server/services/member-service'

const inviteEmailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase())

const formValue = (formData: FormData, key: string) => {
	const value = formData.get(key)
	return typeof value === 'string' ? value : ''
}

const directoryFieldsFromForm = (formData: FormData) => ({
	first_name: formValue(formData, 'first_name'),
	last_name: formValue(formData, 'last_name'),
	phone: formValue(formData, 'phone'),
	department: formValue(formData, 'department'),
	occupation: formValue(formData, 'occupation'),
	address: formValue(formData, 'address'),
	birth_month: formValue(formData, 'birth_month'),
	birth_day: formValue(formData, 'birth_day'),
	wedding_anniversary: formValue(formData, 'wedding_anniversary'),
	spouse_name: formValue(formData, 'spouse_name'),
})

export const saveOwnProfileAction = async (formData: FormData) => {
	const parsed = ownProfileUpdateSchema.safeParse(directoryFieldsFromForm(formData))

	if (!parsed.success) {
		redirect('/profile?error=invalid')
	}

	const result = await updateOwnProfile(parsed.data)

	if (!result.ok) {
		redirect('/profile?error=save')
	}

	revalidatePath('/profile')
	revalidatePath('/dashboard')
	redirect('/profile?updated=1')
}

export const saveMemberRecordAction = async (formData: FormData) => {
	const memberId = memberIdSchema.safeParse(formValue(formData, 'memberId'))
	const directory = ownProfileUpdateSchema.safeParse(directoryFieldsFromForm(formData))
	const privileges = adminMemberUpdateSchema.safeParse({
		memberId: formValue(formData, 'memberId'),
		role: formValue(formData, 'role'),
		membership_status: formValue(formData, 'membership_status'),
		dues_start_mode: formValue(formData, 'dues_start_mode'),
		joined_on: formValue(formData, 'joined_on'),
	})

	if (!memberId.success || !directory.success) {
		if (memberId.success) {
			redirect(`/admin/members/${memberId.data}?error=invalid`)
		}

		redirect('/admin/members?error=invalid')
	}

	const result = await updateMemberRecord({
		memberId: memberId.data,
		directory: directory.data,
		privileges: privileges.success
			? {
					role: privileges.data.role,
					membershipStatus: privileges.data.membership_status,
					joinedOn: privileges.data.joinedOn,
				}
			: null,
	})

	if (!result.ok) {
		redirect(`/admin/members/${memberId.data}?error=save`)
	}

	revalidatePath('/admin/members')
	revalidatePath(`/admin/members/${memberId.data}`)
	revalidatePath('/admin/payments')
	revalidatePath('/dues')
	revalidatePath('/dashboard')
	revalidatePath('/profile')
	redirect(`/admin/members/${memberId.data}?updated=1`)
}

export const approveMemberAction = async (formData: FormData) => {
	const memberId = memberIdSchema.safeParse(formValue(formData, 'memberId'))

	if (!memberId.success) {
		redirect('/admin/members?error=approve')
	}

	const result = await approveMember(memberId.data)

	if (!result.ok) {
		redirect('/admin/members?error=approve')
	}

	revalidatePath('/admin/members')
	revalidatePath(`/admin/members/${memberId.data}`)
	revalidatePath('/admin/payments')
	revalidatePath('/dashboard')
	redirect('/admin/members?approved=1')
}

export const inviteMemberAction = async (formData: FormData) => {
	const parsed = adminInviteMemberSchema.safeParse({
		email: formValue(formData, 'email'),
		first_name: formValue(formData, 'first_name'),
		last_name: formValue(formData, 'last_name'),
	})

	if (!parsed.success) {
		redirect('/admin/members?error=invite')
	}

	const result = await inviteMember(parsed.data)

	if (!result.ok) {
		redirect(`/admin/members?error=invite&reason=${result.code}`)
	}

	revalidatePath('/admin/members')
	redirect(result.emailed ? '/admin/members?invited=1' : '/admin/members?invited=1&email=0')
}

export const resendMemberInviteAction = async (formData: FormData) => {
	const parsed = inviteEmailSchema.safeParse(formValue(formData, 'email'))

	if (!parsed.success) {
		redirect('/admin/members?error=invite&reason=invalid')
	}

	const result = await resendMemberInviteEmail(parsed.data)

	if (!result.ok) {
		const reason =
			result.code === 'missing'
				? 'used'
				: result.code === 'email'
					? 'database'
					: result.code
		redirect(`/admin/members?error=invite&reason=${reason}`)
	}

	revalidatePath('/admin/members')
	redirect('/admin/members?invited=1')
}

export const createMemberManuallyAction = async (formData: FormData) => {
	const parsed = adminCreateMemberSchema.safeParse({
		email: formValue(formData, 'email'),
		first_name: formValue(formData, 'first_name'),
		last_name: formValue(formData, 'last_name'),
		password: formValue(formData, 'password'),
		membership_status: formValue(formData, 'membership_status') || 'PENDING',
	})

	if (!parsed.success) {
		redirect('/admin/members?error=create')
	}

	const result = await createMemberManually(parsed.data)

	if (!result.ok) {
		redirect(`/admin/members?error=create&reason=${result.code}`)
	}

	revalidatePath('/admin/members')
	revalidatePath(`/admin/members/${result.memberId}`)
	redirect(
		result.emailed
			? `/admin/members/${result.memberId}?created=1`
			: `/admin/members/${result.memberId}?created=1&email=0`,
	)
}
