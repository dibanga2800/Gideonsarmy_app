import { NextResponse, type NextRequest } from 'next/server'
import { logEvent } from '@/lib/logging'
import { isCronAuthorized } from '@/server/jobs/cron-auth'
import { runDailyJobs } from '@/server/jobs/run-scheduled-jobs'

export const dynamic = 'force-dynamic'

// Fits both Vercel Hobby limits (60s without Fluid compute, 300s with it).
// Sending stops early inside this budget; see SEND_BUDGET_MS.
export const maxDuration = 60

/**
 * Morning run (scheduled 06:00 UTC: 6–7am in winter, 7–8am in summer).
 * Sends today's birthday and anniversary emails and "today" event reminders,
 * plus anything else due. Safe to call more than once.
 */
export const GET = async (request: NextRequest) => {
	if (!isCronAuthorized(request)) {
		logEvent({
			operation: 'jobs.celebrations',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const result = await runDailyJobs('morning')
	return NextResponse.json(result)
}

export const POST = GET
