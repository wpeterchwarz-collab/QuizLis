import { test, expect, seed } from './helpers.js';

test('Erster Start: Basiswortschatz ist da, Installationshinweis sichtbar', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.brand')).toContainText('QuizLis');
  await expect(page.locator('.set-tile')).toHaveCount(9);
  await expect(page.locator('.install')).toBeVisible();
  await page.locator('[data-act=hideInstall]').click();
  await expect(page.locator('.install')).toHaveCount(0);
});

test('Alle Seiten öffnen sich ohne Fehler', async ({ page }) => {
  await seed(page);
  for (const r of ['', 'set/set1', 'edit/set1', 'edit/new', 'cards/set1', 'learn/set1', 'test/set1', 'match/set1', 'blast/set1', 'gravity/set1', 'library', 'settings', 'set/gibtsnicht', 'unbekannt', '%E0%A4%A']) {
    await page.goto(`./#${r}`);
    await expect(page.locator('#app header')).toBeVisible();
  }
});

test('Kein seitliches Scrollen auf kleinen iPhones (320 px)', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 320, height: 568 });
  for (const r of ['', 'set/set1', 'edit/set1', 'cards/set1', 'learn/set1', 'test/set1', 'library', 'settings']) {
    await page.goto(`./#${r}`);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Seite #${r} ist zu breit`).toBeLessThanOrEqual(0);
  }
});
