import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/logging'
import type {
	AdminInviteMember,
	AdminUpdateMemberInvite,
} from '@/lib/validation/member'
import {
	normalisePage,
	normalisePageSize,
	pageOffset,
	totalPagesFor,
	DEFAULT_LIST_PAGE_SIZE,
} from '@/lib/list-pagination'

const inviteSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	first_name: z.string().nullable(),
	last_name: z.string().nullable(),
	invited_by: z.string().uuid(),
	accepted_at: z.string().nullable(),
	created_at: z.string().min(1),
})

export type MemberInvite = z.infer<typeof inviteSchema>

export type InviteCreateResult =
	| { ok: true; invite: MemberInvite }
	| { ok: false; reason: 'exists' | 'used' | 'database' | 'invalid' }

export interface MemberInvitePage {
	invites: MemberInvite[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}

export type InviteUpdateResult =
	| { ok: true; invite: MemberInvite }
	| { ok: false; reason: 'exists' | 'used' | 'database' | 'invalid' }

const parseInvite = (value: unknown): MemberInvite | null => {
	const parsed = inviteSchema.safeParse(value)
	return parsed.success ? parsed.data : null
}

const createInviteWithAdminFallback = async (
	input: AdminInviteMember,
	actorId: string,
): Promise<InviteCreateResult> => {
	const admin = createSupabaseAdminClient()
	const email = input.email.trim().toLowerCase()

	const { data: existingProfile, error: profileError } = await admin
		.from('profiles')
		.select('id')
		.ilike('email', email)
		.maybeSingle()

	if (profileError) {
		logEvent({
			operation: 'members.invite',
			status: 'error',
			errorCategory: 'database',
			errorCode: profileError.code,
		})
		return { ok: false, reason: 'database' }
	}

	if (existingProfile) {
		return { ok: false, reason: 'exists' }
	}

	const { data: existingInvite, error: inviteLookupError } = await admin
		.from('member_invites')
		.select('id, email, first_name, last_name, invited_by, accepted_at, created_at')
		.eq('email', email)
		.maybeSingle()

	if (inviteLookupError) {
		logEvent({
			operation: 'members.invite',
			status: 'error',
			errorCategory: 'database',
			errorCode: inviteLookupError.code,
		})
		return { ok: false, reason: 'database' }
	}

	if (existingInvite) {
		const existing = parseInvite(existingInvite)
		if (!existing) {
			return { ok: false, reason: 'database' }
		}

		if (existing.accepted_at) {
			return { ok: false, reason: 'used' }
		}

		const { data: updated, error: updateError } = await admin
			.from('member_invites')
			.update({
				first_name: input.first_name,
				last_name: input.last_name,
			})
			.eq('id', existing.id)
			.select('id, email, first_name, last_name, invited_by, accepted_at, created_at')
			.single()

		if (updateError) {
			logEvent({
				operation: 'members.invite',
				status: 'error',
				errorCategory: 'database',
				errorCode: updateError.code,
			})
			return { ok: false, reason: 'database' }
		}

		const invite = parseInvite(updated)
		return invite ? { ok: true, invite } : { ok: false, reason: 'database' }
	}

	const { data: inserted, error: insertError } = await admin
		.from('member_invites')
		.insert({
			email,
			first_name: input.first_name,
			last_name: input.last_name,
			invited_by: actorId,
		})
		.select('id, email, first_name, last_name, invited_by, accepted_at, created_at')
		.single()

	if (insertError) {
		logEvent({
			operation: 'members.invite',
			status: 'error',
			errorCategory: 'database',
			errorCode: insertError.code,
		})
		return { ok: false, reason: 'database' }
	}

	const invite = parseInvite(inserted)
	if (!invite) {
		return { ok: false, reason: 'database' }
	}

	await admin.from('audit_logs').insert({
		actor_id: actorId,
		action: 'member.invite',
		entity_type: 'member_invites',
		entity_id: invite.id,
		old_data: null,
		new_data: { email_domain: email.split('@')[1] ?? null },
	})

	return { ok: true, invite }
}

export const createMemberInviteRecord = async (
	input: AdminInviteMember,
	actorId: string,
): Promise<InviteCreateResult> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_create_member_invite', {
		p_email: input.email,
		p_first_name: input.first_name,
		p_last_name: input.last_name,
	})

	if (!error) {
		const invite = parseInvite(data)
		return invite ? { ok: true, invite } : { ok: false, reason: 'database' }
	}

	const message = (error.message ?? '').toLowerCase()
	if (message.includes('already exists')) {
		return { ok: false, reason: 'exists' }
	}
	if (message.includes('already been used')) {
		return { ok: false, reason: 'used' }
	}
	if (message.includes('valid email') || message.includes('valid first') || message.includes('valid last')) {
		return { ok: false, reason: 'invalid' }
	}

	// Environments that have the table but are missing the RPC still need invites to work.
	if (error.code === 'PGRST202' || message.includes('could not find the function')) {
		return createInviteWithAdminFallback(input, actorId)
	}

	logEvent({
		operation: 'members.invite',
		status: 'error',
		errorCategory: 'database',
		errorCode: error.code,
	})
	return { ok: false, reason: 'database' }
}

