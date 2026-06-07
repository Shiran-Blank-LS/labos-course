import { test, expect } from '@playwright/test';

test.describe('Data driven tests', () => {
  const users = [
    { username: 'user_basic', password: 'secret', validLogin: true },
    { username: 'user_premium', password: 'secret', validLogin: true },
    { username: 'user_admin', password: 'secret', validLogin: false },
  ];

  users.forEach((user) => {
    test(`Login with ${user.username}`, async ({ page }) => {
      await page.goto('https://playground.atidcollege.co.il/');
      await page.getByRole('textbox', { name: 'Username' }).fill(user.username);
      await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
      await page.getByRole('button', { name: 'Login' }).click();

      if (user.validLogin) {
        await expect(
          page.getByRole('heading', { name: 'ATID Automation Playground' }),
        ).toBeVisible();
      } else {
        await expect(page.getByText('Invalid username or password.')).toBeVisible();
      }
    });
  });
});
