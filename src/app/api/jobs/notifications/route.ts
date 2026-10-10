import { NextResponse, type NextRequest } from 'next/server'
import { logEvent } from '@/lib/logging'
import { isCronAuthorized } from '@/server/jobs/cron-auth'
import { runDailyJobs } from '@/server/jobs/run-scheduled-jobs'

export const dynamic = 'force-dynamic'

// Fits both Vercel Hobby limits (60s without Fluid compute, 300s with it).
// Sending stops early inside this budget; see SEND_BUDGET_MS.
export const maxDuration = 60

/**
 * Evening run (scheduled 18:00 UTC). Does the same idempotent work as the
 * morning run, so anything the morning run missed still goes out the same
 * day: dues reminders, "in two days" event reminders and celebrations.
 */
export const POST = async (request: NextRequest) => {
	if (!isCronAuthorized(request)) {
		logEvent({
			operation: 'jobs.notifications',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const result = await runDailyJobs('evening')
	return NextResponse.json(result)
}

export const GET = POST
