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
		? 'aspect-[3/2] w-full rounded-lg'
		: size === 'large'
			? 'h-24 w-24 rounded-full'
			: 'h-11 w-11 rounded-full'
	const imageWidth = isLandscape ? 384 : size === 'large' ? 96 : 44
	const imageHeight = isLandscape ? 256 : imageWidth

	if (photoUrl) {
		return (
			<PhotoLightbox
				src={photoUrl}
				alt={`${name} birthday portrait`}
				width={imageWidth}
				height={imageHeight}
				className={`${sizeClass} shrink-0 bg-cream-100 ring-1 ring-line`}
			/>
		)
	}

	return (
		<span
			className={`inline-flex ${sizeClass} shrink-0 items-center justify-center bg-navy-900 font-semibold text-white ${
				isLandscape || size === 'large' ? 'text-2xl' : 'text-sm'
			}`}
			aria-hidden="true"
		>
			{initialsFromName(name)}
		</span>
	)
}
