import { test } from '@playwright/test';
import { LoginPage } from '../Pages/Page Objects/LoginPage';
import { FormPage } from '../Pages/Page Objects/FormPage';

test('Login and fill form', async ({ page }) => {
  await page.goto('https://atidcollege.co.il/Xamples/webdriveradvance.html');
  const loginPage = new LoginPage(page);
  await loginPage.login('selenium', 'webdriver');
  const formPage = new FormPage(page);
  await formPage.fillForm('QaDeveloper', '35', 'Ganey-Tikva');
});
