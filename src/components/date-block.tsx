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

/** Calendar-style month and day, shown in fellowship (London) time. */
export const DateBlock = ({ value, tone = 'light' }: DateBlockProps) => {
	const date = value instanceof Date ? value : new Date(value)
	const dark = tone === 'dark'

	return (
		<div
			className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg text-center ${
				dark ? 'bg-white/10 ring-1 ring-inset ring-white/15' : 'bg-white ring-1 ring-inset ring-line'
			}`}
			aria-hidden="true"
		>
			<span className={`text-[0.6875rem] font-semibold ${dark ? 'text-gold-300' : 'text-gold-600'}`}>
				{part(date, { month: 'short' })}
			</span>
			<span className={`text-2xl font-semibold leading-none ${dark ? 'text-white' : 'text-navy-950'}`}>
				{part(date, { day: 'numeric' })}
			</span>
		</div>
	)
}
