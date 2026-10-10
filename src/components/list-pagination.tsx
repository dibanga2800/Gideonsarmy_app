import Link from 'next/link'
import { Icon } from '@/components/icons'
import { secondaryButtonClass, smallButtonClass } from '@/lib/ui'

interface ListPaginationProps {
	page: number
	totalPages: number
	total: number
	pageSize: number
	hrefForPage: (page: number) => string
	label?: string
	className?: string
}

const buttonClass = `${secondaryButtonClass} ${smallButtonClass}`

export const ListPagination = ({
	page,
	totalPages,
	total,
	pageSize,
	hrefForPage,
	label = 'List pages',
	className = 'flex flex-col gap-3 border-t border-line px-5 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6',
}: ListPaginationProps) => {
	if (total <= pageSize && totalPages <= 1) {
		return null
	}

	const from = total === 0 ? 0 : (page - 1) * pageSize + 1
	const to = Math.min(page * pageSize, total)

	return (
		<nav className={className} aria-label={label}>
			<p>
				<span className="font-medium text-navy-900">
					{from}–{to}
				</span>{' '}
				of {total}
			</p>
			<div className="flex items-center gap-2">
				{page > 1 ? (
					<Link href={hrefForPage(page - 1)} className={buttonClass}>
						<Icon name="arrow-left" className="h-4 w-4" />
						Previous
					</Link>
				) : (
					<span className={`${buttonClass} pointer-events-none opacity-40`} aria-disabled="true">
						<Icon name="arrow-left" className="h-4 w-4" />
						Previous
					</span>
				)}
				<p className="px-1 text-center tabular-nums">
					Page {page} of {totalPages}
				</p>
				{page < totalPages ? (
					<Link href={hrefForPage(page + 1)} className={buttonClass}>
						Next
						<Icon name="arrow-right" className="h-4 w-4" />
					</Link>
				) : (
					<span className={`${buttonClass} pointer-events-none opacity-40`} aria-disabled="true">
						Next
						<Icon name="arrow-right" className="h-4 w-4" />
					</span>
				)}
			</div>
		</nav>
	)
}
