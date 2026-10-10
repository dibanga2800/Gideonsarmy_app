import type { Config } from 'tailwindcss'

const config: Config = {
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				// Parish navy: structure, headings, the sidebar.
				navy: {
					50: '#eef1f7',
					100: '#dde3ee',
					950: '#0a1424',
					900: '#0e1a2f',
					800: '#1a2943',
					700: '#283a59',
					600: '#3f5172',
				},
				// Gold appears only on navy surfaces. On white, navy is the accent and
				// amber is reserved for money owed, so the two never get confused.
				gold: {
					100: '#f6eedb',
					300: '#e2c98c',
					400: '#d1b067',
					500: '#b8913f',
					600: '#95742b',
					700: '#765b20',
				},
				// Neutral surfaces. `cream` keeps its old name so any untouched markup
				// lands on the new neutral palette rather than the old warm one.
				canvas: '#f4f5f7',
				// Form field borders: 3.3:1 against white so inputs stay visible.
				field: '#848da0',
				line: '#e1e4ea',
				cream: {
					50: '#f7f8fa',
					100: '#eef0f4',
					200: '#e1e4ea',
					300: '#cbd1db',
				},
			},
			fontFamily: {
				sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
				serif: ['var(--font-serif)', 'Georgia', 'serif'],
			},
			keyframes: {
				rise: {
					'0%': { opacity: '0', transform: 'translateY(6px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				rise: 'rise 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
			},
			boxShadow: {
				card: '0 1px 2px rgba(14, 26, 47, 0.05)',
				raised: '0 8px 24px -12px rgba(14, 26, 47, 0.25)',
			},
		},
	},
	plugins: [],
}

export default config
