const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

export const BIRTH_MONTHS = [
	{ value: 1, label: 'January' },
	{ value: 2, label: 'February' },
	{ value: 3, label: 'March' },
	{ value: 4, label: 'April' },
	{ value: 5, label: 'May' },
	{ value: 6, label: 'June' },
	{ value: 7, label: 'July' },
	{ value: 8, label: 'August' },
	{ value: 9, label: 'September' },
	{ value: 10, label: 'October' },
	{ value: 11, label: 'November' },
	{ value: 12, label: 'December' },
] as const

export const BIRTH_DAYS = Array.from({ length: 31 }, (_, index) => index + 1)

export const isValidBirthMonthDay = (month: number, day: number) => {
	if (!Number.isInteger(month) || !Number.isInteger(day)) {
		return false
	}

	if (month < 1 || month > 12 || day < 1) {
		return false
	}

	const daysInMonth = DAYS_IN_MONTH[month - 1]
	return daysInMonth !== undefined && day <= daysInMonth
}
