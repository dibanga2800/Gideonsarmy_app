import type { Config } from 'tailwindcss'

const config: Config = {
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				navy: {
					950: '#0b1220',
					900: '#111b2e',
					800: '#1a2740',
					700: '#243352',
				},
				cream: {
					50: '#fbf8f2',
					100: '#f4eee3',
					200: '#e7dcc8',
				},
				gold: {
					400: '#d4b56a',
					500: '#c4a35a',
					600: '#a6853d',
				},
			},
			fontFamily: {
				sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
				serif: ['var(--font-serif)', 'Georgia', 'serif'],
			},
		},
	},
	plugins: [],
}

export default config
