import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logClientError } from '@/lib/logging'

const celebrantRowSchema = z.object({
	id: z.string().uuid(),
	first_name: z.string().min(1),
	last_name: z.string().min(1),
	birth_month: z.coerce.number().int().nullable(),
	birth_day: z.coerce.number().int().nullable(),
	anniversary_month: z.coerce.number().int().nullable(),
	anniversary_day: z.coerce.number().int().nullable(),
	spouse_name: z.string().nullable(),
	photo_storage_path: z.string().nullable(),
	anniversary_photo_storage_path: z.string().nullable(),
})

export type MonthCelebrantRow = z.infer<typeof celebrantRowSchema>

export const listMonthCelebrantRows = async (month: number) => {
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		return []
	}

	const supabase = createSupabaseServerClient()
	const { data, error } = await supabase.rpc('list_month_celebrants', {
		p_month: month,
	})

	if (error) {
		logClientError('celebrants.listMonth', error)
		return []
	}

	if (!Array.isArray(data)) {
		return []
	}

	return data.flatMap((row) => {
		const parsed = celebrantRowSchema.safeParse(row)
		return parsed.success ? [parsed.data] : []
	})
}
