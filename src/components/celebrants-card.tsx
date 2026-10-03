import Link from 'next/link'
import { CelebrantPortrait } from '@/components/celebrant-portrait'
import { cardClass, eyebrowClass, navLinkClass } from '@/lib/ui'
import type { MonthCelebrations } from '@/server/services/celebration-service'

interface CelebrantsCardProps {
	celebrations: MonthCelebrations
}

const CelebrationList = ({
	title,
	empty,
	items,
}: {
	title: string
	empty: string
	items: MonthCelebrations['birthdays']
}) => {
	return (
		<div>
			<h3 className="font-medium text-navy-950">{title}</h3>
			{items.length === 0 ? (
				<p className="mt-2 text-sm leading-6 text-navy-800/80">{empty}</p>
			) : (
				<ul className="mt-3 space-y-3">
					{items.map((item) => (
						<li key={item.id} className="flex items-center gap-3">
							<CelebrantPortrait name={item.name} photoUrl={item.photoUrl} />
							<div>
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
				/>
				<CelebrationList
					title="Wedding anniversaries"
					empty="No recorded wedding anniversaries fall in this month."
					items={celebrations.anniversaries}
				/>
			</div>
			<p className="mt-5">
				<Link href="/celebrations" className={navLinkClass}>
					This month and next
				</Link>
			</p>
		</section>
	)
}
