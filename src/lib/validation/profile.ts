import { z } from 'zod'
import { logEvent } from '@/lib/logging'
import { isValidBirthMonthDay } from '@/lib/dates/birthday'
import {
	MEMBER_ROLES,
	MEMBERSHIP_STATUSES,
	type MemberRole,
	type MembershipStatus,
} from '@/types/roles'

export const PROFILE_SELECT_COLUMNS =
	'id, email, first_name, last_name, phone, department, occupation, address, birth_month, birth_day, wedding_anniversary, spouse_name, role, membership_status, joined_at, created_at, updated_at'

const isMemberRole = (value: unknown): value is MemberRole =>
	typeof value === 'string' && MEMBER_ROLES.some((role) => role === value)

const isMembershipStatus = (value: unknown): value is MembershipStatus =>
	typeof value === 'string' &&
	MEMBERSHIP_STATUSES.some((status) => status === value)

const nullableText = z.string().nullable()
const nullableMonthDay = z.number().int().nullable()

export const profileSchema = z
	.object({
		id: z.string().uuid(),
		email: z.string().email(),
		first_name: z.string().min(1),
		last_name: z.string().min(1),
		phone: nullableText,
		department: nullableText,
		occupation: nullableText,
		address: nullableText,
		birth_month: nullableMonthDay,
		birth_day: nullableMonthDay,
		wedding_anniversary: nullableText,
		spouse_name: nullableText,
		role: z.custom<MemberRole>(isMemberRole),
		membership_status: z.custom<MembershipStatus>(isMembershipStatus),
		joined_at: nullableText,
		created_at: z.string().min(1),
		updated_at: z.string().min(1),
	})
	.superRefine((value, context) => {
		if ((value.birth_month === null) !== (value.birth_day === null)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['birth_day'],
				message: 'Birthday must include both day and month',
			})
			return
		}

		if (
			value.birth_month !== null
			&& value.birth_day !== null
			&& !isValidBirthMonthDay(value.birth_month, value.birth_day)
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['birth_day'],
				message: 'Birthday day and month are not a valid date',
			})
		}
	})

export type Profile = z.infer<typeof profileSchema>

export const parseProfile = (value: unknown): Profile | null => {
	if (value === null || value === undefined) {
		return null
	}

	const parsed = profileSchema.safeParse(value)

	if (!parsed.success) {
		logEvent({
			operation: 'profiles.parse',
			status: 'error',
			errorCategory: 'validation',
		})
		return null
	}

	return parsed.data
}

export const parseProfiles = (value: unknown): Profile[] => {
	if (!Array.isArray(value)) {
		return []
	}

	return value.flatMap((row) => {
		const profile = parseProfile(row)
		return profile ? [profile] : []
	})
}
