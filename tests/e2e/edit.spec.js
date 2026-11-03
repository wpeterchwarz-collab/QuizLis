import { test, expect, seed, db, routeTesseract } from './helpers.js';
import { readFileSync } from 'node:fs';

test('Neues Set per Listen-Import anlegen', async ({ page }) => {
  await seed(page);
  await page.goto('./#edit/new');
  await page.locator('#e-title').fill('Lezione 5');
  await page.locator('#e-imp').fill('il cane\tder Hund\nil gatto - die Katze\nla mela; der Apfel');
  await expect(page.locator('#imp-count')).toHaveText('3 Karten erkannt');
  await page.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(page.locator('.edit-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('h1')).toHaveText('Lezione 5');
  await expect(page.locator('.term-row')).toHaveCount(3);
});

test('Bearbeiten behält den Lernfortschritt der Karten', async ({ page }) => {
  await seed(page, { data: { sets: [{ id: 'set1', title: 'T', termLang: 'it', defLang: 'de', cards: [{ id: 'cardA', term: 'la casa', def: 'Haus', box: 4, seen: true, due: 5 }] }], settings: { hideInstall: true } } });
  await page.goto('./#edit/set1');
  await page.locator('.e-def').first().fill('das Haus');
  await page.getByRole('button', { name: '+ Karte hinzufügen' }).click();
  await page.locator('.e-term').nth(1).fill('il libro'); await page.locator('.e-def').nth(1).fill('das Buch');
  await page.getByRole('button', { name: 'Speichern' }).click();
  const c = (await db(page)).sets[0].cards;
  expect(c).toHaveLength(2);
  expect(c[0]).toMatchObject({ id: 'cardA', def: 'das Haus', box: 4, seen: true });
});

test('Eingaben werden nie als HTML ausgeführt (Schutz vor Code-Einschleusung)', async ({ page }) => {
  await seed(page);
  await page.goto('./#edit/new');
  const evil = '<img src=x onerror="window.__hacked=1">';
  await page.locator('#e-title').fill(evil);
  await page.locator('.e-term').first().fill(evil); await page.locator('.e-def').first().fill('"><b>x</b>');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('h1')).toHaveText(evil);
  const id = page.url().split('#set/')[1];
  for (const r of ['', `cards/${id}`, `learn/${id}`, `test/${id}`, `edit/${id}`]) { await page.goto(`./#${r}`); await page.waitForTimeout(200); }
  expect(await page.evaluate(() => window.__hacked)).toBeUndefined();
});

test('Unvollständige Karten werden beim Speichern weggelassen, leere Sets nicht gespeichert', async ({ page }) => {
  await seed(page);
  await page.goto('./#edit/new');
  await page.locator('#e-title').fill('Halb');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('#toast')).toContainText('Mindestens eine Karte');
  await page.locator('.e-term').nth(0).fill('uno'); await page.locator('.e-def').nth(0).fill('eins');
  await page.locator('.e-term').nth(1).fill('nur Begriff');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('#toast')).toContainText('1 unvollständige');
  await expect(page.locator('.term-row')).toHaveCount(1);
});

test('Ungespeicherte Änderungen: Rückfrage beim Schließen; Set löschen', async ({ page }) => {
  await seed(page);
  await page.goto('./#edit/set1');
  await page.locator('#e-title').fill('Geändert');
  await page.locator('header [data-act=leave]').click();
  await expect(page).toHaveURL(/#set\/set1$/);
  await expect(page.locator('h1')).toHaveText('Testset');
  await page.goto('./#edit/set1');
  await page.getByRole('button', { name: 'Set löschen' }).click();
  await expect(page.locator('.set-tile')).toHaveCount(0);
});

for (const [file, n] of [['foto-schraeg.jpg', 10], ['foto-3spalten.jpg', 10], ['heft-strich.jpg', 8]]) {
  test(`Foto-Import mit Prüfliste: ${file}`, async ({ page }) => {
    await routeTesseract(page);
    await seed(page);
    await page.goto('./#edit/new');
    await page.locator('#e-title').fill('Aus Foto');
    await page.locator('#e-photo').setInputFiles(`tests/fixtures/${file}`);
    await expect(page.locator('.scan-head')).toContainText(`${n} Paare erkannt`, { timeout: 90_000 });
    const expected = JSON.parse(readFileSync(`tests/fixtures/${file.replace(/\.\w+$/, '.json')}`, 'utf8'));
    const rows = page.locator('.scan-row');
    for (let i = 0; i < n; i++) {
      await expect(rows.nth(i).locator('.s-term')).toHaveValue(expected[i][0]);
      await expect(rows.nth(i).locator('.s-def')).toHaveValue(expected[i][1]);
    }
    /* ein Paar abwählen, eins korrigieren, übernehmen */
    await rows.nth(0).locator('.s-on').uncheck();
    await rows.nth(1).locator('.s-def').fill('die Bewerbung (korrigiert)');
    await page.getByRole('button', { name: `${n - 1} Karten übernehmen` }).click();
    await expect(page.locator('.edit-row')).toHaveCount(n - 1);
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.locator('.term-row')).toHaveCount(n - 1);
    await expect(page.locator('.term-row').first()).toContainText('die Bewerbung (korrigiert)');
  });
}

test('Foto-Import: Spalten tauschen und zweites Foto sammeln', async ({ page }) => {
  await routeTesseract(page);
  await seed(page);
  await page.goto('./#edit/new');
  await page.locator('#e-photo').setInputFiles('tests/fixtures/heft-strich.jpg');
  await expect(page.locator('.scan-head')).toContainText('8 Paare erkannt', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Spalten tauschen' }).click();
  await expect(page.locator('.s-term').first()).toHaveValue('das Vorstellungsgespräch');
  await page.locator('#e-photo').setInputFiles('tests/fixtures/buch-2spalten.png');
  await expect(page.locator('.scan-head')).toContainText('18 Paare erkannt', { timeout: 90_000 });
});

test('Foto-Import: kein lesbares Bild → verständliche Meldung', async ({ page }) => {
  await seed(page);
  await page.goto('./#edit/new');
  await page.locator('#e-photo').setInputFiles({ name: 'kaputt.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('kein Bild') });
  await expect(page.locator('#toast')).toContainText('Bild konnte nicht gelesen werden');
});
