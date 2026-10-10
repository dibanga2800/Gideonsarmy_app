import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAccess } from '@/server/services/auth-service'
import { StatusPage } from '@/components/status-page'
import { primaryButtonClass } from '@/lib/ui'

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

	if (access.status === 'inactive') {
		return (
			<StatusPage icon="info" title="Membership inactive">
				You&apos;re signed in, but this membership is marked inactive. If that&apos;s unexpected,
				speak to a fellowship administrator.
			</StatusPage>
		)
	}

	return (
		<StatusPage
			icon="clock"
			tone="attention"
			title="Waiting for approval"
			actions={
				<Link href="/profile" className={primaryButtonClass}>
					Complete your profile
				</Link>
			}
		>
			You&apos;re signed in. An administrator needs to approve your membership before dues and
			fellowship records open up. Filling in your profile now helps them confirm who you are.
		</StatusPage>
	)
}

export default PendingPage
