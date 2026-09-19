export const MEMBER_ROLES = ['MEMBER', 'ADMIN'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export const MEMBERSHIP_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE'] as const
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]

export const DUES_STATUSES = [
	'OUTSTANDING',
	'PAYMENT_SUBMITTED',
	'CONFIRMED',
	'WAIVED',
	'NOT_APPLICABLE',
] as const
export type DuesStatus = (typeof DUES_STATUSES)[number]

export const PAYMENT_SUBMISSION_STATUSES = [
	'SUBMITTED',
	'CONFIRMED',
	'REJECTED',
] as const
export type PaymentSubmissionStatus = (typeof PAYMENT_SUBMISSION_STATUSES)[number]

export const EVENT_TYPES = ['FELLOWSHIP', 'SPECIAL', 'OUTING', 'OTHER'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const NOTIFICATION_TYPES = [
	'DUES_REMINDER',
	'BIRTHDAY_CELEBRANT',
	'BIRTHDAY_FELLOWSHIP',
	'ANNIVERSARY_CELEBRANT',
	'ANNIVERSARY_FELLOWSHIP',
	'EVENT_REMINDER',
	'CELEBRATION_DIGEST',
	'MEMBER_INVITE',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED', 'CANCELLED'] as const
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]
