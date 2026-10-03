import {
	anniversaryMonthDay,
	formatCelebrationDay,
	formatMonthYear,
	isCelebrationOnLondonDate,
} from '@/lib/dates/celebration'
import { memberDisplayName } from '@/lib/members/display'

export interface CelebrationSource {
	id: string
	first_name: string
	last_name: string
	birth_month: number | null
	birth_day: number | null
	anniversary_month?: number | null
	anniversary_day?: number | null
	wedding_anniversary?: string | null
	spouse_name: string | null
	photoUrl?: string | null
}

export interface Celebrant {
	id: string
	name: string
	label: string
	isToday: boolean
	kind: 'birthday' | 'anniversary'
	photoUrl: string | null
}

export interface MonthCelebrations {
	year: number
	month: number
	monthLabel: string
	birthdays: Celebrant[]
	anniversaries: Celebrant[]
}

const byDayThenName = (left: Celebrant, right: Celebrant) => {
	const day = left.label.localeCompare(right.label)
	return day !== 0 ? day : left.name.localeCompare(right.name)
}

const anniversaryOf = (row: CelebrationSource) => {
	if (row.anniversary_month && row.anniversary_day) {
		return { month: row.anniversary_month, day: row.anniversary_day }
	}

	return anniversaryMonthDay(row.wedding_anniversary ?? null)
}

export const monthCelebrationsFromSources = (
	rows: CelebrationSource[],
	year: number,
	month: number,
	now = new Date(),
): MonthCelebrations => {
	const birthdays: Celebrant[] = []
	const anniversaries: Celebrant[] = []

	for (const row of rows) {
		if (row.birth_month === month && row.birth_day) {
			const day = formatCelebrationDay(row.birth_month, row.birth_day)
			if (day) {
				birthdays.push({
					id: `birthday-${row.id}`,
					name: memberDisplayName(row),
					label: day,
					isToday: isCelebrationOnLondonDate(row.birth_month, row.birth_day, now),
					kind: 'birthday',
					photoUrl: row.photoUrl ?? null,
				})
			}
		}

		const anniversary = anniversaryOf(row)
		if (anniversary && anniversary.month === month) {
			const day = formatCelebrationDay(anniversary.month, anniversary.day)
			if (day) {
				anniversaries.push({
					id: `anniversary-${row.id}`,
					name: row.spouse_name
						? `${memberDisplayName(row)} and ${row.spouse_name}`
						: memberDisplayName(row),
					label: day,
					isToday: isCelebrationOnLondonDate(anniversary.month, anniversary.day, now),
					kind: 'anniversary',
					photoUrl: row.photoUrl ?? null,
				})
			}
		}
	}

	return {
		year,
		month,
		monthLabel: formatMonthYear(year, month),
		birthdays: birthdays.sort(byDayThenName),
		anniversaries: anniversaries.sort(byDayThenName),
	}
}

export const combinedCelebrants = (celebrations: MonthCelebrations) =>
	[...celebrations.birthdays, ...celebrations.anniversaries].sort(byDayThenName)
