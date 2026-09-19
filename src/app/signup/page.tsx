import type { Metadata } from 'next'
import Link from 'next/link'
import { signUpWithInviteAction } from '@/server/actions/auth-actions'
import { isSupabaseConfigured } from '@/lib/validation/env'
import { loginErrorSchema } from '@/lib/validation/login'
import { AlertNotice } from '@/components/alert-notice'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import {
	cardClass,
	eyebrowClass,
	helpTextClass,
	inputClass,
	labelClass,
	navLinkClass,
	pageLeadClass,
	pageNarrowClass,
	pageTitleClass,
	primaryButtonClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Create a password',
}

interface SignUpPageProps {
	searchParams: {
		error?: string
		email?: string
	}
}

const errorMessage = (error?: string) => {
	const parsed = loginErrorSchema.safeParse(error)
	if (!parsed.success) {
		return 'Check the details and try again.'
	}

	if (parsed.data === 'not-configured') {
		return 'Supabase is not configured yet. Add the project credentials to continue.'
	}

	if (parsed.data === 'invite') {
		return 'That email has not been invited, or the invitation has already been used.'
	}

	if (parsed.data === 'exists') {
		return 'An account already exists for that email. Sign in with Google or your password.'
	}

	if (parsed.data === 'invalid') {
		return 'Use a valid invited email, a password of at least 10 characters, and matching confirmation.'
	}

	return 'That account could not be created. Try again.'
}

const SignUpPage = ({ searchParams }: SignUpPageProps) => {
	const configured = isSupabaseConfigured()
	const email = typeof searchParams.email === 'string' ? searchParams.email : ''

	return (
		<main className={pageNarrowClass}>
			<p className={eyebrowClass}>Gideon&apos;s Army</p>
			<h1 className={`${pageTitleClass} mt-3`}>Create a password</h1>
			<p className={pageLeadClass}>
				Use the email address you were invited with. This is for brothers who do
				not have a Gmail account. An administrator still has to approve
				membership after you sign in.
			</p>

			{searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not create account">
						{errorMessage(searchParams.error)}
					</AlertNotice>
				</div>
			) : null}

			{configured ? (
				<section className={`${cardClass} mt-8 space-y-5`}>
					<form action={signUpWithInviteAction} className="space-y-5">
						<div>
							<label htmlFor="email" className={labelClass}>
								Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="username"
								required
								maxLength={254}
								defaultValue={email}
								className={inputClass}
							/>
						</div>
						<div>
							<label htmlFor="password" className={labelClass}>
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								minLength={10}
								maxLength={72}
								className={inputClass}
							/>
							<p className={helpTextClass}>At least 10 characters.</p>
						</div>
						<div>
							<label htmlFor="confirm_password" className={labelClass}>
								Confirm password
							</label>
							<input
								id="confirm_password"
								name="confirm_password"
								type="password"
								autoComplete="new-password"
								required
								minLength={10}
								maxLength={72}
								className={inputClass}
							/>
						</div>
						<PendingSubmitButton className={primaryButtonClass} pendingLabel="Creating account…">
							Create password and sign in
						</PendingSubmitButton>
					</form>
					<p className={helpTextClass}>
						Already have a password?{' '}
						<Link href="/login" className={navLinkClass}>
							Sign in
						</Link>
					</p>
				</section>
			) : (
				<p className={`${cardClass} mt-8 text-navy-800`}>
					Supabase is not configured yet. See docs/supabase-setup.md.
				</p>
			)}
		</main>
	)
}

export default SignUpPage
