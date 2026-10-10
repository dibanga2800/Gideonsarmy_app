import { FELLOWSHIP_TIME_ZONE } from '@/lib/dates/prayer-meeting'

const part = (date: Date, options: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat('en-GB', { timeZone: FELLOWSHIP_TIME_ZONE, ...options }).format(date)

export const formatLondonTime = (value: Date | string) =>
	part(value instanceof Date ? value : new Date(value), { hour: 'numeric', minute: '2-digit', hour12: true })

export const formatLondonWeekdayDate = (value: Date | string) =>
	part(value instanceof Date ? value : new Date(value), {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	})

interface DateBlockProps {
	value: Date | string
	tone?: 'light' | 'dark'
}

/**
 * Calendar-style month and day in fellowship (London) time. On light surfaces
 * the month sits on a navy band, like a tear-off calendar page.
 */
export const DateBlock = ({ value, tone = 'light' }: DateBlockProps) => {
	const date = value instanceof Date ? value : new Date(value)
	const month = part(date, { month: 'short' })
	const day = part(date, { day: 'numeric' })

	if (tone === 'dark') {
		return (
			<div
				className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-white/10 text-center ring-1 ring-inset ring-white/15"
				aria-hidden="true"
			>
				<span className="text-[0.6875rem] font-semibold text-gold-300">{month}</span>
				<span className="text-2xl font-semibold leading-none text-white">{day}</span>
			</div>
		)
	}

	return (
		<div
			className="flex h-16 w-14 shrink-0 flex-col overflow-hidden rounded-lg bg-white text-center ring-1 ring-inset ring-line"
			aria-hidden="true"
		>
			<span className="bg-navy-900 py-0.5 text-[0.6875rem] font-semibold text-gold-300">{month}</span>
			<span className="flex flex-1 items-center justify-center text-2xl font-semibold leading-none text-navy-950">
				{day}
			</span>
		</div>
	)
}
