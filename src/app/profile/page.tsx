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
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { AnniversaryPhoto } from '@/components/anniversary-photo'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { MemberDirectoryFields } from '@/components/member-directory-fields'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { PortraitFileField } from '@/components/portrait-upload-form'
import { SectionCard } from '@/components/section-card'
import { MembershipBadge, RoleBadge } from '@/components/status-badge'
import {
	dangerOutlineButtonClass,
	ddClass,
	dtClass,
	pageContentClass,
	primaryButtonClass,
	smallButtonClass,
} from '@/lib/ui'
import { formatDuesStartLabel, memberDisplayName } from '@/lib/members/display'

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

const PHOTO_RULES = 'Use a JPEG, PNG or WebP photo. It is compressed in your browser and must end up under 1 MB.'

const ProfilePage = async ({ searchParams }: ProfilePageProps) => {
	const profile = await getOwnProfile()

	if (!profile) {
		redirect('/login')
	}

	const [portraitUrl, anniversaryPhotoUrl] = await Promise.all([getOwnPortraitUrl(), getOwnAnniversaryPhotoUrl()])
	const displayName = memberDisplayName(profile) || profile.email
	const isPending = profile.membership_status === 'PENDING'

	return (
		<main className={pageContentClass}>
			<PageHeader
				title="Your profile"
				description={
					isPending
						? 'Fill in your details so an administrator can confirm your membership.'
						: 'Visible to you and to fellowship administrators. Your birthday and anniversary feed the celebrations list.'
				}
			/>

			<NoticeStack>
				{searchParams.updated === '1' ? (
					<AlertNotice kind="success" title="Profile saved">
						Your details have been updated.
					</AlertNotice>
				) : null}
				{searchParams.error ? (
					<AlertNotice kind="danger" title="Profile not saved">
						Check your details and try again.
					</AlertNotice>
				) : null}
				{searchParams.photo === 'saved' || searchParams.photo === 'removed' ? (
					<AlertNotice kind="success" title={searchParams.photo === 'saved' ? 'Portrait saved' : 'Portrait removed'}>
						{searchParams.photo === 'saved'
							? 'It will show beside your name on the birthday list.'
							: 'Your initials will show instead.'}
					</AlertNotice>
				) : null}
				{searchParams.photo === 'invalid' || searchParams.photo === 'save' ? (
					<AlertNotice kind="danger" title="Portrait not saved">
						{PHOTO_RULES}
					</AlertNotice>
				) : null}
				{searchParams.anniversaryPhoto === 'saved' || searchParams.anniversaryPhoto === 'removed' ? (
					<AlertNotice
						kind="success"
						title={searchParams.anniversaryPhoto === 'saved' ? 'Couple photo saved' : 'Couple photo removed'}
					>
						{searchParams.anniversaryPhoto === 'saved'
							? 'It will show on the wedding anniversary list.'
							: 'The anniversary list will show a placeholder instead.'}
					</AlertNotice>
				) : null}
				{searchParams.anniversaryPhoto === 'invalid' || searchParams.anniversaryPhoto === 'save' ? (
					<AlertNotice kind="danger" title="Couple photo not saved">
						{PHOTO_RULES}
					</AlertNotice>
				) : null}
			</NoticeStack>

			<div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
				<aside className="rounded-xl border border-line bg-white p-5 text-center shadow-card lg:sticky lg:top-8">
					<div className="flex justify-center">
						<CelebrantPortrait name={displayName} photoUrl={portraitUrl} size="large" />
					</div>
					<p className="mt-4 font-semibold text-navy-950">{displayName}</p>
					<p className="break-all text-sm text-slate-500">{profile.email}</p>
					<div className="mt-3 flex flex-wrap justify-center gap-2">
						<MembershipBadge status={profile.membership_status} />
						<RoleBadge role={profile.role} />
					</div>
					<dl className="mt-5 border-t border-line pt-4 text-left">
						<dt className={dtClass}>Dues</dt>
						<dd className={ddClass}>{formatDuesStartLabel(profile.joined_at)}</dd>
					</dl>
					<p className="mt-4 text-left text-[0.8125rem] leading-5 text-slate-500">
						Only an administrator can change your role, membership status or dues start.
					</p>
				</aside>

				<div className="space-y-5">
					<SectionCard title="Personal details" description="Birthday is day and month only. Your age is never recorded.">
						<form action={saveOwnProfileAction} className="space-y-6">
							<MemberDirectoryFields profile={profile} />
							<div className="flex justify-end border-t border-line pt-5">
								<PendingSubmitButton className={primaryButtonClass} pendingLabel="Saving…">
									Save details
								</PendingSubmitButton>
							</div>
						</form>
					</SectionCard>

					<SectionCard
						title="Celebration photos"
						description="Optional. Shown only to signed-in members on the celebrations list, never in emails."
					>
						<div className="grid gap-8 md:grid-cols-2">
							<section className="min-w-0" aria-labelledby="birthday-photo-heading">
								<h3 id="birthday-photo-heading" className="text-sm font-semibold text-navy-950">
									Birthday portrait
								</h3>
								<div className="mt-3 w-full max-w-[12rem]">
									<CelebrantPortrait name={displayName} photoUrl={portraitUrl} size="landscape" />
								</div>
								<form action={saveOwnPortraitAction} className="mt-4 space-y-3">
									<PortraitFileField label="Choose a portrait" />
									<PendingSubmitButton className={`${primaryButtonClass} ${smallButtonClass}`} pendingLabel="Uploading…">
										Upload portrait
									</PendingSubmitButton>
								</form>
								{portraitUrl ? (
									<form action={removeOwnPortraitAction} className="mt-2">
										<PendingSubmitButton className={`${dangerOutlineButtonClass} ${smallButtonClass}`} pendingLabel="Removing…">
											Remove portrait
										</PendingSubmitButton>
									</form>
								) : null}
							</section>
							<section className="min-w-0" aria-labelledby="anniversary-photo-heading">
								<h3 id="anniversary-photo-heading" className="text-sm font-semibold text-navy-950">
									Wedding anniversary photo
								</h3>
								<div className="mt-3 w-full max-w-[12rem]">
									<AnniversaryPhoto
										name={`${displayName} and ${profile.spouse_name ?? 'spouse'}`}
										photoUrl={anniversaryPhotoUrl}
									/>
								</div>
								<form action={saveOwnAnniversaryPhotoAction} className="mt-4 space-y-3">
									<PortraitFileField
										name="anniversaryPortrait"
										label="Choose a photo of you together"
										helpText="JPEG, PNG or WebP. Compressed to under 1 MB."
									/>
									<PendingSubmitButton className={`${primaryButtonClass} ${smallButtonClass}`} pendingLabel="Uploading…">
										Upload couple photo
									</PendingSubmitButton>
								</form>
								{anniversaryPhotoUrl ? (
									<form action={removeOwnAnniversaryPhotoAction} className="mt-2">
										<PendingSubmitButton className={`${dangerOutlineButtonClass} ${smallButtonClass}`} pendingLabel="Removing…">
											Remove couple photo
										</PendingSubmitButton>
									</form>
								) : null}
							</section>
						</div>
					</SectionCard>
				</div>
			</div>
		</main>
	)
}

export default ProfilePage
