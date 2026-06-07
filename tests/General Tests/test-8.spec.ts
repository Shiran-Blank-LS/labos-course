import { test, expect, Locator } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://atidcollege.co.il/Xamples/ex_actions.html');
  const draggable: string = "[id='draggable']";
  const droppable: string = "[id='droppable']";

  await page.dragAndDrop(draggable, droppable, { force: true });
  await expect(page.locator('#droppable')).toContainText('Dropped!');

  const list: Locator[] = await page.locator('li.ui-widget-content').all();
  await page.keyboard.down('Control'); // hold down key
  await list[1].click();
  await list[2].click();
  await page.keyboard.down('Control'); // release key

  const dclick: Locator = await page.locator('id=dbl_click');
  await dclick.dblclick();
});
