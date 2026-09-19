import { expect, test } from '@playwright/test'

test('home page identifies the fellowship', async ({ page }) => {
	await page.goto('/')
	await expect(
		page.getByRole('heading', { name: "Gideon's Army Men's Fellowship" }),
	).toBeVisible()
})

test('login asks for Supabase setup when credentials are missing', async ({ page }) => {
	await page.goto('/login')
	await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
	await expect(page.getByRole('heading', { name: 'Your setup is needed' })).toBeVisible()
})
