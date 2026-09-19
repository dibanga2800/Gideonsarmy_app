import { utcToLondonDateAndTime } from '@/lib/dates/prayer-meeting'
import { EVENT_TYPES } from '@/types/roles'
import { eventTypeLabel } from '@/lib/events/display'
import {
	formGridClass,
	formSpan2Class,
	formSpanFullClass,
	inputClass,
	labelClass,
	primaryButtonClass,
	textareaClass,
} from '@/lib/ui'
import type { FellowshipEvent } from '@/types/database'

interface EventFormProps {
	action: (formData: FormData) => Promise<void>
	event?: FellowshipEvent
	submitLabel: string
}

export const EventForm = ({ action, event, submitLabel }: EventFormProps) => {
	const start = event ? utcToLondonDateAndTime(new Date(event.start_at)) : null
	const end = event?.end_at ? utcToLondonDateAndTime(new Date(event.end_at)) : null

	return (
		<form action={action} className={formGridClass}>
			{event ? <input type="hidden" name="eventId" value={event.id} /> : null}
			<div className={formSpan2Class}>
				<label htmlFor="title" className={labelClass}>
					Title
				</label>
				<input
					id="title"
					name="title"
					type="text"
					required
					maxLength={120}
					defaultValue={event?.title ?? ''}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="event_type" className={labelClass}>
					Type
				</label>
				<select
					id="event_type"
					name="event_type"
					required
					defaultValue={event?.event_type ?? 'FELLOWSHIP'}
					className={inputClass}
				>
					{EVENT_TYPES.map((type) => (
						<option key={type} value={type}>
							{eventTypeLabel(type)}
						</option>
					))}
				</select>
			</div>
			<div>
				<label htmlFor="startDate" className={labelClass}>
					Start date
				</label>
				<input
					id="startDate"
					name="startDate"
					type="date"
					required
					defaultValue={start?.date ?? ''}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="startTime" className={labelClass}>
					Start time
				</label>
				<input
					id="startTime"
					name="startTime"
					type="time"
					required
					defaultValue={start?.time ?? '20:00'}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="endDate" className={labelClass}>
					End date
				</label>
				<input
					id="endDate"
					name="endDate"
					type="date"
					defaultValue={end?.date ?? ''}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="endTime" className={labelClass}>
					End time
				</label>
				<input
					id="endTime"
					name="endTime"
					type="time"
					defaultValue={end?.time ?? ''}
					className={inputClass}
				/>
			</div>
			<div className={formSpanFullClass}>
				<label htmlFor="description" className={labelClass}>
					Description
				</label>
				<textarea
					id="description"
					name="description"
					maxLength={2000}
					defaultValue={event?.description ?? ''}
					className={textareaClass}
				/>
			</div>
			<p className={`${formSpanFullClass} text-sm text-navy-800/70`}>
				Times are Europe/London, including UK daylight saving time. The monthly
				prayer meeting is calculated automatically and is not stored here.
			</p>
			<div className={formSpanFullClass}>
				<button type="submit" className={primaryButtonClass}>
					{submitLabel}
				</button>
			</div>
		</form>
	)
}
