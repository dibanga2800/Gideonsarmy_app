import { PhotoLightbox } from '@/components/photo-lightbox'

interface AnniversaryPhotoProps {
	name: string
	photoUrl: string | null
}

export const AnniversaryPhoto = ({ name, photoUrl }: AnniversaryPhotoProps) => {
	if (photoUrl) {
		return (
			<PhotoLightbox
				src={photoUrl}
				alt={`${name}, anniversary photo`}
				width={192}
				height={128}
				className="aspect-[3/2] w-full max-w-56 shrink-0 rounded-md bg-cream-100 ring-1 ring-cream-200 sm:w-48"
			/>
		)
	}

	return (
		<div className="flex aspect-[3/2] w-full max-w-56 shrink-0 items-center justify-center rounded-md border border-dashed border-cream-300 bg-cream-50 px-3 text-center text-sm text-navy-800/70 sm:w-48">
			Couple photo not added
		</div>
	)
}