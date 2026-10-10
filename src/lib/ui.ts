/**
 * Shared Tailwind class strings. Pages compose these rather than repeating
 * long utility lists, so the visual system changes in one place.
 */

const focusRing =
	'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600'

const buttonBase = `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${focusRing} disabled:cursor-not-allowed disabled:opacity-50`

export const primaryButtonClass = `${buttonBase} bg-navy-900 text-white shadow-card hover:bg-navy-800`

export const secondaryButtonClass = `${buttonBase} border border-line bg-white text-navy-900 shadow-card hover:bg-cream-50`

export const ghostButtonClass = `${buttonBase} text-navy-800 hover:bg-cream-100`

export const dangerButtonClass = `${buttonBase} bg-red-700 text-white shadow-card hover:bg-red-800`

export const dangerOutlineButtonClass = `${buttonBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`

export const smallButtonClass = 'min-h-8 px-3 py-1.5 text-[0.8125rem]'

export const inputClass = `mt-1.5 block w-full rounded-lg border border-field bg-white px-3 py-2 text-sm text-navy-900 shadow-card placeholder:text-slate-500 read-only:bg-cream-50 ${focusRing} focus-visible:border-navy-800`

export const textareaClass = `${inputClass} min-h-[6rem]`

export const labelClass = 'block text-sm font-medium text-navy-900'

export const helpTextClass = 'mt-1.5 text-[0.8125rem] leading-5 text-slate-500'

export const navLinkClass = `rounded-sm font-semibold text-navy-800 underline decoration-navy-800/35 decoration-2 underline-offset-4 transition-colors hover:text-navy-950 hover:decoration-navy-800 ${focusRing}`

/* Page widths. The app shell already provides padding and a max width. */
export const pageMainClass = 'mx-auto w-full max-w-6xl'

export const pageWideClass = 'mx-auto w-full max-w-7xl'

export const pageNarrowClass = 'mx-auto w-full max-w-3xl'

export const pageContentClass = 'mx-auto w-full max-w-6xl'

export const pageTitleClass =
	'font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-navy-950 sm:text-[2rem]'

export const pageLeadClass = 'mt-2 max-w-2xl text-[0.9375rem] leading-7 text-slate-600'

export const pageLeadWideClass = 'mt-2 max-w-3xl text-[0.9375rem] leading-7 text-slate-600'

export const sectionHeadingClass = 'text-base font-semibold text-navy-950'

export const formGridClass = 'grid gap-5 sm:grid-cols-2'

export const formSpan2Class = 'sm:col-span-2'

export const formSpanFullClass = 'sm:col-span-2'

export const cardClass = 'rounded-xl border border-line bg-white p-5 shadow-card sm:p-6'

export const cardComfortClass = 'rounded-xl border border-line bg-white p-5 shadow-card sm:p-7'

export const eyebrowClass = 'text-sm font-medium text-slate-500'

export const dtClass = 'text-[0.8125rem] font-medium text-slate-500'

export const ddClass = 'mt-0.5 text-sm font-medium text-navy-950'

export const cardLinkClass = `${cardClass} block transition-colors hover:border-navy-600/40 ${focusRing}`

export const filterActiveClass = `inline-flex min-h-9 items-center rounded-lg bg-navy-900 px-3 text-sm font-semibold text-white ${focusRing}`

export const filterIdleClass = `inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-cream-100 hover:text-navy-900 ${focusRing}`

export const tableWrapClass = 'overflow-x-auto rounded-xl border border-line bg-white shadow-card'

export const tableClass = 'min-w-full text-left text-sm'

export const theadClass = 'border-b border-line bg-cream-50 text-[0.8125rem] text-slate-500'

export const thClass =
	'whitespace-nowrap px-4 py-2.5 font-medium first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6'

export const tdClass = 'px-4 py-3 text-navy-900 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6'

export const trClass = 'border-b border-cream-100 last:border-0'

export const emptyStateClass =
	'mt-6 rounded-xl border border-dashed border-cream-300 bg-white px-6 py-10 text-center text-sm leading-6 text-slate-600'
