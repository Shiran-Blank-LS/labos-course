import { test, expect } from '@playwright/test';

test.describe('Describe1', () => {
  test.beforeAll(async () => {
    console.log('beforeAll1');
  });

  test.beforeEach(async ({ page }) => {
    console.log('beforeEach');
  });
  test('login', async ({ page }) => {
    console.log('test1-1');
  });
  test('search', async ({ page }) => {
    console.log('test2-1');
  });
});
test.describe('Describe2', () => {
  test.beforeAll(async () => {
    console.log('beforeAll2');
  });
  test.beforeEach(async ({ page }) => {
    console.log('beforeEach2');
  });
  test('login', async ({ page }) => {
    console.log('test2-1');
  });
  test('search', async ({ page }) => {
    console.log('test2-2');
  });
});
