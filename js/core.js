/* Reine Lernlogik – kein DOM, vollständig per Unit-Test prüfbar. */
import { DAY, uid, shuffle, startOfDay, dayKey } from './util.js';

export const APP_VERSION = '1.3.0';
export const LANGS = { it: 'Italienisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch' };
export const SPEECH = { it: 'it-IT', de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES' };
export const ACCENTS = { it: ['à', 'è', 'é', 'ì', 'ò', 'ù'], fr: ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û'], es: ['á', 'é', 'í', 'ñ', 'ó', 'ú', 'ü', '¿', '¡'], de: ['ä', 'ö', 'ü', 'ß'], en: [] };
export const INTERVALS = [0, 1, 2, 4, 7, 14, 30]; // Tage bis zur nächsten Wiederholung je Leitner-Stufe
export const STATE_TEXT = { new: 'Neu', learning: 'Am Lernen', known: 'Gelernt' };
export const GRADE_TEXT = { 1: 'Sehr gut', 2: 'Gut', 3: 'Befriedigend', 4: 'Ausreichend', 5: 'Mangelhaft', 6: 'Ungenügend' };

/* ---------- Datenmodell ---------- */
export const newCard = (term = '', def = '') => ({ id: uid(), term, def, box: 0, due: 0, seen: false, ok: 0, bad: 0 });
export const defaultSettings = () => ({ answerWith: 'term', strictAccents: false, autoSpeak: false, cardFront: 'term', speechRate: 0.9, hideInstall: false });
const safeId = id => (typeof id === 'string' && /^[a-z0-9_-]{4,40}$/i.test(id)) ? id : uid();
const safeLang = (l, fb) => (l in LANGS ? l : fb);
const num = (v, fb = 0) => (Number.isFinite(+v) ? +v : fb);

/* Repariert/vereinheitlicht gespeicherte oder importierte Daten (auch aus fremden Sicherungen). */
export function normalizeData(input) {
  const d = input && typeof input === 'object' ? input : {};
  const sets = Array.isArray(d.sets) ? d.sets.filter(s => s && typeof s === 'object') : [];
  const s0 = defaultSettings(), st = d.settings && typeof d.settings === 'object' ? d.settings : {};
  return {
    sets: sets.map(s => ({
      id: safeId(s.id), libKey: typeof s.libKey === 'string' ? s.libKey : null,
      title: String(s.title || 'Ohne Titel'), desc: String(s.desc || ''),
      termLang: safeLang(s.termLang, 'it'), defLang: safeLang(s.defLang, 'de'),
      created: num(s.created, Date.now()), updated: num(s.updated, Date.now()),
      lastTest: s.lastTest && typeof s.lastTest === 'object' ? s.lastTest : null,
      cards: (Array.isArray(s.cards) ? s.cards : [])
        .filter(c => c && String(c.term ?? '').trim() && String(c.def ?? '').trim())
        .map(c => ({
          id: safeId(c.id), term: String(c.term).trim(), def: String(c.def).trim(),
          box: Math.min(Math.max(0, Math.trunc(num(c.box))), INTERVALS.length - 1),
          due: num(c.due), seen: !!c.seen, ok: num(c.ok), bad: num(c.bad),
        })),
    })),
    settings: {
      answerWith: ['term', 'def', 'mixed'].includes(st.answerWith) ? st.answerWith : s0.answerWith,
      strictAccents: !!st.strictAccents, autoSpeak: !!st.autoSpeak,
      cardFront: st.cardFront === 'def' ? 'def' : 'term',
      speechRate: [0.7, 0.9, 1.05].includes(+st.speechRate) ? +st.speechRate : s0.speechRate,
      hideInstall: !!st.hideInstall,
    },
    stats: { streak: num(d.stats?.streak), lastDay: typeof d.stats?.lastDay === 'string' ? d.stats.lastDay : null, days: (d.stats?.days && typeof d.stats.days === 'object') ? d.stats.days : {} },
    best: (d.best && typeof d.best === 'object') ? Object.fromEntries(Object.entries(d.best).filter(([, v]) => Number.isFinite(+v))) : {},
  };
}

/* ---------- Lernserie ---------- */
export function applyStudy(stats, n = 1, now = Date.now()) {
  const today = dayKey(now), yest = dayKey(now - DAY);
  if (stats.lastDay !== today) { stats.streak = stats.lastDay === yest ? stats.streak + 1 : 1; stats.lastDay = today; }
  stats.days[today] = (stats.days[today] || 0) + n;
  const keys = Object.keys(stats.days).sort();
  while (keys.length > 120) delete stats.days[keys.shift()];
  return stats;
}
export const currentStreak = (stats, now = Date.now()) => (stats.lastDay === dayKey(now) || stats.lastDay === dayKey(now - DAY)) ? stats.streak : 0;

/* ---------- Spaced Repetition (Leitner) ---------- */
export function srsUpdate(c, correct, now = Date.now()) {
  c.seen = true;
  if (correct) { c.box = Math.min(c.box + 1, INTERVALS.length - 1); c.ok++; } else { c.box = 1; c.bad++; }
  c.due = startOfDay(now) + INTERVALS[c.box] * DAY;
  return c;
}
export const cardState = c => !c.seen ? 'new' : (c.box >= 3 ? 'known' : 'learning');
export const isDue = (c, now = Date.now()) => c.seen && c.due <= now;
export function pickForLearning(all, n = 10, now = Date.now()) {
  const due = all.filter(x => isDue(x.c, now)).sort((a, b) => a.c.box - b.c.box || a.c.due - b.c.due);
  const fresh = all.filter(x => !x.c.seen);
  return [...due, ...fresh].slice(0, n);
}

/* ---------- Antwortprüfung ---------- */
export function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
export const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const normAns = s => String(s ?? '').toLowerCase()
  .replace(/\([^)]*\)/g, ' ')            // Hinweise in Klammern ignorieren
  .replace(/[’‘`´]/g, "'")
  .replace(/[.!?¿¡"„“”«»:]/g, ' ')
  .replace(/\s*([/,;])\s*/g, '$1')
  .replace(/\s+/g, ' ').trim();
const ARTICLES = {
  de: /^(der|die|das|ein|eine|einen|einem|einer|den|dem)\s+/,
  it: /^(il|lo|la|i|gli|le|un|uno|una)\s+|^(l'|un')\s*/,
  fr: /^(le|la|les|un|une|des)\s+|^l'\s*/,
  es: /^(el|la|los|las|un|una|unos|unas)\s+/,
  en: /^(the|a|an)\s+/,
};
export const stripArticle = (v, lang) => ARTICLES[lang] ? v.replace(ARTICLES[lang], '') : v;

/* Erlaubte Antwortvarianten: „/“, „;“ und „oder“ trennen immer Alternativen.
   Kommas nur bei deutschen Antworten (Synonyme wie „Gewinn, Verdienst“) – und nur, wenn der Teil
   nicht viel kürzer ist als der längste (sonst würde „dass“ für „ich denke, dass“ zählen). */
export function variants(answer, lang) {
  const base = normAns(answer);
  const parts = new Set([base]);
  for (const p of base.split(/[/;]|\s+oder\s+/).map(x => x.trim()).filter(Boolean)) {
    parts.add(p);
    if (lang === 'de' && p.includes(',')) {
      const sub = p.split(',').map(x => x.trim()).filter(Boolean);
      const longest = Math.max(...sub.map(x => stripArticle(x, 'de').length));
      sub.filter(x => stripArticle(x, 'de').length >= longest * 0.5).forEach(x => parts.add(x));
    }
  }
  let vs = [...parts];
  if (lang === 'de') vs = vs.concat(vs.map(v => stripArticle(v, 'de'))); // im Deutschen ist der Artikel optional
  return [...new Set(vs)];
}

/* Ergebnis: ok | accent-ok (nur Akzent fehlt, zählt) | accent (strenger Modus) | article | typo | wrong */
export const isCorrect = r => r === 'ok' || r === 'accent-ok';
export function checkAnswer(input, answer, lang, { strictAccents = false } = {}) {
  let i = normAns(input); if (!i) return 'wrong';
  if (lang === 'de') i = stripArticle(i, 'de');
  const vs = variants(answer, lang);
  const inParts = i.split(/[/,;]/).map(x => x.trim()).filter(Boolean);
  const matches = f => f(i) || (inParts.length > 1 && inParts.every(f));
  if (matches(x => vs.includes(x))) return 'ok';
  const vsL = vs.map(stripAccents);
  if (matches(x => vsL.includes(stripAccents(x)))) return strictAccents ? 'accent' : 'accent-ok';
  if (lang && lang !== 'de' && ARTICLES[lang]) {
    const iA = stripAccents(stripArticle(i, lang));
    if (iA && vs.some(v => stripAccents(stripArticle(v, lang)) === iA)) return 'article';
  }
  const iL = stripAccents(i);
  if (vs.some(v => v.length >= 4 && lev(stripAccents(v), iL) <= (v.length >= 9 ? 2 : 1))) return 'typo';
  return 'wrong';
}

/* ---------- Fragen ---------- */
/* dir = 'term': man antwortet mit dem Begriff (z. B. Italienisch) */
export const qaFor = ({ c, s, dir }) => dir === 'term'
  ? { q: c.def, a: c.term, qLang: s.defLang, aLang: s.termLang }
  : { q: c.term, a: c.def, qLang: s.termLang, aLang: s.defLang };
export const pickDir = answerWith => answerWith === 'mixed' ? (Math.random() < 0.5 ? 'term' : 'def') : answerWith;
export function distractors(all, item, dir, n = 3) {
  const side = x => (dir === 'term' ? x.c.term : x.c.def);
  const seen = new Set([normAns(side(item))]); const out = [];
  for (const x of shuffle(all)) {
    if (x.c.id === item.c.id) continue;
    const k = normAns(side(x));
    if (!seen.has(k)) { seen.add(k); out.push(side(x)); }
    if (out.length >= n) break;
  }
  return out;
}
/* Kartenpaare ohne doppelte Texte (für Match) */
export function uniquePairs(cards, n) {
  const picked = [], seen = new Set();
  for (const c of shuffle(cards)) {
    const t = normAns(c.term), d = normAns(c.def);
    if (t === d || seen.has(t) || seen.has(d)) continue;
    seen.add(t); seen.add(d); picked.push(c);
    if (picked.length >= n) break;
  }
  return picked;
}
export const gradeFor = p => p >= 92 ? 1 : p >= 81 ? 2 : p >= 67 ? 3 : p >= 50 ? 4 : p >= 30 ? 5 : 6;

/* ---------- Import ---------- */
export function parseImport(text) {
  const out = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const l = raw.trim(); if (!l) continue;
    let parts;
    if (l.includes('\t')) parts = l.split('\t');
    else if (/\s[-–—]\s/.test(l)) parts = l.split(/\s[-–—]\s/);
    else if (l.includes(';')) parts = l.split(';');
    else if (l.includes('=')) parts = l.split('=');
    else if (l.includes(':')) parts = l.split(':');
    else if (l.includes(',')) parts = l.split(',');
    else continue;
    const term = parts[0].trim(), def = parts.slice(1).map(p => p.trim()).filter(Boolean).join(', ');
    if (term && def) out.push({ id: null, term, def });
  }
  return out;
}
/* Texterkennung: zweispaltige Listen an der größten Wortlücke einer Zeile trennen */
export function linesFromOcr(data) {
  const out = [];
  for (const line of (data?.lines || [])) {
    const words = (line.words || []).filter(w => w.text && w.text.trim()).sort((a, b) => a.bbox.x0 - b.bbox.x0);
    if (!words.length) continue;
    const h = (line.bbox.y1 - line.bbox.y0) || 20;
    let best = -1, gap = 0;
    for (let i = 1; i < words.length; i++) { const g = words[i].bbox.x0 - words[i - 1].bbox.x1; if (g > gap) { gap = g; best = i; } }
    const txt = ws => ws.map(w => w.text).join(' ').trim();
    const plain = txt(words);
    if (/[\t;=]|\s[-–—]\s/.test(plain)) out.push(plain);
    else if (best > 0 && gap > h * 1.1) out.push(`${txt(words.slice(0, best))} - ${txt(words.slice(best))}`);
    else out.push(plain);
  }
  return out.filter(l => l.replace(/[^\p{L}]/gu, '').length > 1).join('\n');
}
