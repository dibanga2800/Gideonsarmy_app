import { AnniversaryPhoto } from '@/components/anniversary-photo'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { cardClass, eyebrowClass } from '@/lib/ui'
import type { MonthCelebrations } from '@/server/services/celebration-service'

interface CelebrantsCardProps {
	celebrations: MonthCelebrations
}

const todaysCelebrants = (celebrations: MonthCelebrations) =>
	[...celebrations.birthdays, ...celebrations.anniversaries].filter((item) => item.isToday)

const celebrationIcon = (kind: 'birthday' | 'anniversary') => (kind === 'birthday' ? '🎂' : '💍')

const TodaysCelebrants = ({ celebrations }: CelebrantsCardProps) => {
	const items = todaysCelebrants(celebrations)
	if (items.length === 0) {
		return null
	}

	return (
		<section
			aria-label="Celebrating today"
			className="mt-5 rounded-xl border border-gold-500/50 bg-cream-50 p-4 shadow-sm sm:p-5"
		>
			<div className="flex items-center gap-2">
				<span aria-hidden="true" className="text-xl">
					🎉
				</span>
				<h3 className="font-serif text-lg font-semibold text-navy-950">
					Celebrating today
				</h3>
			</div>
			<ul className="mt-3 flex flex-wrap gap-2">
				{items.map((item) => (
					<li
						key={item.id}
						className="inline-flex items-center gap-2 rounded-full border border-gold-500/35 bg-white px-3 py-2 text-sm font-semibold text-navy-950"
					>
						<span aria-hidden="true">{celebrationIcon(item.kind)}</span>
						<span>{item.name}</span>
						<span className="sr-only">
							{item.kind === 'birthday' ? 'has a birthday today' : 'has a wedding anniversary today'}
						</span>
					</li>
				))}
			</ul>
		</section>
	)
}

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
		<div>
			<h3 className="font-medium text-navy-950">{title}</h3>
			{items.length === 0 ? (
				<p className="mt-2 text-sm leading-6 text-navy-800/80">{empty}</p>
			) : (
				<ul className="mt-3 space-y-3">
					{items.map((item) => (
						<li
							key={item.id}
							className={`flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center ${
								item.isToday ? 'border border-gold-500/50 bg-cream-50' : ''
							}`}
						>
							{kind === 'anniversary' ? (
								<AnniversaryPhoto name={item.name} photoUrl={item.anniversaryPhotoUrl} />
							) : (
								<CelebrantPortrait
									name={item.name}
									photoUrl={item.photoUrl}
									size="landscape"
								/>
							)}
							<div className="min-w-0">
								<p className="font-medium text-navy-950">{item.name}</p>
								<p className="text-sm text-navy-800/80">
									{item.label}
								</p>
							</div>
							{item.isToday ? (
								<span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-cream-50 sm:ml-auto">
									<span aria-hidden="true">{celebrationIcon(item.kind)}</span>
									Celebrating today
								</span>
							) : null}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

export const CelebrantsCard = ({ celebrations }: CelebrantsCardProps) => {
	return (
		<section className={cardClass}>
			<p className={eyebrowClass}>{celebrations.monthLabel}</p>
			<h2 className="mt-3 font-serif text-xl font-semibold text-navy-950">
				Birthdays and anniversaries
			</h2>
			<TodaysCelebrants celebrations={celebrations} />
			<div className="mt-5 grid gap-6 sm:grid-cols-2">
				<CelebrationList
					title="Birthdays"
					empty="No recorded birthdays fall in this month."
					items={celebrations.birthdays}
					kind="birthday"
				/>
				<CelebrationList
					title="Wedding anniversaries"
					empty="No recorded wedding anniversaries fall in this month."
					items={celebrations.anniversaries}
					kind="anniversary"
				/>
			</div>
		</section>
	)
}
