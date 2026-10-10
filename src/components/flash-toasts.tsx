'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { AlertNotice } from '@/components/alert-notice'
import {
	flashMessageFromSearch,
	parseStoredFlashMessage,
	stripFlashParams,
	type FlashMessage,
} from '@/lib/ui/flash'

const FLASH_STORAGE_KEY = 'gideons-army-flash'

const readStoredFlash = () => {
	try {
		const raw = sessionStorage.getItem(FLASH_STORAGE_KEY)
		if (!raw) {
			return null
		}

		return parseStoredFlashMessage(JSON.parse(raw) as unknown)
	} catch {
		return null
	}
}

const storeFlash = (message: FlashMessage) => {
	sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(message))
}

const clearStoredFlash = () => {
	sessionStorage.removeItem(FLASH_STORAGE_KEY)
}

const replaceFlashUrl = (pathname: string, params: URLSearchParams) => {
	const cleaned = stripFlashParams(new URLSearchParams(params.toString()))
	const query = cleaned.toString()
	const url = query ? `${pathname}?${query}` : pathname
	window.history.replaceState(window.history.state, '', url)
}

export const FlashToasts = () => {
	const params = useSearchParams()
	const pathname = usePathname()
	const [toast, setToast] = useState<FlashMessage | null>(null)

	useEffect(() => {
		const fromUrl = flashMessageFromSearch(params)
		const message = fromUrl ?? readStoredFlash()
		if (!message) {
			return
		}

		if (fromUrl) {
			storeFlash(fromUrl)
			replaceFlashUrl(pathname, new URLSearchParams(params.toString()))
		}

		setToast(message)
	}, [params, pathname])

	useEffect(() => {
		if (!toast) {
			return
		}

		const timer = window.setTimeout(() => {
			clearStoredFlash()
			setToast(null)
		}, 8000)
		return () => window.clearTimeout(timer)
	}, [toast])

	if (!toast) {
		return null
	}

	return (
		<div
			className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4 sm:top-6 sm:justify-end sm:px-6"
			aria-live={toast.kind === 'danger' ? 'assertive' : 'polite'}
		>
			<div className="pointer-events-auto w-full max-w-md">
				<AlertNotice
					elevated
					kind={toast.kind}
					title={toast.title}
					onDismiss={() => {
						clearStoredFlash()
						setToast(null)
					}}
				>
					{toast.text}
				</AlertNotice>
			</div>
		</div>
	)
}
