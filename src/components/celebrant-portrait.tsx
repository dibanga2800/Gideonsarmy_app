import { initialsFromName } from '@/lib/members/display'
import { PhotoLightbox } from '@/components/photo-lightbox'

interface CelebrantPortraitProps {
	name: string
	photoUrl: string | null
	size?: 'small' | 'large'
}

export const CelebrantPortrait = ({ name, photoUrl, size = 'small' }: CelebrantPortraitProps) => {
	const sizeClass = size === 'large' ? 'h-28 w-28' : 'h-12 w-12'
	const imageSize = size === 'large' ? 112 : 48

	if (photoUrl) {
		return (
			<PhotoLightbox
				src={photoUrl}
				alt={`${name} birthday portrait`}
				width={imageSize}
				height={imageSize}
				className={`${sizeClass} shrink-0 rounded-full ring-2 ring-gold-500/40`}
			/>
		)
	}

	return (
		<span
			className={`inline-flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-navy-900 font-semibold text-cream-50 ring-2 ring-gold-500/40 ${size === 'large' ? 'text-2xl' : 'text-sm'}`}
			aria-hidden="true"
		>
			{initialsFromName(name)}
		</span>
	)
}
