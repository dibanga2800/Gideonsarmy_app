import { canAccessMemberApp } from '@/lib/auth/access'
import { getCurrentSession } from '@/server/services/auth-service'
import { listMonthCelebrantRows } from '@/server/repositories/celebration-repository'
import { createMemberPhotoSignedUrl } from '@/server/repositories/member-photo-repository'
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

const withPortraitUrls = async (
	rows: Awaited<ReturnType<typeof listMonthCelebrantRows>>,
) => {
	const paths = [
		...new Set(
			rows.flatMap((row) =>
				[row.photo_storage_path, row.anniversary_photo_storage_path].filter(
					(path): path is string => Boolean(path),
				),
			),
		),
	]
	const urls = new Map<string, string>()

	await Promise.all(
		paths.map(async (storagePath) => {
			const url = await createMemberPhotoSignedUrl(storagePath)
			if (url) {
				urls.set(storagePath, url)
			}
		}),
	)

	return rows.map((row) => ({
		...row,
		photoUrl: row.photo_storage_path ? (urls.get(row.photo_storage_path) ?? null) : null,
		anniversaryPhotoUrl: row.anniversary_photo_storage_path
			? (urls.get(row.anniversary_photo_storage_path) ?? null)
			: null,
	}))
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
	const [currentWithPhotos, upcomingWithPhotos] = await Promise.all([
		withPortraitUrls(currentRows),
		withPortraitUrls(upcomingRows),
	])

	return {
		current: monthCelebrationsFromSources(currentWithPhotos, current.year, current.month),
		upcoming: monthCelebrationsFromSources(upcomingWithPhotos, upcoming.year, upcoming.month),
	}
}

export const getThisMonthCelebrations = async (): Promise<MonthCelebrations | null> => {
	const session = await getCurrentSession()
	if (!canAccessMemberApp(session.access)) {
		return null
	}

	const current = getLondonYearMonthDay()
	const rows = await withPortraitUrls(await listMonthCelebrantRows(current.month))
	return monthCelebrationsFromSources(rows, current.year, current.month)
}

export const getThisMonthCelebrants = async () => {
	const celebrations = await getThisMonthCelebrations()
	if (!celebrations) {
		return null
	}

	return combinedCelebrants(celebrations)
}
