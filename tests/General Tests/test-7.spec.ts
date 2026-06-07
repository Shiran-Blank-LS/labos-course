import { test, expect } from '@playwright/test';

test.describe('switchAndNavigation', () => {
  test('Exercise 1 - Switch to a new tab', async ({ page }) => {
    await page.goto('https://atidcollege.co.il/Xamples/ex_switch_navigation.html');

    page.once('dialog', async (dialog) => {
      console.log('Alert message: ', await dialog.message());
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Show alert' }).click();

    const alertOutput = await page.locator('span#output');
    await expect(alertOutput).toContainText('Alert is gone. ');

    page.once('dialog', async (dialog) => {
      console.log('Prompt message: ', await dialog.message());
      await dialog.accept('This is the prompt');
    });

    await page.getByRole('button', { name: 'Show prompt' }).click();
    await expect(alertOutput).toContainText('This is the prompt');

    const iframe = await page.frameLocator('iframe');
    const iframText = await iframe.locator("div[id='iframe_container']").innerText();
    expect(iframText).toContain('This is an IFrame !');
    console.log('Iframe text: ', iframText);
  });
});
