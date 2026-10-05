import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
	getOwnAnniversaryPhotoUrl,
	getOwnPortraitUrl,
	getOwnProfile,
} from '@/server/services/member-service'
import {
	removeOwnAnniversaryPhotoAction,
	removeOwnPortraitAction,
	saveOwnAnniversaryPhotoAction,
	saveOwnProfileAction,
	saveOwnPortraitAction,
} from '@/server/actions/member-actions'
import { AlertNotice } from '@/components/alert-notice'
import { AnniversaryPhoto } from '@/components/anniversary-photo'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { MemberDirectoryFields } from '@/components/member-directory-fields'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { PortraitFileField } from '@/components/portrait-upload-form'
import {
	cardComfortClass,
	ddClass,
	dtClass,
	eyebrowClass,
	pageContentClass,
	primaryButtonClass,
	secondaryButtonClass,
	sectionHeadingClass,
} from '@/lib/ui'
import {
	formatDuesStartLabel,
	memberDisplayName,
	membershipStatusLabel,
	roleLabel,
} from '@/lib/members/display'

export const metadata: Metadata = {
	title: 'Your profile',
}

interface ProfilePageProps {
	searchParams: {
		photo?: string
		anniversaryPhoto?: string
		updated?: string
		error?: string
	}
}

const ProfilePage = async ({ searchParams }: ProfilePageProps) => {
	const profile = await getOwnProfile()

	if (!profile) {
		redirect('/login')
	}

	const portraitUrl = await getOwnPortraitUrl()
	const anniversaryPhotoUrl = await getOwnAnniversaryPhotoUrl()
	const photoMessage =
		searchParams.photo === 'saved'
			? 'Your portrait has been saved.'
			: searchParams.photo === 'removed'
				? 'Your portrait has been removed.'
				: null

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

			{photoMessage ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						{photoMessage}
					</AlertNotice>
				</div>
			) : null}

			{searchParams.photo === 'invalid' || searchParams.photo === 'save' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save portrait">
						Use a JPEG, PNG, or WebP photo. The app compresses it, and it must
						finish under 1 MB.
					</AlertNotice>
				</div>
			) : null}
			{searchParams.anniversaryPhoto === 'saved' || searchParams.anniversaryPhoto === 'removed' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						{searchParams.anniversaryPhoto === 'saved'
							? 'Your couple photo has been saved.'
							: 'Your couple photo has been removed.'}
					</AlertNotice>
				</div>
			) : null}
			{searchParams.anniversaryPhoto === 'invalid' || searchParams.anniversaryPhoto === 'save' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save couple photo">
						Use a JPEG, PNG, or WebP photo. The app compresses it, and it must
						finish under 1 MB.
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

			<section className={`${cardComfortClass} mt-8`} aria-labelledby="celebration-photos-heading">
				<p className={eyebrowClass}>Celebrations</p>
				<h2 id="celebration-photos-heading" className={`${sectionHeadingClass} mt-2`}>
					Your photos
				</h2>
				<div className="mt-6 grid gap-8 md:grid-cols-2">
					<section className="min-w-0 space-y-4" aria-labelledby="birthday-photo-heading">
						<h3 id="birthday-photo-heading" className="font-semibold text-navy-950">
							Birthday portrait
						</h3>
						<div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
							<CelebrantPortrait
								name={memberDisplayName(profile)}
								photoUrl={portraitUrl}
								size="large"
							/>
							<div className="min-w-0 flex-1">
								<form action={saveOwnPortraitAction} className="space-y-3">
									<PortraitFileField />
									<PendingSubmitButton className={primaryButtonClass} pendingLabel="Uploading…">
										Save birthday photo
									</PendingSubmitButton>
								</form>
								{portraitUrl ? (
									<form action={removeOwnPortraitAction} className="mt-3">
										<PendingSubmitButton className={secondaryButtonClass} pendingLabel="Removing…">
											Remove birthday photo
										</PendingSubmitButton>
									</form>
								) : null}
							</div>
						</div>
					</section>
					<section className="min-w-0 space-y-4" aria-labelledby="anniversary-photo-heading">
						<h3 id="anniversary-photo-heading" className="font-semibold text-navy-950">
							Wedding anniversary photo
						</h3>
						<AnniversaryPhoto
							name={`${memberDisplayName(profile)} and ${profile.spouse_name ?? 'spouse'}`}
							photoUrl={anniversaryPhotoUrl}
						/>
						<form action={saveOwnAnniversaryPhotoAction} className="space-y-3">
							<PortraitFileField
								name="anniversaryPortrait"
								label="Couple photo"
								helpText="A photo of you together, shown on wedding anniversary lists. JPEG, PNG, or WebP; compressed to under 1 MB."
							/>
							<PendingSubmitButton className={primaryButtonClass} pendingLabel="Uploading…">
								Save couple photo
							</PendingSubmitButton>
						</form>
						{anniversaryPhotoUrl ? (
							<form action={removeOwnAnniversaryPhotoAction}>
								<PendingSubmitButton className={secondaryButtonClass} pendingLabel="Removing…">
									Remove couple photo
								</PendingSubmitButton>
							</form>
						) : null}
					</section>
				</div>
			</section>

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
