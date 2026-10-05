import Link from 'next/link'

const MIXLR_EMBED = 'https://mixlr.com/rccg-radio/embed'
const MIXLR_FALLBACK = 'https://myrccgradio.mixlr.com/'

export const SiteFooter = () => {
	return (
		<footer className="mt-auto border-t border-gold-500/35 bg-navy-950 text-white">
			<div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(11rem,0.8fr)_minmax(0,1.4fr)] lg:px-8">
				<section aria-label="Fellowship information" className="flex flex-col justify-between gap-4">
					<div>
						<h2 className="font-serif text-lg font-semibold text-white">Gideon&apos;s Army</h2>
						<p className="mt-1 text-sm text-white/70">RCCG Living Water Parish · Stoke-on-Trent</p>
					</div>
					<p className="text-xs text-white/55">
						© {new Date().getFullYear()} Gideon&apos;s Army Men&apos;s Fellowship. All rights reserved.
					</p>
				</section>
				<section aria-label="Legal and social links" className="space-y-5">
					<div>
						<h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
							Information
						</h2>
						<nav className="mt-3 flex flex-col items-start gap-2 text-sm" aria-label="Legal information">
							<Link
								href="/privacy"
								className="font-medium text-gold-400 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
							>
								Privacy notice
							</Link>
							<Link
								href="/gdpr"
								className="font-medium text-gold-400 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
							>
								GDPR and data rights
							</Link>
						</nav>
					</div>
					<div>
						<h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
							Follow the parish
						</h2>
						<nav className="mt-2 flex items-center gap-2" aria-label="Church social media">
							<a
								href="https://www.youtube.com/channel/UCbkJXXe39qgU7lCZbW_XMvQ"
								aria-label="YouTube (opens in a new tab)"
								title="YouTube"
								target="_blank"
								rel="noreferrer"
								className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
							>
								<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current" fillRule="evenodd">
									<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
								</svg>
							</a>
							<a
								href="https://www.facebook.com/RCCGLivingwaterstoke/?locale=en_GB"
								aria-label="Facebook (opens in a new tab)"
								title="Facebook"
								target="_blank"
								rel="noreferrer"
								className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
							>
								<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
									<path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.003 10.125 11.855v-8.386H7.078v-3.469h3.047V9.43c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.931-1.956 1.887v2.247h3.328l-.532 3.469h-2.796v8.386C19.612 23.076 24 18.092 24 12.073Z" />
								</svg>
							</a>
							<a
								href="https://www.instagram.com/rccglwpstoke/"
								aria-label="Instagram (opens in a new tab)"
								title="Instagram"
								target="_blank"
								rel="noreferrer"
								className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
							>
								<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
									<rect x="3" y="3" width="18" height="18" rx="5" />
									<circle cx="12" cy="12" r="4" />
									<circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
								</svg>
							</a>
						</nav>
					</div>
				</section>
				<section aria-label="RCCG Radio" className="sm:col-span-2 lg:col-span-1">
					<h2 className="font-serif text-base font-semibold text-white">RCCG Radio</h2>
					<p className="mt-1 text-sm text-white/70">Listen live to RCCG programmes.</p>
					<iframe
						title="RCCG Radio Live Player"
						src={MIXLR_EMBED}
						className="mt-3 h-44 w-full rounded-xl border border-white/10 bg-navy-900"
						loading="lazy"
						referrerPolicy="strict-origin-when-cross-origin"
						allow="autoplay"
					/>
					<p className="mt-2 text-sm text-white/70">
						If the player does not start, open the{' '}
						<a
							href={MIXLR_FALLBACK}
							className="font-medium text-gold-400 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
							rel="noreferrer"
							target="_blank"
						>
							full stream
						</a>
						.
					</p>
				</section>
			</div>
		</footer>
	)
}
