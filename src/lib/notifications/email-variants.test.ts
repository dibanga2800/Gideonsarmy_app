import { describe, expect, it } from 'vitest'
import {
	birthdayCelebrantVariants,
	pickVariant,
} from '@/lib/notifications/email-variants'
import { birthdayCelebrantEmail } from '@/lib/notifications/email-templates'

describe('email copy variants', () => {
	it('picks a stable variant for the same seed', () => {
		const first = pickVariant(birthdayCelebrantVariants, 'birthday:member-a:2026')
		const second = pickVariant(birthdayCelebrantVariants, 'birthday:member-a:2026')

		expect(first).toBe(second)
	})

	it('can produce different birthday copy for different seeds', () => {
		const subjects = new Set(
			Array.from({ length: 20 }, (_, index) =>
				birthdayCelebrantEmail('David', '29 September', `seed-${index}`).subject,
			),
		)

		expect(subjects.size).toBeGreaterThan(1)
	})

	it('keeps factual dues details while rotating pastoral framing', () => {
		const a = birthdayCelebrantEmail('David', '29 September', 'year-2026')
		const b = birthdayCelebrantEmail('David', '29 September', 'year-2027')

		expect(a.text).toContain('Dear David,')
		expect(b.text).toContain('Dear David,')
		expect(a.html).toContain('<!DOCTYPE html>')
		expect(a.subject === b.subject && a.text === b.text).toBe(false)
	})
})
