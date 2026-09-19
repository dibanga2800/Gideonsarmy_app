import { z } from 'zod'
import { londonDateAndTimeToUtc } from '@/lib/dates/prayer-meeting'
import { logEvent } from '@/lib/logging'
import { EVENT_TYPES } from '@/types/roles'
import type { FellowshipEvent } from '@/types/database'

const emptyToNull = (value: unknown) => {
	if (typeof value !== 'string') {
		return value
	}

	const trimmed = value.trim()
	return trimmed === '' ? null : trimmed
}

export const EVENT_SELECT_COLUMNS =
	'id, title, description, event_type, start_at, end_at, is_recurring, created_at, updated_at'

export const eventSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).max(120),
	description: z.string().max(2000).nullable(),
	event_type: z.enum(EVENT_TYPES),
	start_at: z.string().min(1),
	end_at: z.string().min(1).nullable(),
	is_recurring: z.boolean(),
	created_at: z.string().min(1),
	updated_at: z.string().min(1),
})

export const eventIdSchema = z.string().uuid()

export const eventInputSchema = z
	.object({
		title: z.string().trim().min(1).max(120),
		description: z.preprocess(emptyToNull, z.string().max(2000).nullable()),
		event_type: z.enum(EVENT_TYPES),
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid start date'),
		startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Enter a valid start time'),
		endDate: z.preprocess(emptyToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
		endTime: z.preprocess(emptyToNull, z.string().regex(/^\d{2}:\d{2}$/).nullable()),
	})
	.superRefine((value, context) => {
		const start = londonDateAndTimeToUtc(value.startDate, value.startTime)

		if (!start) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['startDate'],
				message: 'Enter a valid start date and time',
			})
			return
		}

		if ((value.endDate === null) !== (value.endTime === null)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['endTime'],
				message: 'Enter both an end date and time, or leave both empty',
			})
			return
		}

		if (value.endDate && value.endTime) {
			const end = londonDateAndTimeToUtc(value.endDate, value.endTime)

			if (!end) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['endDate'],
					message: 'Enter a valid end date and time',
				})
				return
			}

			if (end.getTime() <= start.getTime()) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['endDate'],
					message: 'The end must be after the start',
				})
			}
		}
	})
	.transform((value) => {
		const start = londonDateAndTimeToUtc(value.startDate, value.startTime)
		const end =
			value.endDate && value.endTime
				? londonDateAndTimeToUtc(value.endDate, value.endTime)
				: null

		return {
			title: value.title,
			description: value.description,
			event_type: value.event_type,
			start_at: start?.toISOString() ?? '',
			end_at: end?.toISOString() ?? null,
			is_recurring: false,
		}
	})

export const parseEvent = (value: unknown): FellowshipEvent | null => {
	if (value === null || value === undefined) {
		return null
	}

	const parsed = eventSchema.safeParse(value)

	if (!parsed.success) {
		logEvent({
			operation: 'events.parse',
			status: 'error',
			errorCategory: 'validation',
		})
		return null
	}

	return parsed.data
}

export const parseEvents = (value: unknown): FellowshipEvent[] => {
	if (!Array.isArray(value)) {
		return []
	}

	return value.flatMap((row) => {
		const event = parseEvent(row)
		return event ? [event] : []
	})
}

export type EventInput = z.infer<typeof eventInputSchema>
