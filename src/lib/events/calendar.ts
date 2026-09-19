export const escapeIcsText = (value: string) =>
	value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

const icsDate = (value: Date) =>
	value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

export const buildGoogleCalendarUrl = (input: {
	title: string
	description: string
	startAt: Date
	endAt: Date | null
}) => {
	const end = input.endAt ?? new Date(input.startAt.getTime() + 60 * 60 * 1000)
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: input.title,
		dates: `${icsDate(input.startAt)}/${icsDate(end)}`,
		details: input.description,
	})

	return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export const buildIcs = (input: {
	id: string
	title: string
	description: string
	startAt: Date
	endAt: Date | null
}) => {
	const end = input.endAt ?? new Date(input.startAt.getTime() + 60 * 60 * 1000)
	const stamp = icsDate(new Date())

	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Gideons Army//Fellowship//EN',
		'CALSCALE:GREGORIAN',
		'BEGIN:VEVENT',
		`UID:${escapeIcsText(input.id)}@gideonsarmy`,
		`DTSTAMP:${stamp}`,
		`DTSTART:${icsDate(input.startAt)}`,
		`DTEND:${icsDate(end)}`,
		`SUMMARY:${escapeIcsText(input.title)}`,
		`DESCRIPTION:${escapeIcsText(input.description)}`,
		'END:VEVENT',
		'END:VCALENDAR',
		'',
	].join('\r\n')
}