export const updateMemberInviteRecord = async (
	input: AdminUpdateMemberInvite,
): Promise<InviteUpdateResult> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_update_member_invite', {
		p_invite_id: input.inviteId,
		p_email: input.email,
		p_first_name: input.first_name,
		p_last_name: input.last_name,
	})

	if (!error) {
		const invite = parseInvite(data)
		return invite ? { ok: true, invite } : { ok: false, reason: 'database' }
	}

	const message = (error.message ?? '').toLowerCase()
	if (
		message.includes('already exists')
		|| message.includes('already uses that email')
		|| error.code === '23505'
	) {
		return { ok: false, reason: 'exists' }
	}
	if (message.includes('already been used') || message.includes('not found')) {
		return { ok: false, reason: 'used' }
	}
	if (message.includes('valid email') || message.includes('valid first') || message.includes('valid last')) {
		return { ok: false, reason: 'invalid' }
	}

	logEvent({
		operation: 'members.updateInvite',
		status: 'error',
		errorCategory: 'database',
		errorCode: error.code,
	})
	return { ok: false, reason: 'database' }
}

export const listOpenMemberInvites = async (input: {
	page?: number
	pageSize?: number
}): Promise<MemberInvitePage | null> => {
	const supabase = createSupabaseServerClient()
	const pageSize = normalisePageSize(input.pageSize ?? DEFAULT_LIST_PAGE_SIZE)
	const requestedPage = Math.max(1, Math.floor(input.page ?? 1) || 1)
	const columns = 'id, email, first_name, last_name, invited_by, accepted_at, created_at'
	let queryClient = supabase
	let { count, error: countError } = await queryClient
		.from('member_invites')
		.select('id', { count: 'exact', head: true })
		.is('accepted_at', null)

	if (countError) {
		const admin = createSupabaseAdminClient()
		queryClient = admin
		const adminCount = await queryClient
			.from('member_invites')
			.select('id', { count: 'exact', head: true })
			.is('accepted_at', null)
		count = adminCount.count
		countError = adminCount.error
	}

	if (countError) {
		logEvent({
			operation: 'members.listInvites',
			status: 'error',
			errorCategory: 'database',
			errorCode: countError.code,
		})
		return null
	}

	const total = count ?? 0
	const totalPages = totalPagesFor(total, pageSize)
	const page = normalisePage(requestedPage, totalPages)
	const from = pageOffset(page, pageSize)
	let { data, error } = await queryClient
		.from('member_invites')
		.select(columns)
		.is('accepted_at', null)
		.order('created_at', { ascending: false })
		.order('id', { ascending: true })
		.range(from, from + pageSize - 1)

	if (error && queryClient === supabase) {
		const admin = createSupabaseAdminClient()
		const adminRows = await admin
			.from('member_invites')
			.select(columns)
			.is('accepted_at', null)
			.order('created_at', { ascending: false })
			.order('id', { ascending: true })
			.range(from, from + pageSize - 1)
		data = adminRows.data
		error = adminRows.error
	}

	if (error) {
		logEvent({
			operation: 'members.listInvites',
			status: 'error',
			errorCategory: 'database',
			errorCode: error.code,
		})
		return null
	}

	return {
		invites: (data ?? []).flatMap((row) => {
			const parsed = parseInvite(row)
			return parsed ? [parsed] : []
		}),
		total,
		page,
		pageSize,
		totalPages,
	}
}

export const findOpenInviteByEmail = async (email: string): Promise<MemberInvite | null> => {
	const supabase = createSupabaseAdminClient()
	const normalised = email.trim().toLowerCase()
	const { data, error } = await supabase
		.from('member_invites')
		.select('id, email, first_name, last_name, invited_by, accepted_at, created_at')
		.eq('email', normalised)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'members.findInvite',
			status: 'error',
			errorCategory: 'database',
			errorCode: error.code,
		})
		return null
	}

	const parsed = parseInvite(data)
	if (!parsed || parsed.accepted_at) {
		return null
	}

	return parsed
}

export const markInviteAcceptedByEmail = async (email: string): Promise<boolean> => {
	const supabase = createSupabaseAdminClient()
	const normalised = email.trim().toLowerCase()
	const { data, error } = await supabase
		.from('member_invites')
		.update({ accepted_at: new Date().toISOString() })
		.eq('email', normalised)
		.is('accepted_at', null)
		.select('id')

	if (error) {
		logEvent({
			operation: 'members.markInviteAccepted',
			status: 'error',
			errorCategory: 'database',
			errorCode: error.code,
		})
		return false
	}

	return Array.isArray(data) && data.length > 0
}
