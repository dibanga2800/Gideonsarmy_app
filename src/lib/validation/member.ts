import { z } from 'zod'
import { isValidBirthMonthDay } from '@/lib/dates/birthday'
import { getCurrentDueMonth } from '@/lib/dates/due-month'
import { DUES_TRACKING_START_MONTH } from '@/lib/dates/dues-year'

const emptyToNull = (value: unknown) => {
	if (typeof value !== 'string') {
		return value
	}

	const trimmed = value.trim()
	return trimmed === '' ? null : trimmed
}

export const PROFILE_SHORT_TEXT_MAX = 80
export const PROFILE_ADDRESS_MAX = 200

const optionalName = z.string().trim().min(1).max(PROFILE_SHORT_TEXT_MAX)
const optionalText = z.preprocess(
	emptyToNull,
	z.string().max(PROFILE_SHORT_TEXT_MAX).nullable(),
)
const optionalAddress = z.preprocess(
	emptyToNull,
	z.string().max(PROFILE_ADDRESS_MAX).nullable(),
)
const optionalDate = z.preprocess(
	emptyToNull,
	z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date').nullable(),
)
const optionalMonthDayPart = z.preprocess((value) => {
	if (typeof value !== 'string') {
		return value
	}

	const trimmed = value.trim()
	return trimmed === '' ? null : trimmed
}, z.union([z.null(), z.coerce.number().int()]))

export const ownProfileUpdateSchema = z
	.object({
		first_name: optionalName,
		last_name: optionalName,
		phone: optionalText,
		department: optionalText,
		occupation: optionalText,
		address: optionalAddress,
		birth_month: optionalMonthDayPart,
		birth_day: optionalMonthDayPart,
		wedding_anniversary: optionalDate,
		spouse_name: optionalText,
	})
	.superRefine((value, context) => {
		if ((value.birth_month === null) !== (value.birth_day === null)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['birth_day'],
				message: 'Enter both a birthday day and month, or leave both empty',
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
				message: 'Enter a valid birthday day and month',
			})
		}
	})

const duesStartMonthValue = (raw: string) => {
	const trimmed = raw.trim()
	if (trimmed === '') {
		return null
	}

	return /^\d{4}-\d{2}$/.test(trimmed) ? `${trimmed}-01` : trimmed
}

export const adminMemberUpdateSchema = z
	.object({
		memberId: z.string().uuid(),
		role: z.union([z.literal('MEMBER'), z.literal('ADMIN')]),
		membership_status: z.union([
			z.literal('PENDING'),
			z.literal('ACTIVE'),
			z.literal('INACTIVE'),
		]),
		dues_start_mode: z.preprocess(
			(value) => (value === '' || value === undefined ? undefined : value),
			z.union([z.literal('full_year'), z.literal('from_month')]).optional(),
		),
		joined_on: z.string(),
	})
	.superRefine((value, context) => {
		if (value.dues_start_mode !== 'from_month') {
			return
		}

		const monthValue = duesStartMonthValue(value.joined_on)

		if (!monthValue || !/^\d{4}-\d{2}-01$/.test(monthValue)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['joined_on'],
				message: 'Enter the month this new brother starts owing dues',
			})
			return
		}

		if (monthValue < DUES_TRACKING_START_MONTH) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['joined_on'],
				message: 'Payment start cannot be before January 2026',
			})
		}

		if (monthValue > getCurrentDueMonth()) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['joined_on'],
				message: 'Payment start cannot be in the future',
			})
		}
	})
	.transform((value) => {
		const laterStart = duesStartMonthValue(value.joined_on)
		const joinedOn =
			value.dues_start_mode === 'from_month' && laterStart
				? laterStart
				: DUES_TRACKING_START_MONTH

		return {
			memberId: value.memberId,
			role: value.role,
			membership_status: value.membership_status,
			joinedOn,
		}
	})

export const memberIdSchema = z.string().uuid()

export const adminInviteMemberSchema = z.object({
	email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
	first_name: z.preprocess(emptyToNull, z.string().trim().max(80).nullable()),
	last_name: z.preprocess(emptyToNull, z.string().trim().max(80).nullable()),
})

export const memberStatusFilterSchema = z.union([
	z.literal('all'),
	z.literal('PENDING'),
	z.literal('ACTIVE'),
	z.literal('INACTIVE'),
])

export type OwnProfileUpdate = z.infer<typeof ownProfileUpdateSchema>
export type AdminMemberUpdate = z.infer<typeof adminMemberUpdateSchema>
export type AdminInviteMember = z.infer<typeof adminInviteMemberSchema>

export const adminCreateMemberSchema = z.object({
	email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
	first_name: z.string().trim().min(1).max(PROFILE_SHORT_TEXT_MAX),
	last_name: z.string().trim().min(1).max(PROFILE_SHORT_TEXT_MAX),
	password: z.string().min(10).max(72),
	membership_status: z.union([z.literal('PENDING'), z.literal('ACTIVE')]),
})

export const adminChangePasswordSchema = z.object({
	memberId: memberIdSchema,
	password: z.string().min(10).max(72),
	confirm_password: z.string(),
}).refine((value) => value.password === value.confirm_password, {
	message: 'Passwords do not match',
	path: ['confirm_password'],
})

export type AdminCreateMember = z.infer<typeof adminCreateMemberSchema>
export type AdminChangePassword = z.infer<typeof adminChangePasswordSchema>
