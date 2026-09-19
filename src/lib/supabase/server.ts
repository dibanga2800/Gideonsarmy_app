import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPublicEnv } from '@/lib/validation/env'

interface CookieToSet {
	name: string
	value: string
	options?: Parameters<ReturnType<typeof cookies>['set']>[2]
}

export const createSupabaseServerClient = () => {
	const env = getPublicEnv()
	const cookieStore = cookies()

	return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookieStore.getAll()
			},
			setAll(cookiesToSet: CookieToSet[]) {
				try {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options)
					})
				} catch {
					// Called from a Server Component. Session refresh belongs in middleware.
				}
			},
		},
	})
}
