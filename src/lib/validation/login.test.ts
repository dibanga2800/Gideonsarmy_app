import { describe, expect, it } from 'vitest'
import { emailPasswordSignInSchema, invitedSignUpSchema } from './login'

describe('email password sign-in', () => {
	it('accepts a valid email and password and lowercases the email', () => {
		expect(
			emailPasswordSignInSchema.parse({
				email: '  Brother@Example.com ',
				password: 'a-secure-pass',
			}),
		).toEqual({
			email: 'brother@example.com',
			password: 'a-secure-pass',
		})
	})

	it('rejects a short password', () => {
		expect(
			emailPasswordSignInSchema.safeParse({
				email: 'brother@example.com',
				password: 'short',
			}).success,
		).toBe(false)
	})
})

describe('invited sign-up', () => {
	it('requires matching passwords', () => {
		expect(
			invitedSignUpSchema.safeParse({
				email: 'brother@example.com',
				password: 'a-secure-pass',
				confirm_password: 'different-pass',
			}).success,
		).toBe(false)
	})

	it('accepts an invited password signup', () => {
		expect(
			invitedSignUpSchema.parse({
				email: 'Brother@Example.com',
				password: 'a-secure-pass',
				confirm_password: 'a-secure-pass',
			}),
		).toEqual({
			email: 'brother@example.com',
			password: 'a-secure-pass',
			confirm_password: 'a-secure-pass',
		})
	})
})
