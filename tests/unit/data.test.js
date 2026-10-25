import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeData, parseImport, linesFromOcr, distractors, uniquePairs, newCard, LANGS } from '../../js/core.js';
import { LIBRARY, librarySet, libraryCount } from '../../js/library.js';

test('normalizeData repariert kaputte oder fremde Daten', () => {
  const d = normalizeData({
    sets: [
      { id: '"><img src=x onerror=alert(1)>', title: 5, termLang: 'xx', cards: [
        { term: 'ciao', def: 'hallo', box: 99 }, { term: '', def: 'leer' }, null, { term: 'a', def: 'b', box: 'x', due: 'nope' },
      ] },
      null, 'kaputt',
    ],
    settings: { answerWith: 'blub', speechRate: 3 },
    best: { a: 3, b: 'x' },
  });
  assert.equal(d.sets.length, 1);
  const s = d.sets[0];
  assert.match(s.id, /^[a-z0-9]+$/);           // keine Sonderzeichen in IDs (Schutz vor Code-Einschleusung)
  assert.equal(s.title, '5'); assert.equal(s.termLang, 'it');
  assert.equal(s.cards.length, 2);
  assert.equal(s.cards[0].box, 6);
  assert.equal(s.cards[1].box, 0); assert.equal(s.cards[1].due, 0);
  assert.equal(d.settings.answerWith, 'term'); assert.equal(d.settings.speechRate, 0.9);
  assert.deepEqual(d.best, { a: 3 });
});

test('normalizeData verkraftet leere Eingaben', () => {
  for (const x of [null, undefined, {}, { sets: 'x' }]) assert.deepEqual(normalizeData(x).sets, []);
});

test('normalizeData behält gültige Daten unverändert', () => {
  const c = { ...newCard('la casa', 'das Haus'), box: 2, seen: true, due: 123, ok: 3, bad: 1 };
  const d = normalizeData({ sets: [{ id: 'abc123', title: 'T', termLang: 'it', defLang: 'de', cards: [c] }], stats: { streak: 4, lastDay: '2026-10-25', days: { '2026-10-25': 3 } } });
  assert.deepEqual(d.sets[0].cards[0], c);
  assert.equal(d.stats.streak, 4);
});

test('parseImport erkennt alle Trennzeichen', () => {
  const rows = parseImport('ciao\thallo\nla casa - das Haus\nmangiare; essen\nbere = trinken\noggi: heute\ndomani, morgen\nnur ein Wort\n\n');
  assert.deepEqual(rows.map(r => [r.term, r.def]), [['ciao', 'hallo'], ['la casa', 'das Haus'], ['mangiare', 'essen'], ['bere', 'trinken'], ['oggi', 'heute'], ['domani', 'morgen']]);
});

test('parseImport: Bindestrich im Wort trennt nicht', () => {
  assert.deepEqual(parseImport('il part-time - die Teilzeit').map(r => r.def), ['die Teilzeit']);
});

test('linesFromOcr trennt zweispaltige Listen an der Lücke', () => {
  const w = (text, x0, x1) => ({ text, bbox: { x0, x1 } });
  const data = { lines: [
    { bbox: { y0: 0, y1: 30 }, words: [w('la', 10, 40), w('casa', 50, 120), w('das', 400, 450), w('Haus', 460, 530)] },
    { bbox: { y0: 40, y1: 70 }, words: [w('Lezione', 10, 120), w('4', 130, 150)] },
    { bbox: { y0: 80, y1: 110 }, words: [w('|', 10, 12)] },
  ] };
  assert.equal(linesFromOcr(data), 'la casa - das Haus\nLezione 4');
});

test('distractors: eindeutig, ohne richtige Antwort', () => {
  const s = { termLang: 'it', defLang: 'de' };
  const all = ['a', 'b', 'c', 'd', 'b', 'A'].map((t, i) => ({ c: { ...newCard(t, 'x' + i) }, s }));
  for (let k = 0; k < 30; k++) {
    const out = distractors(all, all[0], 'term', 3);
    assert.ok(!out.map(x => x.toLowerCase()).includes('a'));
    assert.equal(new Set(out).size, out.length);
  }
});

test('uniquePairs vermeidet doppelte Texte (Match)', () => {
  const cards = [newCard('a', 'x'), newCard('b', 'x'), newCard('c', 'y'), newCard('y', 'z'), newCard('d', 'd')];
  for (let k = 0; k < 30; k++) {
    const texts = uniquePairs(cards, 6).flatMap(c => [c.term, c.def]);
    assert.equal(new Set(texts).size, texts.length);
  }
});

test('Bibliothek: jedes Paket gültig, keine doppelten Begriffe', () => {
  const keys = new Set();
  for (const p of LIBRARY) {
    assert.ok(!keys.has(p.key)); keys.add(p.key);
    const s = librarySet(p);
    assert.equal(s.cards.length, libraryCount(p));
    assert.ok(s.cards.length >= 20, p.key);
    const terms = s.cards.map(c => c.term.toLowerCase());
    assert.equal(new Set(terms).size, terms.length, `doppelter Begriff in ${p.key}`);
    for (const c of s.cards) {
      assert.ok(!/[|]/.test(c.term + c.def));
      assert.ok(!c.term.includes('/'), `„/“ im italienischen Begriff würde Teilantworten erlauben: ${c.term}`);
    }
    assert.ok(LANGS[s.termLang] && LANGS[s.defLang]);
  }
});
