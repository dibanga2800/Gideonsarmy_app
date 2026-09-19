'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Immediate click feedback for App Router navigations.
 * Server work still takes time; this makes the wait feel intentional.
 */
export const NavigationProgress = () => {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [active, setActive] = useState(false)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		setActive(false)
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
	}, [pathname, searchParams])

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0) {
				return
			}
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return
			}

			const target = event.target
			if (!(target instanceof Element)) {
				return
			}

			const anchor = target.closest('a[href]')
			if (!(anchor instanceof HTMLAnchorElement)) {
				return
			}
			if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
				return
			}

			const href = anchor.getAttribute('href')
			if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
				return
			}

			let url: URL
			try {
				url = new URL(href, window.location.href)
			} catch {
				return
			}

			if (url.origin !== window.location.origin) {
				return
			}

			const next = `${url.pathname}${url.search}`
			const current = `${window.location.pathname}${window.location.search}`
			if (next === current) {
				return
			}

			setActive(true)
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
			timeoutRef.current = setTimeout(() => setActive(false), 8000)
		}

		document.addEventListener('click', onClick, true)
		return () => {
			document.removeEventListener('click', onClick, true)
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return (
		<div
			className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
			aria-hidden="true"
		>
			<div
				className={`h-full origin-left bg-gold-500 transition-[transform,opacity] duration-300 ease-out ${
					active ? 'animate-nav-progress opacity-100' : 'scale-x-0 opacity-0'
				}`}
			/>
		</div>
	)
}
