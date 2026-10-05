import type { Profile } from '@/types/database'
import type { MembershipStatus } from '@/types/roles'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logClientError, logEvent } from '@/lib/logging'
import {
	parseProfile,
	parseProfiles,
	PROFILE_SELECT_COLUMNS,
} from '@/lib/validation/profile'
import type { OwnProfileUpdate } from '@/lib/validation/member'
import { memberPhotoColumn, type MemberPhotoKind } from '@/lib/members/portrait'
import {
	DEFAULT_MEMBER_PAGE_SIZE,
	normalisePage,
	normalisePageSize,
	pageOffset,
	totalPagesFor,
} from '@/lib/members/pagination'

export const findProfileById = async (id: string): Promise<Profile | null> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('profiles')
		.select(PROFILE_SELECT_COLUMNS)
		.eq('id', id)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'profiles.findById',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseProfile(data)
}

export const listProfiles = async (status?: MembershipStatus): Promise<Profile[]> => {
	const page = await listProfilesPage({ status, page: 1, pageSize: 100 })
	return page.members
}

export const listProfilesPage = async (input: {
	status?: MembershipStatus
	page?: number
	pageSize?: number
}): Promise<{
	members: Profile[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}> => {
	const supabase = createSupabaseServerClient()
	const pageSize = normalisePageSize(input.pageSize ?? DEFAULT_MEMBER_PAGE_SIZE)
	const requestedPage = Math.max(1, Math.floor(input.page ?? 1) || 1)

	let countQuery = supabase
		.from('profiles')
		.select('id', { count: 'exact', head: true })

	if (input.status) {
		countQuery = countQuery.eq('membership_status', input.status)
	}

	const { count, error: countError } = await countQuery

	if (countError) {
		logEvent({
			operation: 'profiles.count',
			status: 'error',
			errorCategory: 'database',
			errorCode: countError.code,
		})
		throw new Error('Unable to load members')
	}

	const total = count ?? 0
	const totalPages = totalPagesFor(total, pageSize)
	const page = normalisePage(requestedPage, totalPages)
	const from = pageOffset(page, pageSize)
	const to = from + pageSize - 1

	let query = supabase
		.from('profiles')
		.select(PROFILE_SELECT_COLUMNS)
		.order('last_name', { ascending: true })
		.order('first_name', { ascending: true })
		.range(from, to)

	if (input.status) {
		query = query.eq('membership_status', input.status)
	}

	const { data, error } = await query

	if (error) {
		logEvent({
			operation: 'profiles.list',
			status: 'error',
			errorCategory: 'database',
			errorCode: error.code,
		})
		throw new Error('Unable to load members')
	}

	return {
		members: parseProfiles(data),
		total,
		page,
		pageSize,
		totalPages,
	}
}

export const updateOwnProfileRecord = async (
	id: string,
	update: OwnProfileUpdate,
): Promise<Profile | null> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('profiles')
		.update(update)
		.eq('id', id)
		.select(PROFILE_SELECT_COLUMNS)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'profiles.updateOwn',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseProfile(data)
}

export const updateOwnPhotoPath = async (
	id: string,
	photoStoragePath: string | null,
	kind: MemberPhotoKind = 'portrait',
): Promise<Profile | null> => {
	const supabase = createSupabaseServerClient()
	const column = memberPhotoColumn(kind)
	const { data, error } = await supabase
		.from('profiles')
		.update({ [column]: photoStoragePath })
		.eq('id', id)
		.select(PROFILE_SELECT_COLUMNS)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'profiles.updatePhoto',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseProfile(data)
}

export const updateMemberDirectoryRecord = async (
	id: string,
	update: OwnProfileUpdate,
): Promise<Profile | null> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('profiles')
		.update({
			first_name: update.first_name,
			last_name: update.last_name,
			phone: update.phone,
			department: update.department,
			occupation: update.occupation,
			address: update.address,
			birth_month: update.birth_month,
			birth_day: update.birth_day,
			wedding_anniversary: update.wedding_anniversary,
			spouse_name: update.spouse_name,
		})
		.eq('id', id)
		.select(PROFILE_SELECT_COLUMNS)
		.maybeSingle()

	if (error) {
		logClientError('profiles.updateDirectory', error)
		return null
	}

	return parseProfile(data)
}

export const updateMemberPrivilegesRecord = async (input: {
	memberId: string
	role: Profile['role']
	membershipStatus: Profile['membership_status']
	joinedOn: string | null
}): Promise<Profile | null> => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_update_member', {
		p_member_id: input.memberId,
		p_role: input.role,
		p_membership_status: input.membershipStatus,
		p_joined_on: input.joinedOn,
	})

	if (error) {
		logClientError('profiles.updatePrivileges', error)
		return null
	}

	return parseProfile(data)
}

export const findProfilesByIds = async (ids: string[]): Promise<Profile[]> => {
	if (ids.length === 0) {
		return []
	}

	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('profiles')
		.select(PROFILE_SELECT_COLUMNS)
		.in('id', ids)

	if (error) {
		logEvent({
			operation: 'profiles.findByIds',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parseProfiles(data)
}
