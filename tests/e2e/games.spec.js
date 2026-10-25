import { test, expect, seed, db, answers } from './helpers.js';

test('Match: richtige Paare, Strafsekunde, Bestzeit', async ({ page }) => {
  await seed(page);
  await page.goto('./#match/set1');
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  const map = await answers(page);
  const texts = await page.locator('.tile').allInnerTexts();
  /* absichtlicher Fehler */
  const a = texts[0], wrongIdx = texts.findIndex(t => t !== map[a] && t !== a);
  await page.locator('.tile').nth(0).click(); await page.locator('.tile').nth(wrongIdx).click();
  await page.waitForTimeout(500);
  const done = new Set();
  for (let i = 0; i < texts.length; i++) {
    if (done.has(i)) continue;
    const j = texts.findIndex((t, k) => k !== i && !done.has(k) && map[texts[i]] === t);
    await page.locator('.tile').nth(i).click(); await page.locator('.tile').nth(j).click();
    done.add(i); done.add(j);
  }
  await expect(page.locator('h1')).toHaveText('Neue Bestzeit!');
  await expect(page.locator('.done')).toContainText('1 s Strafzeit');
  expect((await db(page)).best.set1).toBeGreaterThan(0);
});

test('Blast: Treffer geben Punkte, Fehler kosten Leben, Game over', async ({ page }) => {
  await seed(page);
  await page.goto('./#blast/set1');
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  const map = await answers(page);
  const shoot = async correct => {
    const word = (await page.locator('#pword').innerText()).trim();
    const rock = correct ? page.locator('#field .rock:not(.boom)').getByText(map[word], { exact: true })
      : page.locator('#field .rock:not(.boom)').filter({ hasNotText: map[word] }).first();
    await rock.dispatchEvent('pointerdown');
  };
  await shoot(true); await page.waitForTimeout(600);
  await shoot(true); await page.waitForTimeout(600);
  await expect(page.locator('#score')).not.toHaveText('0 Pkt');
  for (let i = 0; i < 3; i++) { await shoot(false); await page.waitForTimeout(1500); }
  await expect(page.locator('h1')).toHaveText('Neuer Rekord!');
  expect((await db(page)).best.blast_set1).toBeGreaterThan(0);
});

test('Blast: verpasste Zeit zählt als Fehler', async ({ page }) => {
  await page.clock.install();
  await seed(page);
  await page.goto('./#blast/set1');
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await page.clock.runFor(13_500);
  await expect(page.locator('#lives')).toHaveText('❤️❤️🖤');
});

test('Gravity: tippen, doppeltes Enter, Fehler abschreiben', async ({ page }) => {
  await seed(page);
  await page.goto('./#gravity/set1');
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  const map = await answers(page);
  const word = async () => (await page.locator('#field .rock:not(.boom)').last().innerText()).trim();
  await page.locator('#gi').fill(map[await word()]);
  await page.locator('#gi').press('Enter');
  await page.locator('#gi').fill('nochmal'); await page.locator('#gi').press('Enter'); // während der kurzen Pause: darf nichts kaputt machen
  await page.waitForTimeout(500);
  await expect(page.locator('#score')).not.toHaveText('0 Pkt');
  await expect(page.locator('#lives')).toHaveText('❤️❤️❤️');
  await page.locator('#gi').fill('ganz falsch'); await page.locator('#gi').press('Enter');
  await expect(page.locator('.copy-box')).toBeVisible();
  await expect(page.locator('#lives')).toHaveText('❤️❤️🖤');
  const correct = (await page.locator('.copy-box .ans').innerText()).trim();
  await page.locator('#gi').fill('falsch abgeschrieben'); await page.locator('#gi').press('Enter');
  await expect(page.locator('.copy-box')).toBeVisible();
  await page.locator('#gi').fill(correct); await page.locator('#gi').press('Enter');
  await expect(page.locator('.copy-box')).toHaveCount(0);
});

test('Gravity: Einschlag kostet ein Leben', async ({ page }) => {
  await page.clock.install();
  await seed(page);
  await page.goto('./#gravity/set1');
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await page.clock.runFor(11_500);
  await expect(page.locator('.copy-box')).toContainText('Einschlag');
});
