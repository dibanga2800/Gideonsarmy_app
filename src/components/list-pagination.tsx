import Link from 'next/link'
import { secondaryButtonClass } from '@/lib/ui'

interface ListPaginationProps {
	page: number
	totalPages: number
	total: number
	pageSize: number
	hrefForPage: (page: number) => string
	label?: string
	className?: string
}

export const ListPagination = ({
	page,
	totalPages,
	total,
	pageSize,
	hrefForPage,
	label = 'List pages',
	className = 'mt-4 flex flex-col gap-3 border-t border-cream-100 px-4 py-4 text-sm text-navy-800 sm:flex-row sm:items-center sm:justify-between',
}: ListPaginationProps) => {
	if (total <= pageSize && totalPages <= 1) {
		return null
	}

	const from = total === 0 ? 0 : (page - 1) * pageSize + 1
	const to = Math.min(page * pageSize, total)

	return (
		<nav className={className} aria-label={label}>
			<p>
				Showing {from}–{to} of {total}
			</p>
			<div className="flex items-center gap-2">
				{page > 1 ? (
					<Link href={hrefForPage(page - 1)} className={secondaryButtonClass}>
						Previous
					</Link>
				) : (
					<span className={`${secondaryButtonClass} pointer-events-none opacity-50`}>
						Previous
					</span>
				)}
				<p className="min-w-[7rem] text-center">
					Page {page} of {totalPages}
				</p>
				{page < totalPages ? (
					<Link href={hrefForPage(page + 1)} className={secondaryButtonClass}>
						Next
					</Link>
				) : (
					<span className={`${secondaryButtonClass} pointer-events-none opacity-50`}>
						Next
					</span>
				)}
			</div>
		</nav>
	)
}
