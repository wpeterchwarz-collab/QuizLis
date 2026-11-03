import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { pairsFromOcr, fixLetters, langScore } from '../../js/ocr-pairs.js';
import { binarize, estimateSkew, despeckle } from '../../js/ocr-image.js';

const FIX = new URL('../fixtures/', import.meta.url);

/* Echte Erkennungsergebnisse der Testfotos (aufgezeichnet mit tests/fixtures/record-ocr.mjs) */
for (const f of readdirSync(new URL('ocr/', FIX))) {
  test(`Foto-Import: ${f.replace('.json', '')} – alle Vokabeln richtig zugeordnet`, () => {
    const expected = JSON.parse(readFileSync(new URL(f, FIX), 'utf8'));
    const { pairs } = pairsFromOcr(JSON.parse(readFileSync(new URL(`ocr/${f}`, FIX), 'utf8')), { termLang: 'it', defLang: 'de' });
    const got = pairs.map(p => `${p.term} → ${p.def}`);
    for (const [t, d] of expected) assert.ok(got.includes(`${t} → ${d}`), `fehlt: ${t} → ${d}\nerkannt:\n${got.join('\n')}`);
    assert.ok(pairs.length <= expected.length + 1, `zu viele Paare: ${got.join(' | ')}`);
  });
}

/* Hilfen zum Bauen künstlicher Erkennungsergebnisse */
const W = (text, x0, y0, w = text.length * 14, h = 26) => ({ text, bbox: { x0, y0, x1: x0 + w, y1: y0 + h }, confidence: 90 });
const line = (...words) => ({ words });
const row = (y, left, right, xr = 600, tilt = 0) => {
  const ws = []; let x = 50;
  for (const t of left.split(' ')) { ws.push(W(t, x, y)); x += t.length * 14 + 10; }
  x = xr;
  for (const t of right.split(' ')) { ws.push(W(t, x, y + tilt)); x += t.length * 14 + 10; }
  return line(...ws);
};

test('Schräges Foto: Zeilen werden trotz Höhenversatz richtig gepaart', () => {
  /* rechte Spalte liegt pro Zeile ~25 px höher (≈ Zeilenabstand/2) – naiv würde man falsch paaren */
  const data = { lines: [0, 1, 2, 3].map(i => row(100 + i * 50 + i * 1, ['la casa', 'il libro', 'la città', 'grazie'][i], ['das Haus', 'das Buch', 'die Stadt', 'danke'][i], 600, -14 - i)) };
  const { pairs } = pairsFromOcr(data);
  assert.deepEqual(pairs.map(p => [p.term, p.def]), [['la casa', 'das Haus'], ['il libro', 'das Buch'], ['la città', 'die Stadt'], ['grazie', 'danke']]);
});

test('Umbrochene Übersetzung wird an die richtige Vokabel angehängt', () => {
  const data = { lines: [row(100, 'dare le dimissioni', 'kündigen (als'), line(W('Arbeitnehmer)', 600, 130)), row(190, 'lo stipendio', 'das Gehalt')] };
  assert.deepEqual(pairsFromOcr(data).pairs, [{ term: 'dare le dimissioni', def: 'kündigen (als Arbeitnehmer)' }, { term: 'lo stipendio', def: 'das Gehalt' }]);
});

test('Deutsch links, Italienisch rechts: Spalten werden automatisch getauscht', () => {
  const data = { lines: [row(100, 'das Haus', 'la casa'), row(150, 'die Bewerbung', 'la candidatura'), row(200, 'zuverlässig', 'affidabile')] };
  const r = pairsFromOcr(data, { termLang: 'it', defLang: 'de' });
  assert.equal(r.swapped, true);
  assert.deepEqual(r.pairs[0], { term: 'la casa', def: 'das Haus' });
});

test('Beispielsatz-Spalte in der Mitte wird übersprungen', () => {
  const r3 = (y, a, b, c) => { const l = row(y, a, c, 1100); l.words.push(...b.split(' ').map((t, i) => W(t, 520 + i * 90, y))); return l; };
  const data = { lines: [r3(100, 'lo stipendio', 'Lo stipendio è basso.', 'das Gehalt'), r3(160, 'la città', 'Vivo in una città grande.', 'die Stadt'), r3(220, 'perché', 'Perché non vieni?', 'warum')] };
  assert.deepEqual(pairsFromOcr(data).pairs.map(p => p.def), ['das Gehalt', 'die Stadt', 'warum']);
});

