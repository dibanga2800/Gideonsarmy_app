const LoadingPage = () => {
	return (
		<main
			className="relative flex min-h-[50vh] flex-1 items-center justify-center px-4"
			aria-busy="true"
			aria-live="polite"
		>
			<div className="flex flex-col items-center gap-4">
				<div
					className="h-9 w-9 animate-spin rounded-full border-2 border-cream-200 border-t-gold-500"
					role="status"
					aria-label="Loading"
				/>
				<p className="text-sm font-medium text-navy-800/70">Loading…</p>
			</div>
		</main>
	)
}

export default LoadingPage
