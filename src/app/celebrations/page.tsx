import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { AnniversaryPhoto } from '@/components/anniversary-photo'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { SectionCard } from '@/components/section-card'
import { StatusBadge } from '@/components/status-badge'
import { getCelebrationBoard } from '@/server/services/celebration-service'
import { getAdminEmailStatus } from '@/server/services/notification-admin-service'
import {
	sendMonthCelebrationEmailsAction,
	sendTodayCelebrationEmailsAction,
} from '@/server/actions/notification-actions'
import { getCurrentSession } from '@/server/services/auth-service'
import { canAccessAdmin } from '@/lib/auth/access'
import type { Celebrant, MonthCelebrations } from '@/lib/celebrations/month-list'
import { pageMainClass, primaryButtonClass, secondaryButtonClass } from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Celebrations',
}

interface CelebrationsPageProps {
	searchParams: {
		emailed?: string
		sent?: string
		error?: string
	}
}

const CelebrantCard = ({ item, kind }: { item: Celebrant; kind: 'birthday' | 'anniversary' }) => (
	<li
		className={`overflow-hidden rounded-xl border bg-white ${item.isToday ? 'border-navy-900 ring-2 ring-navy-900/15' : 'border-line'}`}
	>
		{kind === 'anniversary' ? (
			<AnniversaryPhoto name={item.name} photoUrl={item.anniversaryPhotoUrl} />
		) : (
			<CelebrantPortrait name={item.name} photoUrl={item.photoUrl} size="landscape" />
		)}
		<div className="flex items-start justify-between gap-2 p-3.5">
			<div className="min-w-0">
				<p className="truncate text-sm font-semibold text-navy-950">{item.name}</p>
				<p className="text-[0.8125rem] text-slate-500">{item.label}</p>
			</div>
			{item.isToday ? <StatusBadge tone="brand">Today</StatusBadge> : null}
		</div>
	</li>
)

const CelebrationGroup = ({
	title,
	empty,
	items,
	kind,
}: {
	title: string
	empty: string
	items: Celebrant[]
	kind: 'birthday' | 'anniversary'
}) => (
	<div>
		<h3 className="text-sm font-semibold text-navy-950">
			{title}
			<span className="ml-2 font-normal text-slate-500">{items.length}</span>
		</h3>
		{items.length === 0 ? (
			<p className="mt-2 text-sm text-slate-500">{empty}</p>
		) : (
			<ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
				{items.map((item) => (
					<CelebrantCard key={item.id} item={item} kind={kind} />
				))}
			</ul>
		)}
	</div>
)

const MonthBlock = ({ celebrations, current }: { celebrations: MonthCelebrations; current: boolean }) => {
	const total = celebrations.birthdays.length + celebrations.anniversaries.length

	return (
		<SectionCard
			title={celebrations.monthLabel}
			description={current ? 'This month' : 'Next month'}
		>
			{total === 0 ? (
				<EmptyState icon="gift" title="No celebrations recorded" compact>
					Birthdays and anniversaries come from members&apos; profiles.
				</EmptyState>
			) : (
				<div className="space-y-7">
					<CelebrationGroup
						title="Birthdays"
						empty="No birthdays recorded for this month."
						items={celebrations.birthdays}
						kind="birthday"
					/>
					<CelebrationGroup
						title="Wedding anniversaries"
						empty="No anniversaries recorded for this month."
						items={celebrations.anniversaries}
						kind="anniversary"
					/>
				</div>
			)}
		</SectionCard>
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
				title="Celebrations"
				description="Birthdays and wedding anniversaries from members' profiles. Birth years are never shown."
			/>

			<NoticeStack>
				{searchParams.emailed === '1' ? (
					<AlertNotice kind="success" title="Celebration emails sent">
						{Number.isFinite(sentCount) && sentCount >= 0
							? `${sentCount} celebration email${sentCount === 1 ? '' : 's'} sent or marked as sent.`
							: 'Celebration emails have been sent.'}
					</AlertNotice>
				) : null}
				{searchParams.error === 'email' ? (
					<AlertNotice kind="danger" title="Celebration emails not sent">
						Check that email delivery is set up and that at least one active member has a birthday or
						anniversary in range.
					</AlertNotice>
				) : null}
			</NoticeStack>

			<div className="space-y-5">
				<MonthBlock celebrations={board.current} current />
				<MonthBlock celebrations={board.upcoming} current={false} />
			</div>

			{emailStatus ? (
				<SectionCard
					title="Celebration emails"
					className="mt-5"
					description={
						<>
							Sent automatically at 6am UK time on the day. The celebrant gets a personal greeting and
							every other active member is invited to celebrate with him. Nothing is sent in advance.
						</>
					}
					actions={
						<StatusBadge tone={emailStatus.ready ? 'positive' : 'warning'}>{emailStatus.label}</StatusBadge>
					}
				>
					<p className="text-sm text-slate-600">{emailStatus.detail}</p>
					<div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
						<form action={sendTodayCelebrationEmailsAction}>
							<PendingSubmitButton
								className={primaryButtonClass}
								disabled={!emailStatus.ready}
								pendingLabel="Sending…"
							>
								Send today&apos;s emails now
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
					<p className="mt-3 text-[0.8125rem] leading-5 text-slate-500">
						Use &ldquo;today&rdquo; to retry a missed automatic run. &ldquo;This month&rdquo; emails everyone listed
						for the current month and is meant for testing.
					</p>
				</SectionCard>
			) : null}
		</main>
	)
}

export default CelebrationsPage
