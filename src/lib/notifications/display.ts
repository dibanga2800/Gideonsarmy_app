import type { NotificationType } from '@/types/roles'

export const notificationTypeLabel = (type: NotificationType) => {
	if (type === 'BIRTHDAY_CELEBRANT' || type === 'BIRTHDAY_FELLOWSHIP') {
		return 'Birthday'
	}

	if (type === 'ANNIVERSARY_CELEBRANT' || type === 'ANNIVERSARY_FELLOWSHIP') {
		return 'Anniversary'
	}

	if (type === 'EVENT_REMINDER') {
		return 'Event'
	}

	if (type === 'CELEBRATION_DIGEST') {
		return 'Celebration'
	}

	if (type === 'DUES_REMINDER') {
		return 'Dues'
	}

	return 'Notice'
}
