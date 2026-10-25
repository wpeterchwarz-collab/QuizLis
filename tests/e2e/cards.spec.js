import { test, expect, seed } from './helpers.js';

test('Karteikarten: umdrehen, sortieren per Knopf und Wischen, Abschluss', async ({ page }) => {
  await seed(page);
  await page.goto('./#cards/set1');
  await expect(page.locator('.topbar-title')).toHaveText('1 / 6');
  await page.locator('#fc .fc-text').first().click();
  await expect(page.locator('#fc')).toHaveClass(/flipped/);
  await page.locator('[data-act=yes]').click();
  await page.locator('[data-act=no]').click();
  /* Wischen nach rechts = „Kann ich“ */
  const box = await page.locator('#fc').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.topbar-title')).toHaveText('4 / 6');
  await expect(page.locator('.cnt.ok')).toHaveText('2');
  for (let i = 0; i < 3; i++) await page.locator('[data-act=yes]').click();
  await expect(page.locator('h1')).toHaveText('Gut gemacht!');
  await page.getByRole('button', { name: /Unsichere Karten wiederholen \(1\)/ }).click();
  await expect(page.locator('.topbar-title')).toHaveText('1 / 1');
});

test('Vorderseite umschalten wird gespeichert', async ({ page }) => {
  await seed(page);
  await page.goto('./#cards/set1');
  await expect(page.locator('.fc-front .side-label')).toHaveText('Italienisch');
  await page.locator('[data-act=side]').click();
  await expect(page.locator('.fc-front .side-label')).toHaveText('Deutsch');
  await page.reload();
  await expect(page.locator('.fc-front .side-label')).toHaveText('Deutsch');
});
