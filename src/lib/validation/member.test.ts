import { describe, expect, it } from 'vitest'
import { adminInviteMemberSchema, adminMemberUpdateSchema, ownProfileUpdateSchema } from './member'

describe('ownProfileUpdateSchema', () => {
	it('accepts a valid profile update and ignores empty optional fields', () => {
		expect(
			ownProfileUpdateSchema.parse({
				first_name: 'David',
				last_name: 'Ibanga',
				phone: '',
				department: 'Ushering',
				occupation: '  ',
				address: '12 Example Street, Stoke-on-Trent',
				birth_month: '5',
				birth_day: '12',
				wedding_anniversary: '',
				spouse_name: '  ',
			}),
		).toEqual({
			first_name: 'David',
			last_name: 'Ibanga',
			phone: null,
			department: 'Ushering',
			occupation: null,
			address: '12 Example Street, Stoke-on-Trent',
			birth_month: 5,
			birth_day: 12,
			wedding_anniversary: null,
			spouse_name: null,
		})
	})

	it('rejects a birthday year and accepts day and month only', () => {
		const parsed = ownProfileUpdateSchema.safeParse({
			first_name: 'David',
			last_name: 'Ibanga',
			phone: null,
			department: null,
			occupation: null,
			address: null,
			birth_month: '2',
			birth_day: '29',
			date_of_birth: '1980-02-29',
			wedding_anniversary: null,
			spouse_name: null,
		})

		expect(parsed.success).toBe(true)
		if (parsed.success) {
			expect(parsed.data).not.toHaveProperty('date_of_birth')
			expect(parsed.data.birth_month).toBe(2)
			expect(parsed.data.birth_day).toBe(29)
		}
	})

	it('rejects 31 April as a birthday', () => {
		expect(
			ownProfileUpdateSchema.safeParse({
				first_name: 'David',
				last_name: 'Ibanga',
				phone: null,
				department: null,
				occupation: null,
				address: null,
				birth_month: '4',
				birth_day: '31',
				wedding_anniversary: null,
				spouse_name: null,
			}).success,
		).toBe(false)
	})

	it('rejects role or status fields supplied by a member form', () => {
		const parsed = ownProfileUpdateSchema.safeParse({
			first_name: 'David',
			last_name: 'Ibanga',
			phone: null,
			department: null,
			occupation: null,
			address: null,
			birth_month: null,
			birth_day: null,
			wedding_anniversary: null,
			spouse_name: null,
			role: 'ADMIN',
			membership_status: 'ACTIVE',
		})

		expect(parsed.success).toBe(true)
		if (parsed.success) {
			expect(parsed.data).not.toHaveProperty('role')
			expect(parsed.data).not.toHaveProperty('membership_status')
		}
	})

	it('rejects an address that is too long', () => {
		expect(
			ownProfileUpdateSchema.safeParse({
				first_name: 'David',
				last_name: 'Ibanga',
				phone: null,
				department: null,
				occupation: null,
				address: 'x'.repeat(201),
				birth_month: null,
				birth_day: null,
				wedding_anniversary: null,
				spouse_name: null,
			}).success,
		).toBe(false)
	})
})

describe('adminMemberUpdateSchema', () => {
	it('rejects an invalid member id', () => {
		expect(
			adminMemberUpdateSchema.safeParse({
				memberId: '123',
				role: 'MEMBER',
				membership_status: 'ACTIVE',
				joined_on: '2026-09',
			}).success,
		).toBe(false)
	})

	it('defaults to a full year from January unless a later start is chosen', () => {
		expect(
			adminMemberUpdateSchema.parse({
				memberId: '11111111-1111-4111-8111-111111111111',
				role: 'MEMBER',
				membership_status: 'ACTIVE',
				dues_start_mode: 'full_year',
				joined_on: '',
			}),
		).toEqual({
			memberId: '11111111-1111-4111-8111-111111111111',
			role: 'MEMBER',
			membership_status: 'ACTIVE',
			joinedOn: '2026-01-01',
		})

		expect(
			adminMemberUpdateSchema.parse({
				memberId: '11111111-1111-4111-8111-111111111111',
				role: 'MEMBER',
				membership_status: 'ACTIVE',
				dues_start_mode: 'full_year',
				joined_on: '2026-09',
			}),
		).toEqual({
			memberId: '11111111-1111-4111-8111-111111111111',
			role: 'MEMBER',
			membership_status: 'ACTIVE',
			joinedOn: '2026-01-01',
		})

		expect(
			adminMemberUpdateSchema.parse({
				memberId: '11111111-1111-4111-8111-111111111111',
				role: 'MEMBER',
				membership_status: 'ACTIVE',
				dues_start_mode: 'from_month',
				joined_on: '2026-09',
			}),
		).toEqual({
			memberId: '11111111-1111-4111-8111-111111111111',
			role: 'MEMBER',
			membership_status: 'ACTIVE',
			joinedOn: '2026-09-01',
		})

		expect(
			adminMemberUpdateSchema.safeParse({
				memberId: '11111111-1111-4111-8111-111111111111',
				role: 'MEMBER',
				membership_status: 'ACTIVE',
				dues_start_mode: 'from_month',
				joined_on: '',
			}).success,
		).toBe(false)
	})
})

describe('adminInviteMemberSchema', () => {
	it('normalises the invited email and treats names as optional', () => {
		expect(
			adminInviteMemberSchema.parse({
				email: '  Brother@Example.com ',
				first_name: 'James',
				last_name: '',
			}),
		).toEqual({
			email: 'brother@example.com',
			first_name: 'James',
			last_name: null,
		})
	})
})
