import { test, expect, seed, db, playLearnRound } from './helpers.js';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Daten bleiben nach Neuladen erhalten', async ({ page }) => {
  await seed(page);
  await page.goto('./#learn/set1');
  await playLearnRound(page);
  await page.reload();
  await page.goto('./#set/set1');
  await expect(page.locator('.stat.learning b')).toHaveText('6');
});

test('Sicherung exportieren und wiederherstellen', async ({ page }) => {
  await seed(page);
  await page.goto('./#settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Sicherung exportieren' }).click()]);
  const backup = JSON.parse(await (await import('node:fs/promises')).readFile(await dl.path(), 'utf8'));
  expect(backup.app).toBe('QuizLis');
  expect(backup.data.sets[0].cards).toHaveLength(6);

  backup.data.sets[0].title = 'Aus der Sicherung';
  const file = join(tmpdir(), `quizlis-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(backup));
  await page.locator('#s-file').setInputFiles(file);
  await expect(page.locator('.set-tile-title')).toHaveText('Aus der Sicherung');

  writeFileSync(file, '{"irgendwas": true}');
  await page.goto('./#settings');
  await page.locator('#s-file').setInputFiles(file);
  await expect(page.locator('#toast')).toContainText('keine gültige');
});

test('Bibliothek: gelöschte Sets lassen sich wieder hinzufügen', async ({ page }) => {
  await page.goto('./#library');
  await expect(page.locator('.pill-ok')).toHaveCount(9);
  const id = (await db(page)).sets[0].id;
  await page.goto(`./#edit/${id}`);
  await page.getByRole('button', { name: 'Set löschen' }).click();
  await page.goto('./#library');
  await expect(page.getByRole('button', { name: 'Hinzufügen', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(page.locator('.pill-ok')).toHaveCount(9);
});

test('Beschädigter Speicher führt nicht zum Absturz', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('quizlis.v1', '{kaputt'); } });
  await page.goto('./');
  await expect(page.locator('.set-tile')).toHaveCount(9);
});

test('Offline: App startet ohne Internet (Service Worker)', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Service Worker in WebKit-Testumgebung eingeschränkt');
  await seed(page);
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.brand')).toBeVisible();
  await page.goto('./#learn/set1');
  await expect(page.locator('#q-text')).toBeVisible();
  await context.setOffline(false);
});
