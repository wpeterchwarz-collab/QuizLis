import { test } from 'node:test';
import assert from 'node:assert/strict';
import { srsUpdate, isDue, cardState, pickForLearning, applyStudy, currentStreak, newCard, INTERVALS, gradeFor } from '../../js/core.js';
import { DAY, startOfDay } from '../../js/util.js';

const NOW = new Date(2026, 9, 25, 15, 0).getTime();

test('neue Karte ist „Neu“ und nicht fällig', () => {
  const c = newCard('la casa', 'das Haus');
  assert.equal(cardState(c), 'new');
  assert.equal(isDue(c, NOW), false);
});

test('richtige Antworten steigern die Stufe und verlängern den Abstand', () => {
  const c = newCard('a', 'b');
  srsUpdate(c, true, NOW);
  assert.equal(c.box, 1); assert.equal(c.due, startOfDay(NOW) + DAY);
  srsUpdate(c, true, NOW); srsUpdate(c, true, NOW);
  assert.equal(c.box, 3); assert.equal(cardState(c), 'known');
  assert.equal(c.due, startOfDay(NOW) + INTERVALS[3] * DAY);
});

test('Stufe ist nach oben begrenzt', () => {
  const c = newCard('a', 'b');
  for (let i = 0; i < 20; i++) srsUpdate(c, true, NOW);
  assert.equal(c.box, INTERVALS.length - 1);
});

test('Fehler setzt auf Stufe 1 zurück (morgen wieder fällig)', () => {
  const c = newCard('a', 'b');
  for (let i = 0; i < 4; i++) srsUpdate(c, true, NOW);
  srsUpdate(c, false, NOW);
  assert.equal(c.box, 1); assert.equal(c.bad, 1);
  assert.equal(isDue(c, NOW), false);
  assert.equal(isDue(c, NOW + DAY), true);
});

test('pickForLearning: erst fällige (schwächste zuerst), dann neue, maximal n', () => {
  const mk = (box, due, seen) => ({ c: { ...newCard('t', 'd'), box, due, seen } });
  const weakDue = mk(1, NOW - DAY, true), strongDue = mk(4, NOW - DAY, true), notDue = mk(2, NOW + DAY, true);
  const fresh = Array.from({ length: 12 }, () => mk(0, 0, false));
  const picked = pickForLearning([notDue, strongDue, ...fresh, weakDue], 10, NOW);
  assert.equal(picked.length, 10);
  assert.equal(picked[0], weakDue); assert.equal(picked[1], strongDue);
  assert.ok(!picked.includes(notDue));
});

test('Lernserie: zählt aufeinanderfolgende Tage, reißt nach Pause ab', () => {
  const st = { streak: 0, lastDay: null, days: {} };
  applyStudy(st, 1, NOW); assert.equal(st.streak, 1);
  applyStudy(st, 3, NOW); assert.equal(st.streak, 1);
  applyStudy(st, 1, NOW + DAY); assert.equal(st.streak, 2);
  assert.equal(currentStreak(st, NOW + DAY), 2);
  assert.equal(currentStreak(st, NOW + 2 * DAY), 2);   // gestern gelernt → Serie lebt noch
  assert.equal(currentStreak(st, NOW + 3 * DAY), 0);   // Pause → Serie weg
  applyStudy(st, 1, NOW + 5 * DAY); assert.equal(st.streak, 1);
});

test('Lernserie speichert höchstens 120 Tage', () => {
  const st = { streak: 0, lastDay: null, days: {} };
  for (let i = 0; i < 200; i++) applyStudy(st, 1, NOW + i * DAY);
  assert.equal(Object.keys(st.days).length, 120);
});

test('Notenschlüssel', () => {
  assert.deepEqual([100, 92, 91, 81, 80, 67, 66, 50, 49, 30, 29, 0].map(gradeFor), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
});
