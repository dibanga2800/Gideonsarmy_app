import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

export const isCronAuthorized = (request: NextRequest) => {
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
