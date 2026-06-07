import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://atidcollege.co.il/Xamples/bmi/');
  await page.locator('#weight').fill('63');
  await page.locator('#hight').fill('168');
  await page.getByRole('button', { name: 'Calculate BMI' }).click();
  await expect(page.locator('#bmi_result')).toHaveValue('22');
  await expect(page.locator('#bmi_means')).toHaveValue('That you are healthy.');
});

test('calculate BMI with mouse click', async ({ page }) => {
  await page.goto('https://atidcollege.co.il/Xamples/bmi/');
  await page.locator('#weight').fill('63');
  await page.locator('#hight').fill('168');
  await expect(page.getByRole('button', { name: 'Calculate BMI' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Calculate BMI' })).toBeEnabled();
  await page.getByRole('button', { name: 'Calculate BMI' }).click();

  const boundingBox = await page.getByRole('button', { name: 'Calculate BMI' }).boundingBox();
  expect(boundingBox).not.toBeNull();
  const x_coordinate = boundingBox!.x;
  const y_coordinate = boundingBox!.y;
  const width = boundingBox!.width;
  const height = boundingBox!.height;
  console.log(x_coordinate, y_coordinate, width, height);

  await expect(page.getByText('Please Fill in all fields')).not.toBeVisible();
});
