import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, variants, normAns, isCorrect } from '../../js/core.js';

const ok = (input, answer, lang, opts) => assert.ok(isCorrect(checkAnswer(input, answer, lang, opts)), `„${input}“ sollte für „${answer}“ richtig sein`);
const res = (input, answer, lang, expected, opts) => assert.equal(checkAnswer(input, answer, lang, opts), expected, `„${input}“ → „${answer}“`);

test('exakte Antworten, Groß-/Kleinschreibung und Leerzeichen', () => {
  ok('la casa', 'la casa', 'it');
  ok('  La  Casa ', 'la casa', 'it');
  ok('Ciao!', 'ciao', 'it');
});

test('Alternativen mit „/“, „;“ und „oder“', () => {
  ok('hallo', 'hallo / tschüss', 'de');
  ok('tschüss', 'hallo / tschüss', 'de');
  ok('hallo/tschüss', 'hallo / tschüss', 'de');
  ok('hallo, tschüss', 'hallo / tschüss', 'de');
  ok('warum', 'warum oder weil', 'de');
});

test('Komma-Synonyme nur bei deutschen Antworten – und keine Mini-Teilstücke', () => {
  ok('Fähigkeiten', 'die Kompetenzen, Fähigkeiten', 'de');
  ok('der Gewinn', 'der Gewinn, Verdienst', 'de');
  res('dass', 'ich denke, dass (+ Konjunktiv)', 'de', 'wrong');
  ok('ich denke, dass', 'ich denke, dass (+ Konjunktiv)', 'de');
  res('per favore', 'Può ripetere, per favore?', 'it', 'wrong');
  ok('può ripetere, per favore', 'Può ripetere, per favore?', 'it');
});

test('Hinweise in Klammern werden ignoriert', () => {
  ok('die Ausbildung', 'die Ausbildung (Lehre)', 'de');
  ok('fatto', 'fatto', 'it');
});

test('deutscher Artikel ist optional', () => {
  ok('Haus', 'das Haus', 'de');
  ok('das Haus', 'das Haus', 'de');
});

test('italienischer Artikel fehlt → Hinweis „article“ (zählt nicht)', () => {
  res('casa', 'la casa', 'it', 'article');
  res('amico', "l'amico", 'it', 'article');
  assert.equal(isCorrect('article'), false);
});

test('Akzente: tolerant (Standard) und streng', () => {
  res('la citta', 'la città', 'it', 'accent-ok');
  res('perche', 'perché', 'it', 'accent-ok');
  res('la citta', 'la città', 'it', 'accent', { strictAccents: true });
  ok('la città', 'la città', 'it', { strictAccents: true });
});

test('Apostroph-Varianten vom iPhone', () => {
  ok('l’amico', "l'amico", 'it');
  ok('l‘amico', "l'amico", 'it');
});

test('Tippfehler werden erkannt, aber nicht gewertet', () => {
  res('mangare', 'mangiare', 'it', 'typo');
  res('stipendo', 'lo stipendio', 'it', 'wrong'); // fehlender Artikel + Tippfehler ist zu viel
  res('cas', 'la casa', 'it', 'wrong');
  res('xyz', 'la casa', 'it', 'wrong');
  res('', 'la casa', 'it', 'wrong');
});

test('normAns vereinheitlicht Satzzeichen', () => {
  assert.equal(normAns('  Ciao, Come Stai?  '), 'ciao,come stai');
  assert.equal(normAns('(f) la casa'), 'la casa');
});

test('variants liefert keine leeren Einträge', () => {
  for (const v of variants('a / / b ;', 'de')) assert.ok(v.length > 0);
});
