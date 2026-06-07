import { test, expect, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, '..', 'db.json');
const dbSeedPath = path.resolve(__dirname, '..', 'db.seed.json');

function resetDb(): void {
  fs.copyFileSync(dbSeedPath, dbPath);
}

function logDbState(label: string): void {
  const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log(`\n--- DB state (${label}) ---`);
  console.log(dbContent);
  console.log('---\n');
}

test.describe.serial('Posts - POST GET PUT DELETE', () => {
  const apiBaseUrl = 'http://127.0.0.1:3000';
  let apiContext: APIRequestContext;
  let createdPostId: string;

  test.beforeAll(async ({ playwright }) => {
    resetDb();
    apiContext = await playwright.request.newContext({ baseURL: apiBaseUrl });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
    resetDb();
  });

  test.beforeEach(async ({}, testInfo) => {
    logDbState(`${testInfo.title} - before`);
  });

  test.afterEach(async ({}, testInfo) => {
    logDbState(`${testInfo.title} - after`);
  });

  test('POST - Request', async () => {
    const payload = {
      title: 'My new post',
      views: 150,
    };

    const response_json = await apiContext.post(`${apiBaseUrl}/posts`, { data: payload });

    console.log(await response_json.json());

    expect(response_json.status()).toEqual(201);
    createdPostId = (await response_json.json()).id;
  });

  test('GET - Request', async () => {
    const response_json = await apiContext.get(`${apiBaseUrl}/posts/${createdPostId}`);

    console.log(await response_json.json());

    const body = await response_json.json();
    expect(response_json.status()).toEqual(200);
    expect(body.id).toEqual(createdPostId);
    expect(body.title).toEqual('My new post');
    expect(body.views).toEqual(150);
  });

  test('PUT - Request', async () => {
    const payload = {
      title: 'Updated post',
      views: 999,
    };

    const response_json = await apiContext.put(`${apiBaseUrl}/posts/${createdPostId}`, {
      data: payload,
    });

    console.log(await response_json.json());

    const body = await response_json.json();
    expect(response_json.status()).toEqual(200);
    expect(body.id).toEqual(createdPostId);
    expect(body.title).toEqual('Updated post');
    expect(body.views).toEqual(999);
  });

  test('DELETE - Request', async () => {
    const response_json = await apiContext.delete(`${apiBaseUrl}/posts/${createdPostId}`);

    console.log(await response_json.json());

    expect(response_json.status()).toEqual(200);

    const getResponse = await apiContext.get(`${apiBaseUrl}/posts/${createdPostId}`);
    expect(getResponse.status()).toEqual(404);
  });
});
