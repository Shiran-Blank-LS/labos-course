import { test, APIRequestContext } from '@playwright/test';

// Test case to perform a GET request
test('Verify API response', async ({ request }: { request: APIRequestContext }) => {
  // API endpoint and parameters
  const apiUrl: string = 'https://api.openweathermap.org/data/2.5/weather';
  const city: string = 'Haifa';
  const apiKey: string = '1f2c4dbd35f1beea747df816bb8b1090';
  const units: string = 'metric';

  const queryParams: Record<string, string> = {
    appid: apiKey,
    q: city,
    units: units,
  };
  const response = await request.get(apiUrl, { params: queryParams });

  console.log(await response.json());
});
