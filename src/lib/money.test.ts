import { describe, expect, it } from 'vitest'
import {
	DEFAULT_MONTHLY_DUES_PENCE,
	addPence,
	formatPenceAsGbp,
	parsePoundsToPence,
	poundsToPence,
} from './money'

describe('money', () => {
	it('stores the default monthly dues as 1000 pence', () => {
		expect(DEFAULT_MONTHLY_DUES_PENCE).toBe(1000)
		expect(poundsToPence(10)).toBe(1000)
	})

	it('formats integer pence as GBP without floating-point math', () => {
		expect(formatPenceAsGbp(1000)).toBe('£10.00')
		expect(formatPenceAsGbp(5)).toBe('£0.05')
		expect(formatPenceAsGbp(-250)).toBe('-£2.50')
	})

	it('adds pence using integer arithmetic', () => {
		expect(addPence(1000, 500, 25)).toBe(1525)
	})

	it('rejects non-integer money values', () => {
		expect(() => poundsToPence(10.5)).toThrow(/whole pounds/)
		expect(() => formatPenceAsGbp(10.25)).toThrow(/integer number of pence/)
		expect(() => addPence(1000, 1.5)).toThrow(/integer number of pence/)
	})

	it('parses pound strings without floating-point math', () => {
		expect(parsePoundsToPence('10')).toBe(1000)
		expect(parsePoundsToPence('10.00')).toBe(1000)
		expect(parsePoundsToPence('10.5')).toBe(1050)
		expect(parsePoundsToPence('10.05')).toBe(1005)
		expect(parsePoundsToPence('')).toBeNull()
		expect(parsePoundsToPence('10.005')).toBeNull()
	})
})
