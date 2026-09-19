import Link from 'next/link'

export const SiteFooter = () => {
	return (
		<footer className="mt-auto border-t border-gold-500/35 bg-navy-950 text-white">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-white/75 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
				<p>
					Gideon&apos;s Army · RCCG Living Water Parish, Stoke-on-Trent
				</p>
				<p>
					<Link
						href="/privacy"
						className="font-medium text-gold-400 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
					>
						Privacy notice
					</Link>
				</p>
			</div>
		</footer>
	)
}
