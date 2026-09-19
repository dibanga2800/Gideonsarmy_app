import { describe, expect, it } from 'vitest'
import {
	DEFAULT_LIST_PAGE_SIZE,
	DEFAULT_NOTICE_PAGE_SIZE,
	normalisePage,
	normalisePageSize,
	pageOffset,
	parsePageParam,
	totalPagesFor,
} from '@/lib/list-pagination'

describe('list pagination', () => {
	it('defaults and clamps page size', () => {
		expect(normalisePageSize(0)).toBe(DEFAULT_LIST_PAGE_SIZE)
		expect(normalisePageSize(20)).toBe(20)
		expect(normalisePageSize(100)).toBe(50)
		expect(normalisePageSize(0, DEFAULT_NOTICE_PAGE_SIZE)).toBe(DEFAULT_NOTICE_PAGE_SIZE)
	})

	it('computes page offsets and totals', () => {
		expect(pageOffset(1, 20)).toBe(0)
		expect(pageOffset(2, 20)).toBe(20)
		expect(totalPagesFor(0, 20)).toBe(1)
		expect(totalPagesFor(21, 20)).toBe(2)
		expect(normalisePage(9, 2)).toBe(2)
	})

	it('parses page query values safely', () => {
		expect(parsePageParam(undefined)).toBe(1)
		expect(parsePageParam('2')).toBe(2)
		expect(parsePageParam('0')).toBe(1)
		expect(parsePageParam('abc')).toBe(1)
	})
})
