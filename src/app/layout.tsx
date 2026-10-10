import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Public_Sans, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/app-shell'

const sans = Public_Sans({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-sans',
})

const serif = Source_Serif_4({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-serif',
})

export const metadata: Metadata = {
	title: {
		default: "Gideon's Army Men's Fellowship",
		template: "%s · Gideon's Army",
	},
	description:
		"Membership, dues, and fellowship management for Gideon's Army Men's Fellowship at RCCG Living Water Parish, Stoke-on-Trent.",
	icons: {
		icon: '/favicon.ico',
	},
}

const RootLayout = ({ children }: { children: ReactNode }) => {
	return (
		<html lang="en-GB" className={`${sans.variable} ${serif.variable}`}>
			<body className="min-h-screen bg-canvas font-sans text-navy-900 antialiased">
				<AppShell>{children}</AppShell>
			</body>
		</html>
	)
}

export default RootLayout
