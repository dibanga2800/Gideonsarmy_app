'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eventIdSchema, eventInputSchema } from '@/lib/validation/event'
import { createEvent, deleteEvent, updateEvent } from '@/server/services/event-service'

const formValue = (formData: FormData, key: string) => {
	const value = formData.get(key)
	return typeof value === 'string' ? value : ''
}

const parseEventForm = (formData: FormData) =>
	eventInputSchema.safeParse({
		title: formValue(formData, 'title'),
		description: formValue(formData, 'description'),
		event_type: formValue(formData, 'event_type'),
		startDate: formValue(formData, 'startDate'),
		startTime: formValue(formData, 'startTime'),
		endDate: formValue(formData, 'endDate'),
		endTime: formValue(formData, 'endTime'),
	})

export const createEventAction = async (formData: FormData) => {
	const parsed = parseEventForm(formData)

	if (!parsed.success) {
		redirect('/admin/events/new?error=invalid')
	}

	const result = await createEvent(parsed.data)

	if (!result.ok) {
		redirect('/admin/events/new?error=save')
	}

	revalidatePath('/events')
	revalidatePath('/dashboard')
	revalidatePath('/admin/events')
	redirect('/events?updated=1')
}

export const updateEventAction = async (formData: FormData) => {
	const id = eventIdSchema.safeParse(formValue(formData, 'eventId'))
	const parsed = parseEventForm(formData)

	if (!id.success) {
		redirect('/events?error=invalid')
	}

	if (!parsed.success) {
		redirect(`/admin/events/${id.data}?error=invalid`)
	}

	const result = await updateEvent(id.data, parsed.data)

	if (!result.ok) {
		redirect(`/admin/events/${id.data}?error=save`)
	}

	revalidatePath('/events')
	revalidatePath('/dashboard')
	revalidatePath(`/admin/events/${id.data}`)
	redirect('/events?updated=1')
}

export const deleteEventAction = async (formData: FormData) => {
	const id = eventIdSchema.safeParse(formValue(formData, 'eventId'))

	if (!id.success) {
		redirect('/events?error=invalid')
	}

	const result = await deleteEvent(id.data)

	if (!result.ok) {
		redirect(`/admin/events/${id.data}?error=save`)
	}

	revalidatePath('/events')
	revalidatePath('/dashboard')
	redirect('/events?deleted=1')
}
