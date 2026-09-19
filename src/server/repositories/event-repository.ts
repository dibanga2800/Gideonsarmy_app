import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/logging'
import {
	EVENT_SELECT_COLUMNS,
	parseEvent,
	parseEvents,
} from '@/lib/validation/event'
import type { EventInput } from '@/lib/validation/event'

const EVENT_LIST_LIMIT = 50

export const listUpcomingStoredEvents = async (fromIso: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('events')
		.select(EVENT_SELECT_COLUMNS)
		.gte('start_at', fromIso)
		.order('start_at', { ascending: true })
		.limit(EVENT_LIST_LIMIT)

	if (error) {
		logEvent({
			operation: 'events.listUpcoming',
			status: 'error',
			errorCategory: 'database',
		})
		throw new Error('Unable to load events')
	}

	return parseEvents(data)
}

export const listStoredEventsForAdmin = async () => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('events')
		.select(EVENT_SELECT_COLUMNS)
		.order('start_at', { ascending: false })
		.limit(EVENT_LIST_LIMIT)

	if (error) {
		logEvent({
			operation: 'events.listAdmin',
			status: 'error',
			errorCategory: 'database',
		})
		throw new Error('Unable to load events')
	}

	return parseEvents(data)
}

export const findEventById = async (id: string) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase
		.from('events')
		.select(EVENT_SELECT_COLUMNS)
		.eq('id', id)
		.maybeSingle()

	if (error) {
		logEvent({
			operation: 'events.findById',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseEvent(data)
}

export const createEventRecord = async (input: EventInput) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_create_event', {
		p_title: input.title,
		p_description: input.description,
		p_event_type: input.event_type,
		p_start_at: input.start_at,
		p_end_at: input.end_at,
	})

	if (error) {
		logEvent({
			operation: 'events.create',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseEvent(data)
}

export const updateEventRecord = async (id: string, input: EventInput) => {
	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('admin_update_event', {
		p_event_id: id,
		p_title: input.title,
		p_description: input.description,
		p_event_type: input.event_type,
		p_start_at: input.start_at,
		p_end_at: input.end_at,
	})

	if (error) {
		logEvent({
			operation: 'events.update',
			status: 'error',
			errorCategory: 'database',
		})
		return null
	}

	return parseEvent(data)
}

export const deleteEventRecord = async (id: string) => {
	const supabase = createSupabaseServerClient()
	const { error } = await supabase.rpc('admin_delete_event', {
		p_event_id: id,
	})

	if (error) {
		logEvent({
			operation: 'events.delete',
			status: 'error',
			errorCategory: 'database',
		})
		return false
	}

	return true
}
