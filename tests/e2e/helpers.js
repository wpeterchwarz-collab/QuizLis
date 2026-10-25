import { test as base, expect } from '@playwright/test';

/* Jeder Test schlägt fehl, sobald im Browser ein JavaScript-Fehler auftritt. Bestätigungsdialoge werden mit „OK“ beantwortet. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    page.on('dialog', d => d.accept());
    await use(page);
    expect(errors, 'Es dürfen keine JavaScript-Fehler auftreten').toEqual([]);
  },
});
export { expect };

export const SAMPLE = [['la casa', 'das Haus'], ['il libro', 'das Buch'], ['la città', 'die Stadt'], ['mangiare', 'essen'], ['perché', 'warum / weil'], ['grazie', 'danke']];

/* Legt vor dem App-Start ein kleines, bekanntes Testset an (nur beim ersten Laden, damit „Neu laden“ Daten behält). */
export async function seed(page, { cards = SAMPLE, data = {} } = {}) {
  await page.addInitScript(([cards, data]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('quizlis.v1', JSON.stringify({
      sets: [{ id: 'set1', title: 'Testset', termLang: 'it', defLang: 'de', cards: cards.map(([term, def], i) => ({ id: `card${i}`, term, def })) }],
      settings: { hideInstall: true }, ...data,
    }));
  }, [cards, data]);
}
export const db = page => page.evaluate(() => JSON.parse(localStorage.getItem('quizlis.v1')));
export async function answers(page) {
  const m = {};
  for (const s of (await db(page)).sets) for (const c of s.cards) { m[c.def] = c.term; m[c.term] = c.def; }
  return m;
}

/* Spielt eine komplette Lernrunde; wrongFirst: erste Schreibfrage absichtlich falsch */
export async function playLearnRound(page, { wrongFirst = false } = {}) {
  const map = await answers(page);
  let wroteWrong = !wrongFirst;
  for (let i = 0; i < 80; i++) {
    if (await page.locator('.celebrate').isVisible()) return;
    const q = (await page.locator('#q-text').innerText()).trim();
    if (await page.locator('.mc-opt').first().isVisible()) {
      await page.locator('.mc-grid').getByText(map[q], { exact: true }).click();
      await page.waitForTimeout(950);
    } else {
      await page.locator('#wi').fill(wroteWrong ? map[q] : 'sicher falsch');
      await page.locator('#wi').press('Enter');
      if (!wroteWrong) { wroteWrong = true; await page.getByRole('button', { name: 'Weiter' }).click(); }
      else await page.waitForTimeout(950);
    }
  }
  throw new Error('Lernrunde wurde nicht beendet');
}
