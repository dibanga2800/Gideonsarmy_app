'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface PhotoLightboxProps {
	src: string
	alt: string
	width: number
	height: number
	className: string
	imageClassName?: string
}

export const PhotoLightbox = ({
	src,
	alt,
	width,
	height,
	className,
	imageClassName = 'h-full w-full object-cover',
}: PhotoLightboxProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const dialogRef = useRef<HTMLDialogElement>(null)
	const openerRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		const dialog = dialogRef.current
		if (isOpen && dialog && !dialog.open) {
			dialog.showModal()
		}
	}, [isOpen])

	return (
		<>
			<button
				ref={openerRef}
				type="button"
				className={`${className} overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600`}
				aria-label={`View larger image: ${alt}`}
				onClick={() => setIsOpen(true)}
			>
				<Image
					src={src}
					alt={alt}
					width={width}
					height={height}
					unoptimized
					className={imageClassName}
				/>
			</button>
			{isOpen ? (
				<dialog
					ref={dialogRef}
					className="fixed inset-0 z-[100] m-0 hidden h-dvh w-screen max-h-none max-w-none items-center justify-center border-0 bg-navy-950/90 p-4 text-white open:flex sm:p-8"
					aria-label={`Larger image: ${alt}`}
					onClose={() => {
						setIsOpen(false)
						openerRef.current?.focus()
					}}
					onClick={(event) => {
						if (event.target === event.currentTarget) {
							setIsOpen(false)
						}
					}}
				>
					<section className="relative flex max-h-full max-w-full flex-col items-end gap-3">
						<button
							type="button"
							className="inline-flex min-h-11 items-center rounded-md border border-white/40 bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
							autoFocus
							onClick={() => dialogRef.current?.close()}
						>
							Close image
						</button>
						<Image
							src={src}
							alt={alt}
							width={1600}
							height={1200}
							unoptimized
							className="max-h-[82vh] max-w-full rounded-md object-contain"
						/>
					</section>
				</dialog>
			) : null}
		</>
	)
}