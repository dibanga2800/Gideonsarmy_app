import { FELLOWSHIP_TIME_ZONE } from '@/lib/dates/prayer-meeting'
import type { EventType } from '@/types/roles'

export const formatLondonDateTime = (value: Date | string) => {
	const date = value instanceof Date ? value : new Date(value)

	return new Intl.DateTimeFormat('en-GB', {
		timeZone: FELLOWSHIP_TIME_ZONE,
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(date)
}

export const eventTypeLabel = (type: EventType | 'PRAYER_MEETING') => {
	if (type === 'PRAYER_MEETING') {
		return 'Prayer meeting'
	}

	if (type === 'FELLOWSHIP') {
		return 'Fellowship'
	}

	if (type === 'SPECIAL') {
		return 'Special gathering'
	}

	if (type === 'OUTING') {
		return 'Outing'
	}

	return 'Other'
}
