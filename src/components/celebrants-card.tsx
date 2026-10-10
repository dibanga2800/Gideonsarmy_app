import { AnniversaryPhoto } from '@/components/anniversary-photo'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { SectionCard } from '@/components/section-card'
import { StatusBadge } from '@/components/status-badge'
import type { MonthCelebrations } from '@/server/services/celebration-service'

interface CelebrantsCardProps {
	celebrations: MonthCelebrations
}

const todaysCelebrants = (celebrations: MonthCelebrations) =>
	[...celebrations.birthdays, ...celebrations.anniversaries].filter((item) => item.isToday)

const CelebrationList = ({
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
		<div className="min-w-0">
			<h3 className="text-sm font-semibold text-navy-950">
				{title}
				<span className="ml-2 font-normal text-slate-500">{items.length}</span>
			</h3>
			{items.length === 0 ? (
				<p className="mt-3 text-sm leading-6 text-slate-500">{empty}</p>
			) : (
				<ul className="mt-2 divide-y divide-cream-100">
					{items.map((item) => (
						<li key={item.id} className="flex items-center gap-3 py-2.5">
							{kind === 'anniversary' ? (
								<AnniversaryPhoto name={item.name} photoUrl={item.anniversaryPhotoUrl} size="thumb" />
							) : (
								<CelebrantPortrait name={item.name} photoUrl={item.photoUrl} />
							)}
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-navy-950">{item.name}</p>
								<p className="text-[0.8125rem] text-slate-500">{item.label}</p>
							</div>
							{item.isToday ? <StatusBadge tone="brand">Today</StatusBadge> : null}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

/** This month's birthdays and anniversaries, with anyone celebrating today called out first. */
export const CelebrantsCard = ({ celebrations }: CelebrantsCardProps) => {
	const today = todaysCelebrants(celebrations)

	return (
		<SectionCard title={`Birthdays and anniversaries in ${celebrations.monthLabel}`}>
			{today.length > 0 ? (
				<div className="mb-5 rounded-lg bg-navy-950 px-4 py-3.5 text-white">
					<p className="text-sm font-semibold text-gold-300">Celebrating today</p>
					<ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
						{today.map((item) => (
							<li key={`${item.kind}-${item.id}`}>
								{item.name}
								<span className="font-normal text-white/70">
									{item.kind === 'birthday' ? ', birthday' : ', wedding anniversary'}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
			<div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
				<CelebrationList
					title="Birthdays"
					empty="No birthdays recorded for this month."
					items={celebrations.birthdays}
					kind="birthday"
				/>
				<CelebrationList
					title="Wedding anniversaries"
					empty="No anniversaries recorded for this month."
					items={celebrations.anniversaries}
					kind="anniversary"
				/>
			</div>
		</SectionCard>
	)
}
