/* Führt die echte Foto-Erkennung der App (Bildaufbereitung + Tesseract) im Browser auf allen Testbildern aus
   und speichert die Wortpositionen als JSON. Die Unit-Tests prüfen die Paar-Bildung damit schnell ohne Tesseract.
   Aufruf (Server muss laufen: npm start):  node tests/fixtures/record-ocr.mjs [psm]  */
import { chromium } from '@playwright/test';
import { readdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('.', import.meta.url));
const root = fileURLToPath(new URL('../..', import.meta.url));
const out = process.env.OUT || join(dir, 'ocr');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('https://cdn.jsdelivr.net/**', async route => {
  const m = route.request().url().match(/\/npm\/((?:@[^/]+\/)?[^@/]+)(?:@[^/]+)?\/(.*)$/);
  const path = m && join(root, 'node_modules', m[1], m[2]);
  if (!path || !existsSync(path)) return route.abort();
  await route.fulfill({ path, headers: { 'access-control-allow-origin': '*', 'content-type': path.endsWith('.wasm') ? 'application/wasm' : path.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' } });
});
await page.goto('http://localhost:4173/');
for (const f of readdirSync(dir).filter(f => /\.(png|jpg)$/.test(f) && f !== 'vokabelliste.png')) {
  const b64 = readFileSync(join(dir, f)).toString('base64');
  const data = await page.evaluate(async ([b64, type, psm]) => {
    const { recognizeLines } = await import('./js/ocr.js');
    const file = await (await fetch(`data:${type};base64,${b64}`)).blob();
    if (psm) { const T = window.Tesseract; }
    return recognizeLines(file, ['it', 'de']);
  }, [b64, f.endsWith('.jpg') ? 'image/jpeg' : 'image/png', process.argv[2]]);
  writeFileSync(join(out, f.replace(/\.\w+$/, '.json')), JSON.stringify(data));
  console.log(f, data.lines.length, 'Zeilen');
}
await browser.close();
