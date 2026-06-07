import { Page } from '@playwright/test';

export class BaseElements {
  page: Page;
  submitButton: any;
  clickButton: any;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.locator('button[id="submit"]');
    this.clickButton = page.locator('button[type="button"]');
  }
}
