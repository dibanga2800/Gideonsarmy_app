import type { Metadata } from 'next'
import Link from 'next/link'
import { signUpWithInviteAction } from '@/server/actions/auth-actions'
import { isSupabaseConfigured } from '@/lib/validation/env'
import { loginErrorSchema } from '@/lib/validation/login'
import { AlertNotice } from '@/components/alert-notice'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { FellowshipMark } from '@/components/fellowship-mark'
import {
	helpTextClass,
	inputClass,
	labelClass,
	navLinkClass,
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
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
			<div className="rounded-2xl border border-line bg-white p-6 shadow-raised sm:p-9">
				<FellowshipMark className="h-10 w-10" />
				<h1 className="mt-5 font-serif text-[1.75rem] font-semibold tracking-tight text-navy-950">
					Create a password
				</h1>
				<p className="mt-1.5 text-sm leading-6 text-slate-600">
					For brothers invited with an email address that isn&apos;t Gmail. Use the address your
					invitation was sent to. An administrator still approves your membership afterwards.
				</p>

				{searchParams.error ? (
					<div className="mt-6">
						<AlertNotice kind="danger" title="Account not created">
							{errorMessage(searchParams.error)}
						</AlertNotice>
					</div>
				) : null}

				{configured ? (
					<form action={signUpWithInviteAction} className="mt-7 space-y-4">
						<div>
							<label htmlFor="email" className={labelClass}>
								Invited email
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
								aria-describedby="password-help"
								className={inputClass}
							/>
							<p id="password-help" className={helpTextClass}>
								At least 10 characters.
							</p>
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
						<PendingSubmitButton className={`${primaryButtonClass} min-h-11 w-full`} pendingLabel="Creating account…">
							Create password and sign in
						</PendingSubmitButton>
						<p className="border-t border-line pt-5 text-sm text-slate-600">
							Already have a password?{' '}
							<Link href="/login" className={navLinkClass}>
								Sign in
							</Link>
						</p>
					</form>
				) : (
					<p className="mt-6 rounded-xl bg-cream-50 p-4 text-sm text-navy-800 ring-1 ring-inset ring-line">
						Sign-in isn&apos;t configured yet. See docs/supabase-setup.md.
					</p>
				)}
			</div>
		</main>
	)
}

export default SignUpPage
