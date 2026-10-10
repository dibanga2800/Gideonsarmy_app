'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** "Sign in" link for the public header, hidden on the sign-in pages themselves. */
export const SiteHeaderSignIn = () => {
	const pathname = usePathname()

	if (pathname === '/login' || pathname === '/signup') {
		return null
	}

	return (
		<Link
			href="/login"
			className="inline-flex min-h-9 items-center rounded-lg bg-gold-500 px-3.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
		>
			Sign in
		</Link>
	)
}
