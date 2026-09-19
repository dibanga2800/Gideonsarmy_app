'use client'

import { eyebrowClass, pageLeadClass, pageNarrowClass, pageTitleClass, primaryButtonClass } from '@/lib/ui'

interface ErrorPageProps {
	reset: () => void
}

const ErrorPage = ({ reset }: ErrorPageProps) => {
	const handleRetry = () => {
		reset()
	}

	return (
		<main className={pageNarrowClass}>
			<p className={eyebrowClass}>Gideon&apos;s Army</p>
			<h1 className={`${pageTitleClass} mt-3`}>Something went wrong</h1>
			<p className={pageLeadClass}>
				The page could not be loaded. Try again. If it keeps happening, contact a
				fellowship administrator.
			</p>
			<button type="button" className={`${primaryButtonClass} mt-8`} onClick={handleRetry}>
				Try again
			</button>
		</main>
	)
}

export default ErrorPage
