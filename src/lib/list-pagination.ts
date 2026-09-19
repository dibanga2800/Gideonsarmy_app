export const DEFAULT_LIST_PAGE_SIZE = 20
export const MAX_LIST_PAGE_SIZE = 50
export const DEFAULT_NOTICE_PAGE_SIZE = 10
export const DEFAULT_PAYMENT_PAGE_SIZE = 20

/** @deprecated Prefer DEFAULT_LIST_PAGE_SIZE */
export const DEFAULT_MEMBER_PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE
/** @deprecated Prefer MAX_LIST_PAGE_SIZE */
export const MAX_MEMBER_PAGE_SIZE = MAX_LIST_PAGE_SIZE

export const normalisePage = (value: number, totalPages: number) => {
	if (!Number.isFinite(value) || value < 1) {
		return 1
	}

	if (totalPages < 1) {
		return 1
	}

	return Math.min(Math.floor(value), totalPages)
}

export const normalisePageSize = (value: number, fallback = DEFAULT_LIST_PAGE_SIZE) => {
	if (!Number.isFinite(value) || value < 1) {
		return fallback
	}

	return Math.min(MAX_LIST_PAGE_SIZE, Math.floor(value))
}

export const totalPagesFor = (totalItems: number, pageSize: number) => {
	const size = normalisePageSize(pageSize)
	if (totalItems <= 0) {
		return 1
	}

	return Math.ceil(totalItems / size)
}

export const pageOffset = (page: number, pageSize: number) => {
	const size = normalisePageSize(pageSize)
	const safePage = Math.max(1, Math.floor(page) || 1)
	return (safePage - 1) * size
}

export const parsePageParam = (value: string | undefined) => {
	const parsed = Number.parseInt(value ?? '1', 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}
