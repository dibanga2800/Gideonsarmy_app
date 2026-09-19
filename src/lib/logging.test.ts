import { describe, expect, it } from 'vitest'
import { safePostgrestCode } from '@/lib/logging'

describe('safePostgrestCode', () => {
	it('keeps PostgREST and Postgres error codes', () => {
		expect(safePostgrestCode('PGRST202')).toBe('PGRST202')
		expect(safePostgrestCode('42501')).toBe('42501')
	})

	it('drops messages and other unsafe values', () => {
		expect(safePostgrestCode('Could not find the function')).toBeUndefined()
		expect(safePostgrestCode('user@example.com')).toBeUndefined()
		expect(safePostgrestCode(null)).toBeUndefined()
	})
})
