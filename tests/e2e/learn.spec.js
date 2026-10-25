import { test, expect, seed, db, answers, playLearnRound } from './helpers.js';

test('Lernrunde komplett: Spaced Repetition und Lernserie werden gespeichert', async ({ page }) => {
  await seed(page);
  await page.goto('./#learn/set1');
  await playLearnRound(page);
  await expect(page.locator('h1')).toHaveText('Runde geschafft!');
  const d = await db(page);
  for (const c of d.sets[0].cards) { expect(c.seen).toBe(true); expect(c.box).toBe(1); expect(c.due).toBeGreaterThan(Date.now()); }
  expect(d.stats.streak).toBe(1);
  await page.goto('./#set/set1');
  await page.locator('.mode', { hasText: 'Lernen' }).click();
  await expect(page.locator('h1')).toHaveText('Alles erledigt!');
});

test('Falsche Antwort: Rückmeldung, Karte kommt wieder und zählt als Fehler', async ({ page }) => {
  await seed(page);
  await page.goto('./#learn/set1');
  await playLearnRound(page, { wrongFirst: true });
  await expect(page.locator('.done-item .bad')).toHaveCount(1);
  expect((await db(page)).sets[0].cards.filter(c => c.bad === 1)).toHaveLength(1);
});

test('Schreibmodus: Hinweise für Artikel, Akzent und „Ich hatte recht“', async ({ page }) => {
  await seed(page, { cards: [['la casa', 'das Haus'], ['la città', 'die Stadt']], data: { sets: [{ id: 'set1', title: 'T', termLang: 'it', defLang: 'de', cards: [{ id: 'cardA', term: 'la casa', def: 'das Haus', box: 2, seen: true, due: 1 }, { id: 'cardB', term: 'la città', def: 'die Stadt', box: 2, seen: true, due: 1 }] }], settings: { hideInstall: true } } });
  await page.goto('./#learn/set1');
  for (let i = 0; i < 2; i++) {
    const q = (await page.locator('#q-text').innerText()).trim();
    if (q === 'das Haus') {
      await page.locator('#wi').fill('casa'); await page.locator('#wi').press('Enter');
      await expect(page.locator('.fb-title')).toHaveText('Denk an den Artikel!');
      await page.getByRole('button', { name: 'Ich hatte recht' }).click();
    } else {
      await page.locator('#wi').fill('la citta'); await page.locator('#wi').press('Enter');
      await expect(page.locator('.fb-ok')).toContainText('Akzente');
      await page.waitForTimeout(2100);
    }
  }
});

test('Tastatur bleibt offen: dasselbe Eingabefeld wird weiterverwendet', async ({ page }) => {
  await seed(page, { data: { sets: [{ id: 'set1', title: 'T', termLang: 'it', defLang: 'de', cards: [['a1', 'eins'], ['b2', 'zwei'], ['c3', 'drei']].map(([t, d], i) => ({ id: `card${i}`, term: t, def: d, box: 2, seen: true, due: 1 })) }], settings: { hideInstall: true } } });
  await page.goto('./#learn/set1');
  const map = await answers(page);
  await page.evaluate(() => { document.getElementById('wi').dataset.marker = 'same'; });
  const q = (await page.locator('#q-text').innerText()).trim();
  await page.locator('#wi').fill(map[q]); await page.locator('#wi').press('Enter');
  await page.waitForTimeout(1000);
  await expect(page.locator('#wi')).toHaveAttribute('data-marker', 'same');
  await expect(page.locator('#wi')).toBeFocused();
});

test('Verlassen während der Rückmeldung springt nicht zurück in den Lernmodus', async ({ page }) => {
  await seed(page);
  await page.goto('./#learn/set1');
  const map = await answers(page);
  const q = (await page.locator('#q-text').innerText()).trim();
  await page.locator('.mc-grid').getByText(map[q], { exact: true }).click();
  await page.locator('header .icon-btn').first().click();
  await page.waitForTimeout(1300);
  await expect(page).toHaveURL(/#set\/set1$/);
  await expect(page.locator('h1')).toHaveText('Testset');
});
