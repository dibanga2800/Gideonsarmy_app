import { canAccessMemberApp } from '@/lib/auth/access'
import { getCurrentSession } from '@/server/services/auth-service'
import { listMonthCelebrantRows } from '@/server/repositories/celebration-repository'
import {
	combinedCelebrants,
	monthCelebrationsFromSources,
	type MonthCelebrations,
} from '@/lib/celebrations/month-list'
import { getLondonYearMonthDay, nextLondonYearMonth } from '@/lib/dates/celebration'

export type { Celebrant, MonthCelebrations } from '@/lib/celebrations/month-list'

export interface CelebrationBoard {
	current: MonthCelebrations
	upcoming: MonthCelebrations
}

export const getCelebrationBoard = async (): Promise<CelebrationBoard | null> => {
	const session = await getCurrentSession()
	if (!canAccessMemberApp(session.access)) {
		return null
	}

	const current = getLondonYearMonthDay()
	const upcoming = nextLondonYearMonth()
	const [currentRows, upcomingRows] = await Promise.all([
		listMonthCelebrantRows(current.month),
		listMonthCelebrantRows(upcoming.month),
	])

	return {
		current: monthCelebrationsFromSources(currentRows, current.year, current.month),
		upcoming: monthCelebrationsFromSources(upcomingRows, upcoming.year, upcoming.month),
	}
}

export const getThisMonthCelebrations = async (): Promise<MonthCelebrations | null> => {
	const session = await getCurrentSession()
	if (!canAccessMemberApp(session.access)) {
		return null
	}

	const current = getLondonYearMonthDay()
	const rows = await listMonthCelebrantRows(current.month)
	return monthCelebrationsFromSources(rows, current.year, current.month)
}

export const getThisMonthCelebrants = async () => {
	const celebrations = await getThisMonthCelebrations()
	if (!celebrations) {
		return null
	}

	return combinedCelebrants(celebrations)
}
