import type { Metadata } from 'next'
import Link from 'next/link'
import { signInWithGoogle, signInWithPasswordAction } from '@/server/actions/auth-actions'
import { isSupabaseConfigured } from '@/lib/validation/env'
import { loginErrorSchema } from '@/lib/validation/login'
import { AlertNotice } from '@/components/alert-notice'
import { FellowshipMark } from '@/components/fellowship-mark'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import {
	helpTextClass,
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
		<main className="relative flex flex-1 flex-col overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(196,163,90,0.16),_transparent_55%),linear-gradient(180deg,#fbf8f2_0%,#f4eee3_48%,#ebe3d4_100%)]"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy-950 via-gold-500 to-navy-950"
				aria-hidden="true"
			/>

			<div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
				<div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
					<section className="max-w-xl">
						<div className="flex items-center gap-4">
							<FellowshipMark className="h-14 w-14 sm:h-16 sm:w-16" />
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">
									RCCG Living Water Parish
								</p>
								<p className="mt-1 font-serif text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
									Gideon&apos;s Army
								</p>
							</div>
						</div>
						<h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-navy-950 sm:text-5xl">
							Welcome back
						</h1>
						<p className="mt-4 max-w-md text-base leading-7 text-navy-800/80 sm:text-lg sm:leading-8">
							Sign in to view dues, gatherings, and fellowship notices. Access is
							granted only after an administrator approves membership.
						</p>
						<ul className="mt-8 hidden gap-3 text-sm text-navy-800/75 sm:grid">
							<li className="flex gap-2">
								<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
								Use Google when your fellowship email is Gmail.
							</li>
							<li className="flex gap-2">
								<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
								Use email and password if you were invited with another address.
							</li>
						</ul>
					</section>

					<section className="rounded-2xl border border-cream-200/90 bg-white/90 p-6 shadow-[0_24px_60px_-28px_rgba(11,18,32,0.45)] backdrop-blur-sm sm:p-8">
						{message ? (
							<div className="mb-6">
								<AlertNotice kind="danger" title="Sign-in could not continue">
									{message}
								</AlertNotice>
							</div>
						) : null}

						{configured ? (
							<div className="space-y-6">
								<form action={signInWithGoogle}>
									<PendingSubmitButton
										className={`${primaryButtonClass} w-full gap-3`}
										pendingLabel="Opening Google…"
									>
										<GoogleMark />
										Continue with Google
									</PendingSubmitButton>
								</form>

								<div className="flex items-center gap-3" aria-hidden="true">
									<div className="h-px flex-1 bg-cream-200" />
									<span className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-800/45">
										or
									</span>
									<div className="h-px flex-1 bg-cream-200" />
								</div>

								<div>
									<h2 className="font-serif text-lg font-semibold text-navy-950">
										Email and password
									</h2>
									<p className="mt-1 text-sm leading-6 text-navy-800/75">
										For brothers invited with a non-Gmail address.
									</p>
								</div>

								<form action={signInWithPasswordAction} className="space-y-5">
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
										className={`${secondaryButtonClass} w-full`}
										pendingLabel="Signing in…"
									>
										Sign in with email
									</PendingSubmitButton>
								</form>

								<p className={helpTextClass}>
									Invited and need to choose a password?{' '}
									<Link href="/signup" className={navLinkClass}>
										Create a password
									</Link>
								</p>
							</div>
						) : (
							<div className="text-navy-800">
								<h2 className="font-serif text-lg font-semibold text-navy-950">
									Your setup is needed
								</h2>
								<p className="mt-3 text-sm leading-6">
									Create a Supabase project, enable Google Auth and Email Auth, apply
									the database migration, then add these values to{' '}
									<code className="whitespace-nowrap rounded bg-cream-100 px-1">
										.env.local
									</code>
									:
								</p>
								<ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
									<li>NEXT_PUBLIC_SUPABASE_URL</li>
									<li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
									<li>SUPABASE_SERVICE_ROLE_KEY</li>
									<li>NEXT_PUBLIC_SITE_URL</li>
								</ul>
								<p className="mt-3 text-sm leading-6">
									Step-by-step instructions are in{' '}
									<code className="whitespace-nowrap rounded bg-cream-100 px-1">
										docs/supabase-setup.md
									</code>
									.
								</p>
							</div>
						)}
					</section>
				</div>
			</div>
		</main>
	)
}

export default LoginPage
