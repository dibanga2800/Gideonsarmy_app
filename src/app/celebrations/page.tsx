import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AlertNotice } from '@/components/alert-notice'
import { AnniversaryPhoto } from '@/components/anniversary-photo'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { getCelebrationBoard } from '@/server/services/celebration-service'
import { getAdminEmailStatus } from '@/server/services/notification-admin-service'
import {
	sendMonthCelebrationEmailsAction,
	sendTodayCelebrationEmailsAction,
} from '@/server/actions/notification-actions'
import { getCurrentSession } from '@/server/services/auth-service'
import { canAccessAdmin } from '@/lib/auth/access'
import type { MonthCelebrations } from '@/lib/celebrations/month-list'
import {
	cardClass,
	eyebrowClass,
	helpTextClass,
	pageMainClass,
	primaryButtonClass,
	secondaryButtonClass,
} from '@/lib/ui'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'

export const metadata: Metadata = {
	title: 'Birthdays and anniversaries',
}

interface CelebrationsPageProps {
	searchParams: {
		emailed?: string
		sent?: string
		error?: string
	}
}

const CelebrationColumn = ({
	title,
	empty,
	items,
	kind,
}: {
	title: string
	empty: string
	items: MonthCelebrations['birthdays']
	kind: 'birthday' | 'anniversary'
}) => {
	return (
		<section className={cardClass}>
			<h2 className="font-serif text-xl font-semibold text-navy-950">{title}</h2>
			{items.length === 0 ? (
				<p className="mt-3 text-sm leading-6 text-navy-800/80">{empty}</p>
			) : (
				<ul className="mt-4 divide-y divide-cream-100">
					{items.map((item) => (
						<li key={item.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
							{kind === 'anniversary' ? (
								<AnniversaryPhoto name={item.name} photoUrl={item.anniversaryPhotoUrl} />
							) : (
								<CelebrantPortrait name={item.name} photoUrl={item.photoUrl} />
							)}
							<div className="min-w-0">
								<p className="font-medium text-navy-950">{item.name}</p>
								<p className="mt-1 text-sm text-navy-800/80">
									{item.label}
									{item.isToday ? ' · celebrating today' : ''}
								</p>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}

const MonthBlock = ({ celebrations }: { celebrations: MonthCelebrations }) => {
	return (
		<section className="space-y-6">
			<h2 className="font-serif text-2xl font-semibold text-navy-950">
				{celebrations.monthLabel}
			</h2>
			<div className="grid gap-6 lg:grid-cols-2">
				<CelebrationColumn
					title="Birthdays"
					empty="No recorded birthdays fall in this month."
					items={celebrations.birthdays}
					kind="birthday"
				/>
				<CelebrationColumn
					title="Wedding anniversaries"
					empty="No recorded wedding anniversaries fall in this month."
					items={celebrations.anniversaries}
					kind="anniversary"
				/>
			</div>
		</section>
	)
}

const CelebrationsPage = async ({ searchParams }: CelebrationsPageProps) => {
	const board = await getCelebrationBoard()

	if (!board) {
		redirect('/login')
	}

	const session = await getCurrentSession()
	const emailStatus = canAccessAdmin(session.access) ? await getAdminEmailStatus() : null
	const sentCount = Number(searchParams.sent ?? '')

	return (
		<main className={pageMainClass}>
			<PageHeader
				eyebrow="Fellowship"
				title="Birthdays and anniversaries"
				lead="Taken from each approved member's profile. Birth year is not shown. Dates use Europe/London."
			/>

			{searchParams.emailed === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Emails queued">
						{Number.isFinite(sentCount) && sentCount >= 0
							? `${sentCount} celebration email${sentCount === 1 ? '' : 's'} sent or marked sent.`
							: 'Celebration emails have been queued and sent.'}
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error === 'email' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Email not sent">
						Celebration emails could not be sent. Check email is configured, and
						that at least one active member has a birthday or anniversary in
						scope.
					</AlertNotice>
				</div>
			) : null}

			{emailStatus ? (
				<section className={`${cardClass} mt-8 space-y-5`}>
					<p className={eyebrowClass}>Administration</p>
					<h2 className="font-serif text-xl font-semibold text-navy-950">
						Celebration emails
					</h2>
					<p className="text-sm leading-6 text-navy-800">
						Delivery: <span className="font-semibold">{emailStatus.label}</span>
					</p>
					<p className={helpTextClass}>{emailStatus.detail}</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						<form action={sendTodayCelebrationEmailsAction}>
							<PendingSubmitButton
								className={primaryButtonClass}
								disabled={!emailStatus.ready}
								pendingLabel="Sending…"
							>
								Send today&apos;s emails
							</PendingSubmitButton>
						</form>
						<form action={sendMonthCelebrationEmailsAction}>
							<PendingSubmitButton
								className={secondaryButtonClass}
								disabled={!emailStatus.ready}
								pendingLabel="Sending…"
							>
								Send this month&apos;s emails
							</PendingSubmitButton>
						</form>
					</div>
					<p className={helpTextClass}>
						Today sends only brothers celebrating today or in seven days. This
						month sends every birthday and anniversary listed above for the
						current month, so you can test without waiting for the day.
					</p>
				</section>
			) : null}

			<div className="mt-10 space-y-12">
				<MonthBlock celebrations={board.current} />
				<MonthBlock celebrations={board.upcoming} />
			</div>
		</main>
	)
}

export default CelebrationsPage
