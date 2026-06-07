import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playground.atidcollege.co.il/');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('user_premium');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('div:nth-child(13) > .mt-auto').click();
});
