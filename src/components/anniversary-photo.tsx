import { PhotoLightbox } from '@/components/photo-lightbox'

interface AnniversaryPhotoProps {
	name: string
	photoUrl: string | null
	size?: 'thumb' | 'landscape'
}

export const AnniversaryPhoto = ({ name, photoUrl, size = 'landscape' }: AnniversaryPhotoProps) => {
	const thumb = size === 'thumb'
	const sizeClass = thumb ? 'h-11 w-14 rounded-md' : 'aspect-[3/2] w-full rounded-lg'

	if (photoUrl) {
		return (
			<PhotoLightbox
				src={photoUrl}
				alt={`${name}, anniversary photo`}
				width={thumb ? 56 : 384}
				height={thumb ? 44 : 256}
				className={`${sizeClass} shrink-0 bg-cream-100 ring-1 ring-line`}
			/>
		)
	}

	return (
		<div
			className={`${sizeClass} flex shrink-0 items-center justify-center bg-cream-100 text-slate-400 ring-1 ring-inset ring-line`}
			aria-hidden={thumb ? 'true' : undefined}
		>
			{thumb ? (
				<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
					<circle cx="9" cy="12" r="5" />
					<circle cx="15" cy="12" r="5" />
				</svg>
			) : (
				<span className="px-3 text-center text-sm">No couple photo yet</span>
			)}
		</div>
	)
}
