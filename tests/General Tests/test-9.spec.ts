import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playground.atidcollege.co.il/');
  await page.getByText('user_basic').click();
  await page.getByText('user_basic').dblclick();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('user_basic');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('heading', { name: 'ATID Automation Playground 🚀' }).click();
  await page.getByRole('heading', { name: 'ATID Automation Playground 🚀' }).click();
  await page.getByRole('heading', { name: 'ATID Automation Playground 🚀' }).click();
  await expect(page.getByRole('heading', { name: 'ATID Automation Playground 🚀' })).toBeVisible();
});
