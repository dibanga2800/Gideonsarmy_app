import { z } from 'zod'

const publicEnvSchema = z.object({
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
	NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
})

const serverEnvSchema = publicEnvSchema.extend({
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

const readPublicEnv = () => ({
	NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
	NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})

export const getPublicEnvOrNull = () => {
	const parsed = publicEnvSchema.safeParse(readPublicEnv())
	return parsed.success ? parsed.data : null
}

export const isSupabaseConfigured = () => getPublicEnvOrNull() !== null

export const getPublicEnv = () => publicEnvSchema.parse(readPublicEnv())

export const getServerEnv = () => serverEnvSchema.parse({
	...readPublicEnv(),
	SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
})

export const getSiteUrl = () => {
	return getPublicEnvOrNull()?.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}
