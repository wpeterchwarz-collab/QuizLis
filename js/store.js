/* Datenspeicher: hält den App-Zustand und speichert ihn im localStorage des Geräts. */
import { normalizeData, applyStudy } from './core.js';
import { LIBRARY, librarySet } from './library.js';

export const STORE_KEY = 'quizlis.v1';
const listeners = { error: () => {} };
export const onStoreError = fn => { listeners.error = fn; };

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.sets)) return normalizeData(d); }
  } catch (e) { /* beschädigte Daten → neu anlegen */ }
  return normalizeData({ sets: LIBRARY.map(librarySet) });
}

export let DB = load();
export function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); return true; }
  catch (e) { listeners.error('Speichern fehlgeschlagen – Speicher voll?'); return false; }
}
export function replaceDB(data) { DB = normalizeData(data); save(); }
export const getSet = id => DB.sets.find(s => s.id === id);
export function markStudied(n = 1) { applyStudy(DB.stats, n); save(); }
export function removeSet(id) {
  DB.sets = DB.sets.filter(s => s.id !== id);
  Object.keys(DB.best).forEach(k => { if (k === id || k.endsWith(`_${id}`)) delete DB.best[k]; });
  save();
}
save();
