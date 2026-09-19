'use client'

import { ConfirmDeleteForm } from '@/components/confirm-delete-form'

interface DeleteEventFormProps {
	action: (formData: FormData) => Promise<void>
	eventId: string
}

export const DeleteEventForm = ({ action, eventId }: DeleteEventFormProps) => {
	return (
		<ConfirmDeleteForm
			action={action}
			idName="eventId"
			idValue={eventId}
			triggerLabel="Delete event"
			title="Delete this event?"
			body="This cannot be undone. The gathering will be removed from the events list."
			confirmLabel="delete"
		/>
	)
}
