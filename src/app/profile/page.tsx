import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOwnProfile } from '@/server/services/member-service'
import { saveOwnProfileAction } from '@/server/actions/member-actions'
import { AlertNotice } from '@/components/alert-notice'
import { MemberDirectoryFields } from '@/components/member-directory-fields'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import {
	cardComfortClass,
	ddClass,
	dtClass,
	eyebrowClass,
	pageContentClass,
	primaryButtonClass,
	sectionHeadingClass,
} from '@/lib/ui'
import {
	formatDuesStartLabel,
	membershipStatusLabel,
	roleLabel,
} from '@/lib/members/display'

export const metadata: Metadata = {
	title: 'Your profile',
}

interface ProfilePageProps {
	searchParams: {
		updated?: string
		error?: string
	}
}

const ProfilePage = async ({ searchParams }: ProfilePageProps) => {
	const profile = await getOwnProfile()

	if (!profile) {
		redirect('/login')
	}

	return (
		<main className={pageContentClass}>
			<PageHeader
				eyebrow="Your record"
				title="Your profile"
				lead={
					profile.membership_status === 'PENDING'
						? 'Complete these details so an administrator can review your membership. You cannot change your role, membership status, or dues start.'
						: 'These details are visible to you and to fellowship administrators. You cannot change your role, membership status, or dues start.'
				}
				leadWide
			/>

			{searchParams.updated === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						Your profile has been saved.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save">
						Your profile could not be saved. Check the details and try again.
					</AlertNotice>
				</div>
			) : null}

			<dl className={`${cardComfortClass} mt-8 grid gap-4 text-sm sm:grid-cols-3`}>
				<div>
					<dt className={dtClass}>Email</dt>
					<dd className={ddClass}>{profile.email}</dd>
				</div>
				<div>
					<dt className={dtClass}>Membership</dt>
					<dd className={ddClass}>
						{roleLabel(profile.role)} · {membershipStatusLabel(profile.membership_status)}
					</dd>
				</div>
				<div>
					<dt className={dtClass}>Dues</dt>
					<dd className={ddClass}>{formatDuesStartLabel(profile.joined_at)}</dd>
				</div>
			</dl>

			<form action={saveOwnProfileAction} className={`${cardComfortClass} mt-8 space-y-6`}>
				<div>
					<p className={eyebrowClass}>Directory</p>
					<h2 className={`${sectionHeadingClass} mt-2`}>Personal details</h2>
				</div>
				<MemberDirectoryFields profile={profile} />
				<PendingSubmitButton className={primaryButtonClass} pendingLabel="Saving…">
					Save profile
				</PendingSubmitButton>
			</form>
		</main>
	)
}

export default ProfilePage
