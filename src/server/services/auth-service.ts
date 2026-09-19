import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { findProfileById } from '@/server/repositories/profile-repository'
import { resolveAccess, type AccessDecision } from '@/lib/auth/access'
import { isSupabaseConfigured } from '@/lib/validation/env'
import { logEvent } from '@/lib/logging'
import type { Profile } from '@/types/database'

export interface CurrentSession {
	userId: string | null
	profile: Profile | null
	access: AccessDecision
}

/** One auth + profile lookup per request (layout, pages, and actions share it). */
export const getCurrentSession = cache(async (): Promise<CurrentSession> => {
	if (!isSupabaseConfigured()) {
		return {
			userId: null,
			profile: null,
			access: { status: 'unauthenticated' },
		}
	}

	const supabase = createSupabaseServerClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		if (error) {
			logEvent({
				operation: 'auth.getCurrentSession',
				status: 'error',
				errorCategory: 'auth',
			})
		}

		return {
			userId: null,
			profile: null,
			access: { status: 'unauthenticated' },
		}
	}

	const profile = await findProfileById(user.id)

	return {
		userId: user.id,
		profile,
		access: resolveAccess(user.id, profile),
	}
})

export const getCurrentAccess = async (): Promise<AccessDecision> => {
	const session = await getCurrentSession()
	return session.access
}
