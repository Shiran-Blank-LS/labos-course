import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Playwright logo Playwright' }).click();

  await page
    .getByLabel('Main')
    .getByRole('link', { name: /Playwright logo/i })
    .click();
  await page
    .getByRole('link')
    .filter({
      has: page.getByAltText('Playwright logo'),
    })
    .click();

  await page.getByAltText('Playwright logo').click();

  await page.locator('nav[aria-label="Main"]').getByRole('link', { name: 'Playwright' }).click();
});
