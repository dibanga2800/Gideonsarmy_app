import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 72

export const loginErrorSchema = z.enum([
	'not-configured',
	'oauth',
	'password',
	'invite',
	'exists',
	'invalid',
])

export type LoginErrorCode = z.infer<typeof loginErrorSchema>

const passwordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, 'Use at least 10 characters')
	.max(PASSWORD_MAX_LENGTH)

export const emailPasswordSignInSchema = z.object({
	email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
	password: passwordSchema,
})

export const invitedSignUpSchema = z
	.object({
		email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
		password: passwordSchema,
		confirm_password: z.string(),
	})
	.superRefine((value, context) => {
		if (value.password !== value.confirm_password) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['confirm_password'],
				message: 'Passwords do not match',
			})
		}
	})

export type EmailPasswordSignIn = z.infer<typeof emailPasswordSignInSchema>
export type InvitedSignUp = z.infer<typeof invitedSignUpSchema>
