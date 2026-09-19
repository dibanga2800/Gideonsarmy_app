import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'
import { canAccessAdmin, getPostAuthPath, resolveAccess } from '@/lib/auth/access'
import { parseProfile, PROFILE_SELECT_COLUMNS } from '@/lib/validation/profile'

const isPendingRoute = (pathname: string) => pathname === '/pending'

const isProtectedRoute = (pathname: string) =>
	pathname.startsWith('/dashboard') ||
	pathname.startsWith('/admin') ||
	pathname.startsWith('/profile') ||
	pathname.startsWith('/dues') ||
	pathname.startsWith('/events') ||
	pathname.startsWith('/celebrations') ||
	pathname.startsWith('/notifications') ||
	pathname.startsWith('/payment-evidence')

export const middleware = async (request: NextRequest) => {
	const { pathname } = request.nextUrl
	const supabaseClient = createSupabaseMiddlewareClient(request)

	if (!supabaseClient) {
		if (isProtectedRoute(pathname) || isPendingRoute(pathname)) {
			const loginUrl = request.nextUrl.clone()
			loginUrl.pathname = '/login'
			loginUrl.searchParams.set('error', 'not-configured')
			return NextResponse.redirect(loginUrl)
		}

		return NextResponse.next()
	}

	const { supabase, response } = supabaseClient
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		if (isProtectedRoute(pathname) || isPendingRoute(pathname)) {
			const loginUrl = request.nextUrl.clone()
			loginUrl.pathname = '/login'
			loginUrl.search = ''
			return NextResponse.redirect(loginUrl)
		}

		return response
	}

	const { data } = await supabase
		.from('profiles')
		.select(PROFILE_SELECT_COLUMNS)
		.eq('id', user.id)
		.maybeSingle()

	const access = resolveAccess(user.id, parseProfile(data))
	const destination = getPostAuthPath(access)

	if (pathname === '/login' || pathname === '/signup' || (isPendingRoute(pathname) && destination === '/dashboard')) {
		const redirectUrl = request.nextUrl.clone()
		redirectUrl.pathname = destination
		redirectUrl.search = ''
		return NextResponse.redirect(redirectUrl)
	}

	const canUseProfileWhilePending =
		pathname.startsWith('/profile') && access.status === 'pending'

	if (isProtectedRoute(pathname) && destination !== '/dashboard' && !canUseProfileWhilePending) {
		const redirectUrl = request.nextUrl.clone()
		redirectUrl.pathname = destination
		redirectUrl.search = ''
		return NextResponse.redirect(redirectUrl)
	}

	if (pathname.startsWith('/admin') && !canAccessAdmin(access)) {
		const redirectUrl = request.nextUrl.clone()
		redirectUrl.pathname = '/dashboard'
		redirectUrl.search = ''
		return NextResponse.redirect(redirectUrl)
	}

	return response
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}
