import Image from 'next/image'
import { initialsFromName } from '@/lib/members/display'

interface CelebrantPortraitProps {
	name: string
	photoUrl: string | null
}

export const CelebrantPortrait = ({ name, photoUrl }: CelebrantPortraitProps) => {
	if (photoUrl) {
		return (
			<Image
				src={photoUrl}
				alt=""
				width={48}
				height={48}
				unoptimized
				className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-gold-500/40"
			/>
		)
	}

	return (
		<span
			className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-cream-50 ring-2 ring-gold-500/40"
			aria-hidden="true"
		>
			{initialsFromName(name)}
		</span>
	)
}
