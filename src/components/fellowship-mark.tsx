import Image from 'next/image'

interface FellowshipMarkProps {
	className?: string
}

export const FellowshipMark = ({ className = 'h-11 w-11' }: FellowshipMarkProps) => {
	return (
		<Image
			src="/rccg-logo.png"
			alt=""
			width={88}
			height={88}
			className={`${className} rounded-full bg-white`}
			aria-hidden="true"
			priority
		/>
	)
}
