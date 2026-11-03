import { test, expect, seed, db, playLearnRound } from './helpers.js';

const noGoal = { sets: [{ id: 'set1', title: 'Testset', termLang: 'it', defLang: 'de', cards: [['la casa', 'das Haus'], ['il libro', 'das Buch'], ['grazie', 'danke'], ['mangiare', 'essen']].map(([term, def], i) => ({ id: `card${i}`, term, def })) }], settings: { hideInstall: true } };

test('Erstes Lernen fragt nach dem Lernziel; die Wahl wird gespeichert', async ({ page }) => {
  await seed(page, { data: noGoal });
  await page.goto('./#learn/set1');
  await expect(page.locator('h1')).toHaveText('Wie möchtest du lernen?');
  await page.getByRole('button', { name: /Für eine Prüfung pauken/ }).click();
  await expect(page.locator('#q-text')).toBeVisible();
  await expect(page.locator('.goal-pill')).toHaveText('⚡ Prüfung');
  expect((await db(page)).sets[0].goal).toBe('short');
  await page.goto('./#set/set1');
  await expect(page.locator('.goal-line')).toContainText('Für eine Prüfung pauken');
});

test('Pauken: nach einer fehlerfreien Runde ist alles gelernt (100 %)', async ({ page }) => {
  await seed(page, { data: noGoal });
  await page.goto('./#learn/set1');
  await page.getByRole('button', { name: /Für eine Prüfung pauken/ }).click();
  await playLearnRound(page);
  await expect(page.locator('.goal-progress')).toContainText('4 von 4');
  await expect(page.locator('.done')).toContainText('Alle Wörter sitzen');
  await page.goto('./#set/set1'); await page.locator('.mode', { hasText: 'Lernen' }).click();
  await expect(page.locator('h1')).toHaveText('Alle Wörter sitzen!');
});

test('Langfristig: nach einer Runde noch nicht „gelernt“ – Erklärung wird angezeigt', async ({ page }) => {
  await seed(page, { data: noGoal });
  await page.goto('./#learn/set1');
  await page.getByRole('button', { name: /Langfristig merken/ }).click();
  await playLearnRound(page);
  await expect(page.locator('.goal-progress')).toContainText('0 von 4');
  await page.goto('./#set/set1'); await page.locator('.mode', { hasText: 'Lernen' }).click();
  await expect(page.locator('h1')).toHaveText('Alles erledigt!');
  await expect(page.getByRole('button', { name: /Auf „Pauken“ umstellen/ })).toBeVisible();
});

test('Lernziel lässt sich jederzeit wechseln – im Lernmodus und auf der Set-Seite', async ({ page }) => {
  await seed(page);                                   // Testset hat bereits „langfristig“
  await page.goto('./#learn/set1');
  await expect(page.locator('.goal-pill')).toHaveText('⏳ Langzeit');
  await page.locator('.goal-pill').click();
  await expect(page.locator('h1')).toHaveText('Lernziel ändern');
  await expect(page.locator('.goal-opt.on')).toContainText('Langfristig merken');
  await page.getByRole('button', { name: /Für eine Prüfung pauken/ }).click();
  await expect(page.locator('.goal-pill')).toHaveText('⚡ Prüfung');

  await page.goto('./#set/set1');
  await page.getByRole('link', { name: 'ändern' }).click();
  await page.getByRole('button', { name: /Langfristig merken/ }).click();
  expect((await db(page)).sets[0].goal).toBe('long');
});

test('Wörter pro Lernrunde einstellbar', async ({ page }) => {
  const many = Array.from({ length: 25 }, (_, i) => [`parola${i}`, `Wort${i}`]);
  await seed(page, { cards: many });
  await page.goto('./#settings');
  await page.locator('#s-round').selectOption('20');
  await page.goto('./#learn/set1');
  await expect(page.locator('.topbar-title')).toHaveText('Lernen · 0/20');
});

test('Bestehender Fortschritt bleibt beim Wechsel erhalten', async ({ page }) => {
  await seed(page, { data: { ...noGoal, sets: [{ ...noGoal.sets[0], goal: 'long', cards: noGoal.sets[0].cards.map((c, i) => ({ ...c, seen: true, box: i < 2 ? 3 : 1, due: Date.now() + 86400000 })) }] } });
  await page.goto('./#learn/set1');
  await expect(page.locator('h1')).toHaveText('Alles erledigt!');
  await expect(page.locator('.goal-progress')).toContainText('2 von 4');
  await page.getByRole('button', { name: /Auf „Pauken“ umstellen/ }).click();
  await page.getByRole('button', { name: /Für eine Prüfung pauken/ }).click();
  await expect(page.locator('.topbar-title')).toHaveText('Lernen · 0/2');   // nur die 2 noch nicht gelernten
});