test('Überschriften und Seitenzahlen landen nicht in den Karten', () => {
  const data = { lines: [line(W('Unità', 50, 20), W('3', 140, 20)), row(100, 'la casa', 'das Haus'), row(150, 'il libro', 'das Buch'), row(200, 'grazie', 'danke'), line(W('47', 560, 400))] };
  const r = pairsFromOcr(data);
  assert.equal(r.pairs.length, 3);
  assert.ok(r.unpaired.some(t => t.includes('Unità')));
});

test('Vokabelheft „Wort – Übersetzung“ in einer Zeile', () => {
  const l = (y, a, b) => line(...`${a} – ${b}`.split(' ').map((t, i) => W(t, 60 + i * 120, y)));
  const data = { lines: [l(100, 'la casa', 'das Haus'), l(160, 'il libro', 'das Buch'), l(220, 'mangiare', 'essen')] };
  assert.deepEqual(pairsFromOcr(data).pairs.map(p => [p.term, p.def]), [['la casa', 'das Haus'], ['il libro', 'das Buch'], ['mangiare', 'essen']]);
});

test('Störzeichen und unsichere Mini-Wörter werden verworfen', () => {
  const data = { lines: [row(100, 'la casa', 'das Haus'), line(W('|', 300, 100), W('~', 320, 160)), row(160, 'il libro', 'das Buch'), { words: [{ text: 'xy', bbox: { x0: 300, y0: 200, x1: 320, y1: 226 }, confidence: 10 }] }] };
  assert.equal(pairsFromOcr(data).pairs.length, 2);
});

test('leere oder kaputte Eingaben führen nicht zum Absturz', () => {
  for (const d of [null, {}, { lines: [] }, { lines: [{ words: [] }] }, { lines: [line(W('ciao', 10, 10))] }]) assert.doesNotThrow(() => pairsFromOcr(d));
});

test('Lesefehler je Sprache: Akzente und Umlaute', () => {
  assert.equal(fixLetters('la cittä', 'it'), 'la città');
  assert.equal(fixLetters('perche', 'it'), 'perché');
  assert.equal(fixLetters('Perche', 'it'), 'Perché');
  assert.equal(fixLetters('la casa', 'it'), 'la casa');               // „la“ bleibt Artikel
  assert.equal(fixLetters("I'esperienza", 'it'), "l'esperienza");
  assert.equal(fixLetters('II mondo', 'it'), 'Il mondo');
  assert.equal(fixLetters('zuverlàssig', 'de'), 'zuverlässig');
  assert.equal(fixLetters('kiindigen', 'de'), 'kündigen');
  assert.equal(fixLetters('die StraBe', 'de'), 'die Straße');
  assert.equal(fixLetters('die Bewerbung', 'de'), 'die Bewerbung');
});

test('Spracherkennung unterscheidet Italienisch und Deutsch', () => {
  for (const it of ['il colloquio di lavoro', 'la candidatura', 'a tempo indeterminato', 'perché'])
    assert.ok(langScore(it, 'it') > langScore(it, 'de'), it);
  for (const de of ['das Vorstellungsgespräch', 'die Bewerbung', 'unbefristet', 'zuverlässig', 'kündigen (als Arbeitnehmer)'])
    assert.ok(langScore(de, 'de') > langScore(de, 'it'), de);
});

/* Bildaufbereitung */
test('Adaptive Schwelle: dunkle Schrift wird trotz Schatten erkannt, heller Hintergrund nicht', () => {
  const w = 200, h = 60, g = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[y * w + x] = 240 - x * 0.8;             // Verlauf (Schatten rechts)
  for (const x0 of [20, 150]) for (let y = 25; y < 35; y++) for (let x = x0; x < x0 + 20; x++) g[y * w + x] -= 120; // Schrift links hell, rechts im Schatten
  const bin = binarize(g, w, h);
  assert.equal(bin[30 * w + 25], 1); assert.equal(bin[30 * w + 155], 1);
  assert.equal(bin[5 * w + 25], 0); assert.equal(bin[5 * w + 180], 0);
});

test('Störpunkte werden entfernt', () => {
  const w = 10, h = 10, bin = new Uint8Array(w * h); bin[55] = 1;
  assert.equal(despeckle(bin, w, h)[55], 0);
});

test('Schräglage wird geschätzt', () => {
  const w = 600, h = 400;
  for (const deg of [-3, 0, 2.5]) {
    const bin = new Uint8Array(w * h), tan = Math.tan(deg * Math.PI / 180);
    for (let r = 0; r < 8; r++) for (let x = 40; x < 560; x++) { if (x % 9 < 2) continue; const y0 = Math.round(40 + r * 42 + x * tan); for (let y = y0; y < y0 + 8; y++) if (y >= 0 && y < h) bin[y * w + x] = 1; }
    assert.ok(Math.abs(estimateSkew(bin, w, h) - deg) <= 0.5, `erwartet ${deg}°`);
  }
});
