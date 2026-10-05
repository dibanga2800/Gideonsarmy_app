import { initialsFromName } from '@/lib/members/display'
import { PhotoLightbox } from '@/components/photo-lightbox'

interface CelebrantPortraitProps {
	name: string
	photoUrl: string | null
	size?: 'small' | 'large' | 'landscape'
}

export const CelebrantPortrait = ({ name, photoUrl, size = 'small' }: CelebrantPortraitProps) => {
	const isLandscape = size === 'landscape'
	const sizeClass = isLandscape
		? 'aspect-[3/2] w-full max-w-56 sm:w-48'
		: size === 'large'
			? 'h-28 w-28'
			: 'h-12 w-12'
	const imageWidth = isLandscape ? 192 : size === 'large' ? 112 : 48
	const imageHeight = isLandscape ? 128 : imageWidth

	if (photoUrl) {
		return (
			<PhotoLightbox
				src={photoUrl}
				alt={`${name} birthday portrait`}
				width={imageWidth}
				height={imageHeight}
				className={`${sizeClass} shrink-0 ${isLandscape ? 'rounded-md bg-cream-100 ring-1 ring-cream-200' : 'rounded-full ring-2 ring-gold-500/40'}`}
			/>
		)
	}

	return (
		<span
			className={`inline-flex ${sizeClass} shrink-0 items-center justify-center font-semibold text-cream-50 ${isLandscape ? 'rounded-md bg-navy-900 text-2xl ring-1 ring-gold-500/40' : `rounded-full bg-navy-900 ring-2 ring-gold-500/40 ${size === 'large' ? 'text-2xl' : 'text-sm'}`}`}
			aria-hidden="true"
		>
			{initialsFromName(name)}
		</span>
	)
}
