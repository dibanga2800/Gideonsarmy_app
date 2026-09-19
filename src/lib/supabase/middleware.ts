import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicEnvOrNull } from '@/lib/validation/env'

export const createSupabaseMiddlewareClient = (request: NextRequest) => {
	const env = getPublicEnvOrNull()
	if (!env) {
		return null
	}

	let response = NextResponse.next({
		request,
	})

	const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return request.cookies.getAll()
			},
			setAll(
				cookiesToSet: Array<{
					name: string
					value: string
					options?: Parameters<(typeof response.cookies)['set']>[2]
				}>,
			) {
				cookiesToSet.forEach(({ name, value }) => {
					request.cookies.set(name, value)
				})
				response = NextResponse.next({
					request,
				})
				cookiesToSet.forEach(({ name, value, options }) => {
					response.cookies.set(name, value, options)
				})
			},
		},
	})

	return { supabase, response }
}
