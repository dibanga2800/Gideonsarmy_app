interface LogFields {
	requestId?: string
	operation: string
	status: string
	durationMs?: number
	errorCategory?: string
	errorCode?: string
}

export const safePostgrestCode = (code: unknown) => {
	if (typeof code !== 'string' || !/^[A-Z0-9_]{1,32}$/i.test(code)) {
		return undefined
	}

	return code
}

export const logEvent = (fields: LogFields) => {
	console.info(
		JSON.stringify({
			ts: new Date().toISOString(),
			...fields,
		}),
	)
}

export const logClientError = (operation: string, error: { code?: string } | null) => {
	const errorCode = safePostgrestCode(error?.code)

	logEvent({
		operation,
		status: 'error',
		errorCategory: errorCode === 'PGRST202' || errorCode === 'PGRST203' ? 'schema' : 'database',
		errorCode,
	})
}
