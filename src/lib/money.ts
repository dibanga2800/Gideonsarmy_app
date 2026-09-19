export const PENCE_PER_POUND = 100
export const DEFAULT_MONTHLY_DUES_PENCE = 1000
export const MAX_PAYMENT_PENCE = 100_000

const assertIntegerPence = (value: number, label: string) => {
	if (!Number.isInteger(value)) {
		throw new Error(`${label} must be an integer number of pence`)
	}
}

export const poundsToPence = (pounds: number) => {
	if (!Number.isInteger(pounds)) {
		throw new Error('Pound amounts must be whole pounds when converting to pence')
	}

	return pounds * PENCE_PER_POUND
}

export const formatPenceAsGbp = (pence: number) => {
	assertIntegerPence(pence, 'Amount')

	const sign = pence < 0 ? '-' : ''
	const absolute = Math.abs(pence)
	const pounds = Math.floor(absolute / PENCE_PER_POUND)
	const remainingPence = absolute % PENCE_PER_POUND

	return `${sign}£${pounds}.${remainingPence.toString().padStart(2, '0')}`
}

export const addPence = (...amounts: number[]) => {
	return amounts.reduce((total, amount) => {
		assertIntegerPence(amount, 'Amount')
		return total + amount
	}, 0)
}

export const parsePoundsToPence = (value: string) => {
	const trimmed = value.trim()

	if (!/^\d{1,5}(\.\d{1,2})?$/.test(trimmed)) {
		return null
	}

	const [poundsPart, fractionPart = ''] = trimmed.split('.')
	const pounds = Number(poundsPart)
	const pencePart = `${fractionPart}00`.slice(0, 2)

	return pounds * PENCE_PER_POUND + Number(pencePart)
}

export const penceToPoundsInput = (pence: number) => {
	if (!Number.isInteger(pence) || pence < 0) {
		return '0.00'
	}

	const pounds = Math.trunc(pence / PENCE_PER_POUND)
	const remainder = pence % PENCE_PER_POUND
	return `${pounds}.${remainder.toString().padStart(2, '0')}`
}
