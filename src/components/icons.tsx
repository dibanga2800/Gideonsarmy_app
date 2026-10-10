import type { ReactNode, SVGProps } from 'react'

/**
 * Small inline stroke icons. Kept local rather than adding an icon package:
 * the app needs a handful, and each is a few lines of SVG.
 */

export type IconName =
	| 'home'
	| 'calendar'
	| 'gift'
	| 'bell'
	| 'wallet'
	| 'user'
	| 'users'
	| 'receipt'
	| 'menu'
	| 'close'
	| 'logout'
	| 'arrow-left'
	| 'arrow-right'
	| 'check'
	| 'alert'
	| 'info'
	| 'copy'
	| 'plus'
	| 'search'
	| 'clock'
	| 'mail'
	| 'shield'
	| 'radio'
	| 'file'

const paths: Record<IconName, ReactNode> = {
	home: (
		<>
			<path d="M3 10.5 12 3l9 7.5" />
			<path d="M5 9.5V20h14V9.5" />
			<path d="M10 20v-6h4v6" />
		</>
	),
	calendar: (
		<>
			<rect x="3.5" y="5" width="17" height="15.5" rx="2" />
			<path d="M3.5 10h17M8 3v4M16 3v4" />
		</>
	),
	gift: (
		<>
			<rect x="3.5" y="8" width="17" height="4" rx="1" />
			<path d="M5 12v8.5h14V12M12 8v12.5" />
			<path d="M12 8c-1.5-3-5-3.5-5-1.25C7 8 9 8 12 8Zm0 0c1.5-3 5-3.5 5-1.25C17 8 15 8 12 8Z" />
		</>
	),
	bell: (
		<>
			<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" />
			<path d="M10 20.5a2 2 0 0 0 4 0" />
		</>
	),
	wallet: (
		<>
			<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
			<rect x="4" y="8" width="16.5" height="11.5" rx="2" />
			<path d="M16 14h1.5" />
		</>
	),
	user: (
		<>
			<circle cx="12" cy="8" r="3.75" />
			<path d="M4.5 20.5c1-3.75 4-5.5 7.5-5.5s6.5 1.75 7.5 5.5" />
		</>
	),
	users: (
		<>
			<circle cx="9" cy="8.5" r="3.25" />
			<path d="M2.75 19.5c.75-3.25 3.25-5 6.25-5s5.5 1.75 6.25 5" />
			<path d="M15.5 5.5a3.25 3.25 0 0 1 0 6.25M17.5 14.75c2 .5 3.25 2 3.75 4.75" />
		</>
	),
	receipt: (
		<>
			<path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5Z" />
			<path d="M9 8h6M9 12h6M9 16h3" />
		</>
	),
	menu: <path d="M4 7h16M4 12h16M4 17h16" />,
	close: <path d="m6 6 12 12M18 6 6 18" />,
	logout: (
		<>
			<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
			<path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
		</>
	),
	'arrow-left': <path d="M19 12H5m6-6-6 6 6 6" />,
	'arrow-right': <path d="M5 12h14m-6-6 6 6-6 6" />,
	check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
	alert: (
		<>
			<path d="M12 4 2.75 19.5h18.5Z" />
			<path d="M12 10v4M12 17v.01" />
		</>
	),
	info: (
		<>
			<circle cx="12" cy="12" r="8.75" />
			<path d="M12 11v5.5M12 7.75v.01" />
		</>
	),
	copy: (
		<>
			<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
			<path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
		</>
	),
	plus: <path d="M12 5v14M5 12h14" />,
	search: (
		<>
			<circle cx="11" cy="11" r="6.25" />
			<path d="m20 20-4.5-4.5" />
		</>
	),
	clock: (
		<>
			<circle cx="12" cy="12" r="8.75" />
			<path d="M12 7.5V12l3 2" />
		</>
	),
	mail: (
		<>
			<rect x="3.5" y="5.5" width="17" height="13" rx="2" />
			<path d="m4 7 8 6 8-6" />
		</>
	),
	shield: (
		<>
			<path d="M12 3.5 5 6v5.5c0 4.5 3 7.75 7 9 4-1.25 7-4.5 7-9V6Z" />
			<path d="m9 12 2 2 4-4" />
		</>
	),
	radio: (
		<>
			<circle cx="12" cy="12" r="2" />
			<path d="M8.25 8.25a5.25 5.25 0 0 0 0 7.5M15.75 8.25a5.25 5.25 0 0 1 0 7.5M5.5 5.5a9.25 9.25 0 0 0 0 13M18.5 5.5a9.25 9.25 0 0 1 0 13" />
		</>
	),
	file: (
		<>
			<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8Z" />
			<path d="M14 3.5V8h4.5" />
		</>
	),
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
	name: IconName
}

export const Icon = ({ name, className = 'h-5 w-5', ...props }: IconProps) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.75}
		strokeLinecap="round"
		strokeLinejoin="round"
		className={`shrink-0 ${className}`}
		aria-hidden="true"
		focusable="false"
		{...props}
	>
		{paths[name]}
	</svg>
)
