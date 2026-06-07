import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playground.atidcollege.co.il/');
  await page.getByText('user_limited_access').click();
  await page.getByText('user_limited_access').click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('user_limited_access');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('user_network_delay').click();
  await page.getByRole('textbox', { name: 'Username' }).dblclick();
  await page.getByText('user_network_delay').dblclick();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('user_limited');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Invalid username or password.').click();
  await page.getByText('Invalid username or password.').click();
});
