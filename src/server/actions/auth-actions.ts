'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl, isSupabaseConfigured } from '@/lib/validation/env'
import { emailPasswordSignInSchema, invitedSignUpSchema } from '@/lib/validation/login'
import { findOpenInviteByEmail, markInviteAcceptedByEmail } from '@/server/repositories/invite-repository'
import { getCurrentSession } from '@/server/services/auth-service'
import { getPostAuthPath } from '@/lib/auth/access'
import { logEvent } from '@/lib/logging'

const formValue = (formData: FormData, key: string) => {
	const value = formData.get(key)
	return typeof value === 'string' ? value : ''
}

export const signInWithGoogle = async () => {
	if (!isSupabaseConfigured()) {
		redirect('/login?error=not-configured')
	}

	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${getSiteUrl()}/auth/callback`,
		},
	})

	if (error || !data.url) {
		logEvent({
			operation: 'auth.signInWithGoogle',
			status: 'error',
			errorCategory: 'oauth',
		})
		redirect('/login?error=oauth')
	}

	redirect(data.url)
}

export const signInWithPasswordAction = async (formData: FormData) => {
	if (!isSupabaseConfigured()) {
		redirect('/login?error=not-configured')
	}

	const parsed = emailPasswordSignInSchema.safeParse({
		email: formValue(formData, 'email'),
		password: formValue(formData, 'password'),
	})

	if (!parsed.success) {
		redirect('/login?error=invalid')
	}

	const supabase = createSupabaseServerClient()
	const { error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	})

	if (error) {
		logEvent({
			operation: 'auth.signInWithPassword',
			status: 'error',
			errorCategory: 'auth',
		})
		redirect('/login?error=password')
	}

	const session = await getCurrentSession()
	redirect(getPostAuthPath(session.access))
}

export const signUpWithInviteAction = async (formData: FormData) => {
	if (!isSupabaseConfigured()) {
		redirect('/signup?error=not-configured')
	}

	const parsed = invitedSignUpSchema.safeParse({
		email: formValue(formData, 'email'),
		password: formValue(formData, 'password'),
		confirm_password: formValue(formData, 'confirm_password'),
	})

	if (!parsed.success) {
		redirect(`/signup?error=invalid&email=${encodeURIComponent(formValue(formData, 'email'))}`)
	}

	const invite = await findOpenInviteByEmail(parsed.data.email)
	if (!invite) {
		logEvent({
			operation: 'auth.signUpWithInvite',
			status: 'denied',
			errorCategory: 'authorization',
		})
		redirect('/signup?error=invite')
	}

	const admin = createSupabaseAdminClient()
	const { error: createError } = await admin.auth.admin.createUser({
		email: parsed.data.email,
		password: parsed.data.password,
		email_confirm: true,
		user_metadata: {
			given_name: invite.first_name ?? undefined,
			family_name: invite.last_name ?? undefined,
		},
	})

	if (createError) {
		logEvent({
			operation: 'auth.signUpWithInvite',
			status: 'error',
			errorCategory: 'auth',
		})
		redirect('/signup?error=exists')
	}

	await markInviteAcceptedByEmail(parsed.data.email)

	const supabase = createSupabaseServerClient()
	const { error: signInError } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	})

	if (signInError) {
		logEvent({
			operation: 'auth.signInAfterInvite',
			status: 'error',
			errorCategory: 'auth',
		})
		redirect('/login?error=password')
	}

	redirect('/pending')
}

export const signOut = async () => {
	if (!isSupabaseConfigured()) {
		redirect('/')
	}

	const supabase = createSupabaseServerClient()
	const { error } = await supabase.auth.signOut()

	if (error) {
		logEvent({
			operation: 'auth.signOut',
			status: 'error',
			errorCategory: 'auth',
		})
	}

	redirect('/')
}
