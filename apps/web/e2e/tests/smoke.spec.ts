import { test, expect } from '@playwright/test';

test('login page shows Google sign-in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
  await expect(page.getByText(/university Google account/i)).toBeVisible();
});
