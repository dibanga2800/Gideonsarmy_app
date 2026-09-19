import { describe, expect, it } from 'vitest'
import { isValidBirthMonthDay } from './birthday'

describe('isValidBirthMonthDay', () => {
	it('accepts 29 February without a birth year', () => {
		expect(isValidBirthMonthDay(2, 29)).toBe(true)
	})

	it('rejects 30 February and 31 April', () => {
		expect(isValidBirthMonthDay(2, 30)).toBe(false)
		expect(isValidBirthMonthDay(4, 31)).toBe(false)
	})

	it('rejects values outside month and day ranges', () => {
		expect(isValidBirthMonthDay(0, 12)).toBe(false)
		expect(isValidBirthMonthDay(13, 1)).toBe(false)
		expect(isValidBirthMonthDay(5, 0)).toBe(false)
	})
})
