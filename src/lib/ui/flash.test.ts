import { describe, expect, it } from 'vitest'
import { flashMessageFromSearch, parseStoredFlashMessage, stripFlashParams } from './flash'

describe('flash messages', () => {
	it('maps a saved update to a success toast', () => {
		expect(flashMessageFromSearch(new URLSearchParams('updated=1'))).toEqual({
			kind: 'success',
			title: 'Saved',
			text: 'Your changes have been saved.',
		})
	})

	it('maps a delete to a danger toast', () => {
		expect(flashMessageFromSearch(new URLSearchParams('year=2026&deleted=1'))).toEqual({
			kind: 'danger',
			title: 'Removed',
			text: 'That item has been removed.',
		})
	})

	it('wraps a longer invitation notice as a success box', () => {
		const message = flashMessageFromSearch(new URLSearchParams('invited=1'))
		expect(message?.kind).toBe('success')
		expect(message?.title).toBe('Invitation sent')
		expect(message?.text).toContain('remains pending')
	})

	it('keeps non-flash query parameters when clearing the toast flag', () => {
		const next = stripFlashParams(new URLSearchParams('year=2026&updated=1'))
		expect(next.get('year')).toBe('2026')
		expect(next.get('updated')).toBeNull()
	})

	it('restores a stored toast after the query flag is cleared', () => {
		expect(
			parseStoredFlashMessage({
				kind: 'danger',
				title: 'Removed',
				text: 'That item has been removed.',
			}),
		).toEqual({
			kind: 'danger',
			title: 'Removed',
			text: 'That item has been removed.',
		})
		expect(parseStoredFlashMessage({ kind: 'success' })).toBeNull()
	})
})
