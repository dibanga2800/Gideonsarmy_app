import Link from 'next/link'
import { eyebrowClass, pageLeadClass, pageNarrowClass, pageTitleClass, primaryButtonClass } from '@/lib/ui'

const NotFoundPage = () => {
	return (
		<main className={pageNarrowClass}>
			<p className={eyebrowClass}>Gideon&apos;s Army</p>
			<h1 className={`${pageTitleClass} mt-3`}>Page not found</h1>
			<p className={pageLeadClass}>
				That page does not exist, or you do not have access to it.
			</p>
			<Link href="/" className={`${primaryButtonClass} mt-8`}>
				Back to home
			</Link>
		</main>
	)
}

export default NotFoundPage
