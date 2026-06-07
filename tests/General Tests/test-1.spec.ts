import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playground.atidcollege.co.il/');
  await page.getByText('user_basic').click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('user_basic');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('A collection of practice web').click();
  await page.getByText('A collection of practice web').click();
  await expect(page.getByRole('row')).toContainText(
    'A collection of practice web applications, by ATID college',
  );
});
