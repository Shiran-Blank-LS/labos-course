import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  // await page.goto('https://playground.atidcollege.co.il/todo-list/index.html');
  await page.goto('https://playground.atidcollege.co.il/');

  await page.getByRole('textbox', { name: 'Username' }).fill('user_premium');

  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('div:nth-child(13) > .mt-auto').click();
  await expect(page.getByRole('textbox', { name: 'Add a new task...' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Add a new task...' }).fill('Test Task');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeVisible();
});
