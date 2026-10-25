import { test, expect, seed, db } from './helpers.js';

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

test('Foto-Import erkennt eine zweispaltige Vokabelliste', async ({ page }) => {
  test.skip(!!process.env.CI && process.env.SKIP_OCR === '1', 'OCR übersprungen');
  /* Die Texterkennung wird normalerweise aus dem Internet (jsDelivr) geladen – im Test aus node_modules */
  await page.context().route('https://cdn.jsdelivr.net/**', async route => {
    const m = route.request().url().match(/\/npm\/((?:@[^/]+\/)?[^@/]+)(?:@[^/]+)?\/(.*)$/);
    const path = m && `node_modules/${m[1]}/${m[2]}`;
    try { await route.fulfill({ path, headers: { 'access-control-allow-origin': '*', 'content-type': path.endsWith('.wasm') ? 'application/wasm' : path.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' } }); }
    catch { await route.abort(); }
  });
  await seed(page);
  await page.goto('./#edit/new');
  await page.locator('#e-photo').setInputFiles('tests/fixtures/vokabelliste.png');
  await expect(page.locator('#e-imp')).toHaveValue(/la candidatura - die Bewerbung/, { timeout: 60_000 });
  await expect(page.locator('#e-imp')).toHaveValue(/la città - die Stadt/);
  await expect(page.locator('#e-imp')).toHaveValue(/perché - warum/);
});
