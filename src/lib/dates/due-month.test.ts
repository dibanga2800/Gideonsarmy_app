import { describe, expect, it } from 'vitest'
import { formatDueMonth, getCurrentDueMonth, toDueMonthDate } from './due-month'

describe('due month', () => {
	it('stores months as the first civil day', () => {
		expect(toDueMonthDate(2026, 9)).toBe('2026-09-01')
	})

	it('uses Europe/London for the current month, including around midnight UTC', () => {
		expect(getCurrentDueMonth(new Date('2026-08-31T23:30:00.000Z'))).toBe('2026-09-01')
		expect(getCurrentDueMonth(new Date('2026-09-01T00:30:00.000Z'))).toBe('2026-09-01')
	})

	it('formats a due month for fellowship display', () => {
		expect(formatDueMonth('2026-09-01')).toBe('September 2026')
	})
})
