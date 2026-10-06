import { NextResponse, type NextRequest } from 'next/server'
import { isLondonSixAm } from '@/lib/dates/celebration'
import { logEvent } from '@/lib/logging'
import { isCronAuthorized } from '@/server/jobs/cron-auth'
import { runScheduledCelebrationJobs } from '@/server/jobs/run-scheduled-jobs'

export const dynamic = 'force-dynamic'

export const GET = async (request: NextRequest) => {
	if (!isCronAuthorized(request)) {
		logEvent({
			operation: 'jobs.celebrations',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (!isLondonSixAm()) {
		return NextResponse.json({
			skipped: true,
			reason: 'outside-london-six-am-window',
		})
	}

	const result = await runScheduledCelebrationJobs()
	return NextResponse.json(result)
}

export const POST = GET
