import type { MonthCelebrations } from '@/lib/celebrations/month-list'

export interface CelebrationDigestNotice {
	memberId: string
	type: 'CELEBRATION_DIGEST'
	title: string
	message: string
	scheduledAt: string
	idempotencyKey: string
}

const padMonth = (month: number) => String(month).padStart(2, '0')

export const monthCelebrationDigestKey = (
	recipientId: string,
	year: number,
	month: number,
	kind: 'current' | 'upcoming',
) => `celebration-digest:${kind}:${year}-${padMonth(month)}:${recipientId}`

const linesFor = (celebrations: MonthCelebrations) => {
	const lines: string[] = []

	if (celebrations.birthdays.length > 0) {
		lines.push('Birthdays')
		for (const item of celebrations.birthdays) {
			lines.push(`${item.name} — ${item.label}`)
		}
	}

	if (celebrations.anniversaries.length > 0) {
		if (lines.length > 0) {
			lines.push('')
		}

		lines.push('Wedding anniversaries')
		for (const item of celebrations.anniversaries) {
			lines.push(`${item.name} — ${item.label}`)
		}
	}

	return lines.join('\n')
}

const digestForMonth = (
	recipientId: string,
	celebrations: MonthCelebrations,
	kind: 'current' | 'upcoming',
	now: Date,
): CelebrationDigestNotice | null => {
	if (celebrations.birthdays.length === 0 && celebrations.anniversaries.length === 0) {
		return null
	}

	const title =
		kind === 'current'
			? `Celebrations in ${celebrations.monthLabel}`
			: `Coming in ${celebrations.monthLabel}`

	return {
		memberId: recipientId,
		type: 'CELEBRATION_DIGEST',
		title,
		message: linesFor(celebrations),
		scheduledAt: now.toISOString(),
		idempotencyKey: monthCelebrationDigestKey(
			recipientId,
			celebrations.year,
			celebrations.month,
			kind,
		),
	}
}

export const buildMonthCelebrationDigestsForRecipient = (
	recipientId: string,
	current: MonthCelebrations,
	upcoming: MonthCelebrations,
	now = new Date(),
): CelebrationDigestNotice[] => {
	return [
		digestForMonth(recipientId, current, 'current', now),
		digestForMonth(recipientId, upcoming, 'upcoming', now),
	].filter((item): item is CelebrationDigestNotice => item !== null)
}
