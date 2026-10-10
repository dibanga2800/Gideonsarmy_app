import type { Metadata } from 'next'
import Link from 'next/link'
import { signInWithGoogle, signInWithPasswordAction } from '@/server/actions/auth-actions'
import { isSupabaseConfigured } from '@/lib/validation/env'
import { loginErrorSchema } from '@/lib/validation/login'
import { AlertNotice } from '@/components/alert-notice'
import { FellowshipMark } from '@/components/fellowship-mark'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { Icon } from '@/components/icons'
import {
	inputClass,
	labelClass,
	navLinkClass,
	primaryButtonClass,
	secondaryButtonClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Sign in',
}

interface LoginPageProps {
	searchParams: {
		error?: string
	}
}

const errorMessage = (error?: string) => {
	const parsed = loginErrorSchema.safeParse(error)
	if (!parsed.success) {
		return null
	}

	if (parsed.data === 'not-configured') {
		return 'Supabase is not configured yet. Add the project credentials to continue.'
	}

	if (parsed.data === 'password' || parsed.data === 'invalid') {
		return 'Check your email and password, then try again.'
	}

	if (parsed.data === 'invite') {
		return 'That email has not been invited yet. Ask an administrator to send an invitation.'
	}

	return 'Google sign-in could not be completed. Try again, or check the OAuth setup.'
}

const GoogleMark = () => (
	<svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
		<path
			fill="#4285F4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
		/>
		<path
			fill="#34A853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
		/>
		<path
			fill="#FBBC05"
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
		/>
		<path
			fill="#EA4335"
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
		/>
	</svg>
)

const LoginPage = ({ searchParams }: LoginPageProps) => {
	const configured = isSupabaseConfigured()
	const message = errorMessage(searchParams.error)

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 items-center">
			<div className="grid w-full overflow-hidden rounded-2xl border border-line bg-white shadow-raised lg:grid-cols-[0.9fr_1.1fr]">
				<section className="lamplight relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
					<div className="relative flex items-center gap-3">
						<FellowshipMark className="h-11 w-11" />
						<p className="leading-tight">
							<span className="block font-serif text-lg font-semibold">Gideon&apos;s Army</span>
							<span className="block text-sm text-white/60">RCCG Living Water Parish</span>
						</p>
					</div>
					<div className="relative">
						<figure className="border-l-2 border-gold-400/60 pl-4">
							<blockquote className="font-serif text-[1.75rem] font-medium italic leading-snug">
								The sword of the Lord, and of Gideon.
							</blockquote>
							<figcaption className="mt-2 text-sm text-white/60">Judges 7:18</figcaption>
						</figure>
						<p className="mt-8 text-base leading-7 text-white/80">
							Your dues, gatherings and fellowship notices in one place.
						</p>
						<ul className="mt-6 space-y-3 text-sm text-white/70">
							<li className="flex gap-3">
								<Icon name="shield" className="h-5 w-5 text-gold-300" />
								Accounts open only after an administrator approves membership.
							</li>
							<li className="flex gap-3">
								<Icon name="mail" className="h-5 w-5 text-gold-300" />
								Use the email address your invitation was sent to.
							</li>
						</ul>
					</div>
				</section>

				<section className="p-6 sm:p-10">
					<h1 className="font-serif text-[1.75rem] font-semibold tracking-tight text-navy-950">Sign in</h1>
					<p className="mt-1.5 text-sm leading-6 text-slate-600">
						Welcome back. Choose how you were invited.
					</p>

					{message ? (
						<div className="mt-6">
							<AlertNotice kind="danger" title="Sign-in didn't go through">
								{message}
							</AlertNotice>
						</div>
					) : null}

					{configured ? (
						<div className="mt-7 space-y-6">
							<form action={signInWithGoogle}>
								<PendingSubmitButton
									className={`${secondaryButtonClass} min-h-11 w-full`}
									pendingLabel="Opening Google…"
								>
									<GoogleMark />
									Continue with Google
								</PendingSubmitButton>
							</form>

							<div className="flex items-center gap-3" aria-hidden="true">
								<div className="h-px flex-1 bg-line" />
								<span className="text-xs text-slate-500">or with email</span>
								<div className="h-px flex-1 bg-line" />
							</div>

							<form action={signInWithPasswordAction} className="space-y-4">
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
										autoComplete="current-password"
										required
										minLength={10}
										maxLength={72}
										className={inputClass}
									/>
								</div>
								<PendingSubmitButton
									className={`${primaryButtonClass} min-h-11 w-full`}
									pendingLabel="Signing in…"
								>
									Sign in with email
								</PendingSubmitButton>
							</form>

							<p className="border-t border-line pt-5 text-sm text-slate-600">
								Invited without a Gmail address?{' '}
								<Link href="/signup" className={navLinkClass}>
									Create a password
								</Link>
							</p>
						</div>
					) : (
						<div className="mt-7 rounded-xl bg-cream-50 p-5 text-sm text-navy-800 ring-1 ring-inset ring-line">
							<h2 className="font-semibold text-navy-950">Your setup is needed</h2>
							<p className="mt-2 leading-6">
								Create a Supabase project, enable Google and Email sign-in, apply the database
								migrations, then add these values to{' '}
								<code className="whitespace-nowrap rounded bg-white px-1 ring-1 ring-line">.env.local</code>:
							</p>
							<ul className="mt-3 space-y-1 font-mono text-[0.8125rem]">
								<li>NEXT_PUBLIC_SUPABASE_URL</li>
								<li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
								<li>SUPABASE_SERVICE_ROLE_KEY</li>
								<li>NEXT_PUBLIC_SITE_URL</li>
							</ul>
							<p className="mt-3 leading-6">
								Step-by-step instructions are in{' '}
								<code className="whitespace-nowrap rounded bg-white px-1 ring-1 ring-line">docs/supabase-setup.md</code>.
							</p>
						</div>
					)}
				</section>
			</div>
		</main>
	)
}

export default LoginPage
