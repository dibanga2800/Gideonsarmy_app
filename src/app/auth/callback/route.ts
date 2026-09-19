import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { findProfileById } from '@/server/repositories/profile-repository'
import { markInviteAcceptedByEmail } from '@/server/repositories/invite-repository'
import { getPostAuthPath, resolveAccess } from '@/lib/auth/access'
import { isSupabaseConfigured } from '@/lib/validation/env'
import { logEvent } from '@/lib/logging'

export const GET = async (request: NextRequest) => {
	const url = new URL(request.url)
	const origin = url.origin
	const code = url.searchParams.get('code')

	if (!isSupabaseConfigured()) {
		return NextResponse.redirect(`${origin}/login?error=not-configured`)
	}

	if (!code) {
		return NextResponse.redirect(`${origin}/login?error=oauth`)
	}

	const supabase = createSupabaseServerClient()
	const { error } = await supabase.auth.exchangeCodeForSession(code)

	if (error) {
		logEvent({
			operation: 'auth.callback',
			status: 'error',
			errorCategory: 'oauth',
		})
		return NextResponse.redirect(`${origin}/login?error=oauth`)
	}

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.redirect(`${origin}/login?error=oauth`)
	}

	if (user.email) {
		await markInviteAcceptedByEmail(user.email)
	}

	const profile = await findProfileById(user.id)
	const destination = getPostAuthPath(resolveAccess(user.id, profile))

	return NextResponse.redirect(`${origin}${destination}`)
}
