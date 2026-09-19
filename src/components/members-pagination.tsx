import { ListPagination } from '@/components/list-pagination'

interface MembersPaginationProps {
	page: number
	totalPages: number
	total: number
	pageSize: number
	status?: string
}

const hrefFor = (page: number, status?: string) => {
	const params = new URLSearchParams()
	if (status) {
		params.set('status', status)
	}
	if (page > 1) {
		params.set('page', String(page))
	}
	const query = params.toString()
	return query ? `/admin/members?${query}` : '/admin/members'
}

export const MembersPagination = ({
	page,
	totalPages,
	total,
	pageSize,
	status,
}: MembersPaginationProps) => {
	return (
		<ListPagination
			page={page}
			totalPages={totalPages}
			total={total}
			pageSize={pageSize}
			hrefForPage={(nextPage) => hrefFor(nextPage, status)}
			label="Member list pages"
		/>
	)
}
