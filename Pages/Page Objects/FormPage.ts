import { Locator, Page } from '@playwright/test';
import { BaseElements } from '../Elements Objects/BaseElements';

export class FormPage extends BaseElements {
  page: Page;
  readonly occupation: Locator;
  readonly age: Locator;
  readonly location: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.occupation = page.locator('input[id="occupation"]');
    this.age = page.locator('input[id="age"]');
    this.location = page.locator('input[id="location"]');
  }

  async fillForm(occupation: string, age: string, location: string) {
    await this.occupation.fill(occupation);
    await this.age.fill(age);
    await this.location.fill(location);
    await this.clickButton.click();
  }
}
