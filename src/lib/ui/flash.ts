export const FLASH_QUERY_KEYS = [
	'updated',
	'deleted',
	'invited',
	'reminded',
	'account',
	'emailed',
] as const

export type FlashQueryKey = (typeof FLASH_QUERY_KEYS)[number]

export type FlashKind = 'success' | 'danger'

export interface FlashMessage {
	kind: FlashKind
	title: string
	text: string
}

const FLASH_MESSAGES: Record<FlashQueryKey, FlashMessage> = {
	updated: {
		kind: 'success',
		title: 'Saved',
		text: 'Your changes have been saved.',
	},
	deleted: {
		kind: 'danger',
		title: 'Removed',
		text: 'That item has been removed.',
	},
	invited: {
		kind: 'success',
		title: 'Invitation sent',
		text: 'The invitation has been sent. He remains pending until you approve membership.',
	},
	reminded: {
		kind: 'success',
		title: 'Reminders queued',
		text: 'Outstanding-dues reminders have been queued.',
	},
	account: {
		kind: 'success',
		title: 'Saved',
		text: 'Payment instructions have been saved.',
	},
	emailed: {
		kind: 'success',
		title: 'Emails sent',
		text: 'Celebration emails have been queued and sent.',
	},
}

export const flashMessageFromSearch = (
	params: URLSearchParams | { get: (key: string) => string | null },
): FlashMessage | null => {
	for (const key of FLASH_QUERY_KEYS) {
		if (params.get(key) === '1') {
			return FLASH_MESSAGES[key]
		}
	}

	return null
}

export const stripFlashParams = (params: URLSearchParams) => {
	const next = new URLSearchParams(params)

	for (const key of FLASH_QUERY_KEYS) {
		next.delete(key)
	}

	return next
}

export const parseStoredFlashMessage = (value: unknown): FlashMessage | null => {
	if (!value || typeof value !== 'object') {
		return null
	}

	const record = value as Record<string, unknown>
	if (record.kind !== 'success' && record.kind !== 'danger') {
		return null
	}

	if (typeof record.title !== 'string' || record.title.length === 0) {
		return null
	}

	if (typeof record.text !== 'string' || record.text.length === 0) {
		return null
	}

	return {
		kind: record.kind,
		title: record.title,
		text: record.text,
	}
}
