import { initialsFromName } from '@/lib/members/display'

interface MemberAvatarProps {
	name: string
	size?: 'sm' | 'md'
}

/** Initials avatar for lists where no photo is loaded. */
export const MemberAvatar = ({ name, size = 'sm' }: MemberAvatarProps) => (
	<span
		className={`inline-flex shrink-0 items-center justify-center rounded-full bg-navy-900 font-semibold text-white ${
			size === 'md' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs'
		}`}
		aria-hidden="true"
	>
		{initialsFromName(name)}
	</span>
)
