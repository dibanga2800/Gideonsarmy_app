import type {
	DuesStatus,
	EventType,
	PaymentSubmissionStatus,
} from '@/types/roles'
import type { Profile } from '@/lib/validation/profile'

export type { Profile }

export interface DuesRecord {
	id: string
	member_id: string
	due_month: string
	amount_due_pence: number
	amount_paid_pence: number
	status: DuesStatus
	created_at: string
	updated_at: string
}

export interface PaymentSubmission {
	id: string
	dues_id: string
	member_id: string
	amount_pence: number
	payment_date: string
	transaction_reference: string
	notes: string | null
	status: PaymentSubmissionStatus
	submitted_at: string
	reviewed_at: string | null
	reviewed_by: string | null
	reviewer_note: string | null
	created_at: string
	updated_at: string
}

export interface PaymentEvidence {
	id: string
	payment_submission_id: string
	member_id: string
	storage_path: string
	original_filename: string
	mime_type: string
	file_size: number
	created_at: string
}

export interface FellowshipEvent {
	id: string
	title: string
	description: string | null
	event_type: EventType
	start_at: string
	end_at: string | null
	is_recurring: boolean
	created_at: string
	updated_at: string
}
