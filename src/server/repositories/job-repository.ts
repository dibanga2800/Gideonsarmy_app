import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/logging'
import { parseProfiles, PROFILE_SELECT_COLUMNS } from '@/lib/validation/profile'
import { parseDuesRecords, DUES_SELECT_COLUMNS } from '@/lib/validation/dues'
import { parseEvents, EVENT_SELECT_COLUMNS } from '@/lib/validation/event'

export const listActiveMembersForJobs = async () => {
	const supabase = createSupabaseAdminClient()
	const { data, error } = await supabase
		.from('profiles')
		.select(PROFILE_SELECT_COLUMNS)
		.eq('membership_status', 'ACTIVE')
		.limit(200)

	if (error) {
		logEvent({
			operation: 'jobs.listMembers',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parseProfiles(data)
}

export const listOutstandingDuesForJobs = async () => {
	const supabase = createSupabaseAdminClient()
	const { data, error } = await supabase
		.from('dues')
		.select(DUES_SELECT_COLUMNS)
		.in('status', ['OUTSTANDING', 'PAYMENT_SUBMITTED'])
		.limit(500)

	if (error) {
		logEvent({
			operation: 'jobs.listOutstandingDues',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parseDuesRecords(data)
}

export const listStoredEventsForJobs = async () => {
	const supabase = createSupabaseAdminClient()
	const { data, error } = await supabase
		.from('events')
		.select(EVENT_SELECT_COLUMNS)
		.gte('start_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
		.limit(100)

	if (error) {
		logEvent({
			operation: 'jobs.listEvents',
			status: 'error',
			errorCategory: 'database',
		})
		return []
	}

	return parseEvents(data)
}
