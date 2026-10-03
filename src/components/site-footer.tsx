import Link from 'next/link'

const MIXLR_EMBED = 'https://mixlr.com/rccg-radio/embed'
const MIXLR_FALLBACK = 'https://myrccgradio.mixlr.com/'

export const SiteFooter = () => {
	return (
		<footer className="mt-auto border-t border-gold-500/35 bg-navy-950 text-white">
			<div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
				<div className="flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-start">
					<p>Gideon&apos;s Army · RCCG Living Water Parish, Stoke-on-Trent</p>
					<p>
						<Link
							href="/privacy"
							className="font-medium text-gold-400 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
						>
							Privacy notice
						</Link>
					</p>
				</div>
				<section aria-label="RCCG Radio">
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
