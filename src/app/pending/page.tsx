import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAccess } from '@/server/services/auth-service'
import { PageHeader } from '@/components/page-header'
import {
	cardComfortClass,
	pageNarrowClass,
	primaryButtonClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Membership pending',
}

const PendingPage = async () => {
	const access = await getCurrentAccess()

	if (access.status === 'unauthenticated') {
		redirect('/login')
	}

	if (access.status === 'member') {
		redirect('/dashboard')
	}

	const title =
		access.status === 'inactive' ? 'Membership inactive' : 'Membership pending approval'

	const body =
		access.status === 'inactive'
			? 'Your account is signed in, but this membership is inactive. Contact a fellowship administrator if that is unexpected.'
			: 'Your Google account is signed in, but membership is not approved yet. Complete your profile if you have been invited, then wait for an administrator to approve access before you can view dues or fellowship records.'

	return (
		<main className={pageNarrowClass}>
			<PageHeader eyebrow="Membership" title={title} />
			<section className={`${cardComfortClass} mt-8`}>
				<p className="max-w-2xl text-base leading-7 text-navy-800/80">{body}</p>
				{access.status === 'pending' ? (
					<p className="mt-6">
						<Link href="/profile" className={primaryButtonClass}>
							Complete your profile
						</Link>
					</p>
				) : null}
			</section>
		</main>
	)
}

export default PendingPage
