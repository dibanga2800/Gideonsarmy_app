const Bar = ({ className }: { className: string }) => (
	<div className={`animate-pulse rounded-lg bg-cream-200/70 ${className}`} />
)

/** Skeleton in the shape of a typical page: title, a row of figures, a content block. */
const LoadingPage = () => {
	return (
		<main className="mx-auto w-full max-w-6xl" aria-busy="true" aria-live="polite">
			<p className="sr-only" role="status">
				Loading…
			</p>
			<Bar className="h-8 w-56" />
			<Bar className="mt-3 h-4 w-80 max-w-full" />
			<div className="mt-8 grid gap-4 sm:grid-cols-3">
				<Bar className="h-28" />
				<Bar className="h-28" />
				<Bar className="h-28" />
			</div>
			<Bar className="mt-6 h-64" />
		</main>
	)
}

export default LoadingPage
