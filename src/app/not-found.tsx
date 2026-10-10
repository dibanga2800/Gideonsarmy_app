import Link from 'next/link'
import { StatusPage } from '@/components/status-page'
import { primaryButtonClass } from '@/lib/ui'

const NotFoundPage = () => {
	return (
		<StatusPage
			icon="search"
			title="Page not found"
			actions={
				<Link href="/" className={primaryButtonClass}>
					Go to home
				</Link>
			}
		>
			That page doesn&apos;t exist, or your account doesn&apos;t have access to it.
		</StatusPage>
	)
}

export default NotFoundPage
