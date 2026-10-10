import Link from 'next/link'
import { Icon } from '@/components/icons'

const MIXLR_EMBED = 'https://mixlr.com/rccg-radio/embed'
const MIXLR_FALLBACK = 'https://myrccgradio.mixlr.com/'

const socialLinkClass =
	'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-cream-100 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500'

const textLinkClass =
	'rounded-sm text-slate-600 transition-colors hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500'

const SocialLinks = () => (
	<nav className="flex items-center gap-1" aria-label="Parish social media">
		<a
			href="https://www.youtube.com/channel/UCbkJXXe39qgU7lCZbW_XMvQ"
			aria-label="YouTube (opens in a new tab)"
			title="YouTube"
			target="_blank"
			rel="noreferrer"
			className={socialLinkClass}
		>
			<svg aria-hidden="true" viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem] fill-current" fillRule="evenodd">
				<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
			</svg>
		</a>
		<a
			href="https://www.facebook.com/RCCGLivingwaterstoke/?locale=en_GB"
			aria-label="Facebook (opens in a new tab)"
			title="Facebook"
			target="_blank"
			rel="noreferrer"
			className={socialLinkClass}
		>
			<svg aria-hidden="true" viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem] fill-current">
				<path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.003 10.125 11.855v-8.386H7.078v-3.469h3.047V9.43c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.931-1.956 1.887v2.247h3.328l-.532 3.469h-2.796v8.386C19.612 23.076 24 18.092 24 12.073Z" />
			</svg>
		</a>
		<a
			href="https://www.instagram.com/rccglwpstoke/"
			aria-label="Instagram (opens in a new tab)"
			title="Instagram"
			target="_blank"
			rel="noreferrer"
			className={socialLinkClass}
		>
			<svg aria-hidden="true" viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem] fill-none stroke-current" strokeWidth="2">
				<rect x="3" y="3" width="18" height="18" rx="5" />
				<circle cx="12" cy="12" r="4" />
				<circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
			</svg>
		</a>
	</nav>
)

/**
 * The radio player only loads when opened, so the page does not pull in a
 * third-party frame for people who never listen.
 */
const RadioPlayer = () => (
	<details className="group rounded-xl border border-line bg-white">
		<summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl px-4 text-sm font-medium text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 [&::-webkit-details-marker]:hidden">
			<Icon name="radio" className="h-[1.125rem] w-[1.125rem] text-gold-600" />
			<span className="flex-1">Listen to RCCG Radio</span>
			<span className="text-xs text-slate-500 group-open:hidden">Open player</span>
			<span className="hidden text-xs text-slate-500 group-open:inline">Hide player</span>
		</summary>
		<div className="px-4 pb-4">
			<iframe
				title="RCCG Radio live player"
				src={MIXLR_EMBED}
				className="h-40 w-full rounded-lg border border-line bg-cream-50"
				loading="lazy"
				referrerPolicy="strict-origin-when-cross-origin"
				allow="autoplay"
			/>
			<p className="mt-2 text-xs text-slate-500">
				Player not starting?{' '}
				<a href={MIXLR_FALLBACK} className={`${textLinkClass} font-medium underline`} rel="noreferrer" target="_blank">
					Open the full stream
				</a>
			</p>
		</div>
	</details>
)

export const SiteFooter = () => {
	return (
		<footer className="mt-auto border-t border-line px-4 sm:px-6 lg:px-10">
			<div className="mx-auto grid w-full max-w-6xl gap-6 py-8 lg:grid-cols-[1fr_minmax(18rem,24rem)] lg:items-start">
				<div className="space-y-3">
					<p className="text-sm font-semibold text-navy-900">
						Gideon&apos;s Army Men&apos;s Fellowship
						<span className="block font-normal text-slate-500">RCCG Living Water Parish, Stoke-on-Trent</span>
					</p>
					<nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legal information">
						<Link href="/privacy" className={textLinkClass}>
							Privacy notice
						</Link>
						<Link href="/gdpr" className={textLinkClass}>
							Your data rights
						</Link>
					</nav>
					<div className="flex flex-wrap items-center gap-3">
						<SocialLinks />
						<p className="text-xs text-slate-400">
							© {new Date().getFullYear()} Gideon&apos;s Army Men&apos;s Fellowship
						</p>
					</div>
				</div>
				<RadioPlayer />
			</div>
		</footer>
	)
}
