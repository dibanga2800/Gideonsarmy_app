'use client'

import Link from 'next/link'
import { StatusPage } from '@/components/status-page'
import { primaryButtonClass, secondaryButtonClass } from '@/lib/ui'

interface ErrorPageProps {
	reset: () => void
}

const ErrorPage = ({ reset }: ErrorPageProps) => {
	return (
		<StatusPage
			icon="alert"
			tone="attention"
			title="This page didn't load"
			actions={
				<>
					<button type="button" className={primaryButtonClass} onClick={() => reset()}>
						Try again
					</button>
					<Link href="/" className={secondaryButtonClass}>
						Go to home
					</Link>
				</>
			}
		>
			Try again in a moment. If it keeps happening, let a fellowship administrator know which page you were on.
		</StatusPage>
	)
}

export default ErrorPage
