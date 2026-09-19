import { describe, expect, it } from 'vitest'
import {
	normalisePage,
	normalisePageSize,
	pageOffset,
	totalPagesFor,
	DEFAULT_MEMBER_PAGE_SIZE,
} from '@/lib/members/pagination'

describe('member pagination', () => {
	it('defaults and clamps page size', () => {
		expect(normalisePageSize(0)).toBe(DEFAULT_MEMBER_PAGE_SIZE)
		expect(normalisePageSize(20)).toBe(20)
		expect(normalisePageSize(100)).toBe(50)
	})

	it('computes page offsets and totals', () => {
		expect(pageOffset(1, 20)).toBe(0)
		expect(pageOffset(2, 20)).toBe(20)
		expect(totalPagesFor(0, 20)).toBe(1)
		expect(totalPagesFor(21, 20)).toBe(2)
		expect(normalisePage(9, 2)).toBe(2)
	})
})
