import { headers } from 'next/headers'
import { getSiteUrl } from '@/lib/validation/env'

export const getRequestOrigin = () => {
	const headerList = headers()
	const origin = headerList.get('origin')
	if (origin) {
		return origin
	}

	const host = headerList.get('x-forwarded-host') ?? headerList.get('host')
	const protocol = headerList.get('x-forwarded-proto') ?? 'http'

	if (host) {
		return `${protocol}://${host}`
	}

	return getSiteUrl()
}
