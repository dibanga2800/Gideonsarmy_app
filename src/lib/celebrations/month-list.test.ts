import { describe, expect, it } from 'vitest'
import { monthCelebrationsFromSources } from './month-list'

const brother = {
	id: '11111111-1111-4111-8111-111111111111',
	first_name: 'David',
	last_name: 'Ibanga',
	birth_month: 9,
	birth_day: 16,
	anniversary_month: 10,
	anniversary_day: 8,
	spouse_name: 'Joy',
}

describe('monthCelebrationsFromSources', () => {
	it('lists a September birthday in September and not in October', () => {
		const september = monthCelebrationsFromSources(
			[brother],
			2026,
			9,
			new Date('2026-09-16T12:00:00.000Z'),
		)
		const october = monthCelebrationsFromSources(
			[brother],
			2026,
			10,
			new Date('2026-09-16T12:00:00.000Z'),
		)

		expect(september.monthLabel).toBe('September 2026')
		expect(september.birthdays).toEqual([
			{
				id: 'birthday-11111111-1111-4111-8111-111111111111',
				name: 'David Ibanga',
				label: '16 September',
				isToday: true,
				kind: 'birthday',
				photoUrl: null,
			},
		])
		expect(september.anniversaries).toEqual([])
		expect(october.birthdays).toEqual([])
		expect(october.anniversaries[0]).toMatchObject({
			name: 'David Ibanga and Joy',
			label: '8 October',
			isToday: false,
			kind: 'anniversary',
			photoUrl: null,
		})
	})

	it('reads an anniversary from a wedding_anniversary date when month columns are absent', () => {
		const result = monthCelebrationsFromSources(
			[
				{
					id: '22222222-2222-4222-8222-222222222222',
					first_name: 'James',
					last_name: 'Okoro',
					birth_month: null,
					birth_day: null,
					wedding_anniversary: '2018-09-20',
					spouse_name: null,
					photoUrl: 'https://example.com/portrait.jpg',
				},
			],
			2026,
			9,
			new Date('2026-09-16T12:00:00.000Z'),
		)

		expect(result.anniversaries).toEqual([
			{
				id: 'anniversary-22222222-2222-4222-8222-222222222222',
				name: 'James Okoro',
				label: '20 September',
				isToday: false,
				kind: 'anniversary',
				photoUrl: 'https://example.com/portrait.jpg',
			},
		])
	})
})
