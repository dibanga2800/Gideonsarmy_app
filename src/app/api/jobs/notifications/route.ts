import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { logEvent } from '@/lib/logging'
import { runScheduledJobs } from '@/server/jobs/run-scheduled-jobs'

export const dynamic = 'force-dynamic'

const isAuthorized = (request: NextRequest) => {
	const secret = process.env.CRON_SECRET
	if (!secret) {
		return false
	}

	const header = request.headers.get('authorization') ?? ''
	const token = header.startsWith('Bearer ') ? header.slice(7) : ''
	const expected = Buffer.from(secret)
	const received = Buffer.from(token)

	if (expected.length !== received.length) {
		return false
	}

	return timingSafeEqual(expected, received)
}

export const POST = async (request: NextRequest) => {
	if (!isAuthorized(request)) {
		logEvent({
			operation: 'jobs.notifications',
			status: 'denied',
			errorCategory: 'authorization',
		})
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const result = await runScheduledJobs()
	return NextResponse.json(result)
}

export const GET = POST
