import { AnniversaryPhoto } from '@/components/anniversary-photo'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { cardClass, eyebrowClass } from '@/lib/ui'
import type { MonthCelebrations } from '@/server/services/celebration-service'

interface CelebrantsCardProps {
	celebrations: MonthCelebrations
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
						<li key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
									{item.isToday ? ' · today' : ''}
								</p>
							</div>
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
