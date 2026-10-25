import { test, expect, seed, db, answers } from './helpers.js';

async function answerAll(page, map, { wrong = 0 } = {}) {
  let wrongLeft = wrong;
  for (const q of await page.locator('.tq').all()) {
    if (await q.locator('.tf-pair').count()) {
      const [a, , b] = await q.locator('.tf-pair > div').allInnerTexts();
      const truth = map[a.trim()] === b.trim();
      await q.getByRole('button', { name: (truth !== (wrongLeft-- > 0)) ? 'Wahr' : 'Falsch' }).click();
    } else if (await q.locator('.choice').count()) {
      const text = (await q.locator('.tq-q').innerText()).trim();
      await q.locator('.choice').getByText(map[text], { exact: true }).click();
    } else {
      const text = (await q.locator('.tq-q').innerText()).trim();
      await q.locator('input').fill(map[text]);
    }
  }
}

test('Klausurmodus: alles richtig ergibt Note 1 und wird am Set gespeichert', async ({ page }) => {
  await seed(page);
  await page.goto('./#test/set1');
  await expect(page.locator('#t-n')).toHaveValue('6');
  await page.getByRole('button', { name: 'Test starten' }).click();
  await expect(page.locator('.tq')).toHaveCount(6);
  await answerAll(page, await answers(page));
  await expect(page.locator('#answered')).toHaveText('6 von 6 beantwortet');
  await page.getByRole('button', { name: 'Test abgeben' }).click();
  await expect(page.locator('.grade')).toContainText('1');
  await expect(page.locator('.result-title')).toHaveText('Sehr gut');
  expect((await db(page)).sets[0].lastTest.grade).toBe(1);
});

test('Klausurmodus: Fehler werden ausgewertet und können geübt werden', async ({ page }) => {
  await seed(page);
  await page.goto('./#test/set1');
  await page.locator('input[name=types][value=mc]').uncheck();
  await page.locator('input[name=types][value=write]').uncheck();
  await page.getByRole('button', { name: 'Test starten' }).click();
  await answerAll(page, await answers(page), { wrong: 2 });
  await page.getByRole('button', { name: 'Test abgeben' }).click();
  await expect(page.locator('.rq.bad')).toHaveCount(2);
  await expect(page.locator('.result-title')).toHaveText('Befriedigend');
  await page.getByRole('button', { name: /Fehler im Lernen-Modus üben \(2\)/ }).click();
  await expect(page).toHaveURL(/#learn\/set1\/card\d,card\d$/);
});

test('Klausurmodus: Zeitlimit gibt den Test automatisch ab', async ({ page }) => {
  await page.clock.install();
  await seed(page);
  await page.goto('./#test/set1');
  await page.locator('#t-time').selectOption('5');
  await page.getByRole('button', { name: 'Test starten' }).click();
  await expect(page.locator('#timer')).toHaveText('5:00');
  await page.clock.fastForward('05:02');
  await expect(page.locator('.result-title')).toHaveText('Ungenügend');
});

test('Klausurmodus: Abbrechen fragt nach und führt zurück zum Set', async ({ page }) => {
  await seed(page);
  await page.goto('./#test/set1');
  await page.getByRole('button', { name: 'Test starten' }).click();
  await page.locator('.choice').first().click();
  await page.locator('header [data-act=leave]').click();
  await expect(page).toHaveURL(/#set\/set1$/);
});
