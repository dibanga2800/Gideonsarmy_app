import type { ReactNode } from 'react'
import { duesStatusLabel, paymentSubmissionStatusLabel } from '@/lib/dues/display'
import { membershipStatusLabel } from '@/lib/members/display'
import type { DuesStatus, MembershipStatus, PaymentSubmissionStatus } from '@/types/roles'

export type BadgeTone = 'positive' | 'warning' | 'negative' | 'info' | 'neutral' | 'brand'

const toneClass: Record<BadgeTone, string> = {
	positive: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
	warning: 'bg-amber-50 text-amber-800 ring-amber-600/25',
	negative: 'bg-red-50 text-red-800 ring-red-600/20',
	info: 'bg-sky-50 text-sky-800 ring-sky-600/20',
	neutral: 'bg-cream-100 text-slate-600 ring-slate-500/15',
	brand: 'bg-gold-100 text-gold-700 ring-gold-500/30',
}

const dotClass: Record<BadgeTone, string> = {
	positive: 'bg-emerald-500',
	warning: 'bg-amber-500',
	negative: 'bg-red-500',
	info: 'bg-sky-500',
	neutral: 'bg-slate-400',
	brand: 'bg-gold-500',
}

interface StatusBadgeProps {
	tone: BadgeTone
	children: ReactNode
	dot?: boolean
}

export const StatusBadge = ({ tone, children, dot = true }: StatusBadgeProps) => (
	<span
		className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass[tone]}`}
	>
		{dot ? <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`} aria-hidden="true" /> : null}
		{children}
	</span>
)

const duesTone: Record<DuesStatus, BadgeTone> = {
	OUTSTANDING: 'warning',
	PAYMENT_SUBMITTED: 'info',
	CONFIRMED: 'positive',
	WAIVED: 'neutral',
	NOT_APPLICABLE: 'neutral',
}

export const DuesStatusBadge = ({ status }: { status: DuesStatus }) => (
	<StatusBadge tone={duesTone[status]}>{duesStatusLabel(status)}</StatusBadge>
)

const membershipTone: Record<MembershipStatus, BadgeTone> = {
	ACTIVE: 'positive',
	PENDING: 'warning',
	INACTIVE: 'neutral',
}

export const MembershipBadge = ({ status }: { status: MembershipStatus }) => (
	<StatusBadge tone={membershipTone[status]}>{membershipStatusLabel(status)}</StatusBadge>
)

const paymentTone: Record<PaymentSubmissionStatus, BadgeTone> = {
	SUBMITTED: 'info',
	CONFIRMED: 'positive',
	REJECTED: 'negative',
}

export const PaymentStatusBadge = ({ status }: { status: PaymentSubmissionStatus }) => (
	<StatusBadge tone={paymentTone[status]}>{paymentSubmissionStatusLabel(status)}</StatusBadge>
)

export const RoleBadge = ({ role }: { role: 'MEMBER' | 'ADMIN' }) =>
	role === 'ADMIN' ? (
		<StatusBadge tone="brand" dot={false}>
			Administrator
		</StatusBadge>
	) : (
		<span className="text-sm text-slate-600">Member</span>
	)

export const ComplianceBadge = ({ isUpToDate }: { isUpToDate: boolean }) =>
	isUpToDate ? (
		<StatusBadge tone="positive">Up to date</StatusBadge>
	) : (
		<StatusBadge tone="warning">Owing</StatusBadge>
	)
