import { Locator, Page } from '@playwright/test';
import { BaseElements } from '../Elements Objects/BaseElements';

export class LoginPage extends BaseElements {
  page: Page;
  readonly userNameField: Locator;
  readonly passwordField: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.userNameField = page.locator('input[id="username2"]');
    this.passwordField = page.locator('input[id="password2"]');
  }

  async login(username: string, password: string) {
    await this.userNameField.fill(username);
    await this.passwordField.fill(password);
    await this.submitButton.click();
  }
}
