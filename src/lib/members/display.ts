import { isValidBirthMonthDay } from '@/lib/dates/birthday'
import { duesStartMonthFromJoinedAt, isFullYearDuesStart } from '@/lib/dates/dues-year'
import type { MembershipStatus } from '@/types/roles'

export const membershipStatusLabel = (status: MembershipStatus) => {
	if (status === 'PENDING') {
		return 'Pending'
	}

	if (status === 'ACTIVE') {
		return 'Active'
	}

	return 'Inactive'
}

export const roleLabel = (role: 'MEMBER' | 'ADMIN') =>
	role === 'ADMIN' ? 'Administrator' : 'Member'

export const optionalFieldLabel = (value: string | null) => value ?? 'Not provided'

export const memberDisplayName = (member: { first_name: string; last_name: string }) =>
	`${member.first_name} ${member.last_name}`.trim()

export const formatBirthday = (month: number | null, day: number | null) => {
	if (month === null || day === null || !isValidBirthMonthDay(month, day)) {
		return 'Not provided'
	}

	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(2000, month - 1, day)))
}

export const formatCalendarDate = (value: string | null) => {
	if (!value) {
		return 'Not provided'
	}

	const datePart = value.slice(0, 10)
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)

	if (!match) {
		return 'Not provided'
	}

	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])

	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(year, month - 1, day)))
}

export const formatJoinedOn = (value: string | null) => {
	if (!value) {
		return 'Not recorded'
	}

	const parsed = new Date(value)

	if (Number.isNaN(parsed.getTime())) {
		return 'Not recorded'
	}

	return new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/London',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(parsed)
}

export const formatDuesStartLabel = (joinedAt: string | null) => {
	if (isFullYearDuesStart(joinedAt)) {
		return 'Full year from January 2026'
	}

	const startMonth = duesStartMonthFromJoinedAt(joinedAt)
	const year = Number(startMonth.slice(0, 4))
	const month = Number(startMonth.slice(5, 7))

	return `From ${new Intl.DateTimeFormat('en-GB', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(year, month - 1, 1)))}`
}
