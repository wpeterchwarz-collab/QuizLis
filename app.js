'use strict';
/* QuizLis – Vokabel-Lern-App (PWA). Alle Daten bleiben lokal auf dem Gerät. */
const APP_VERSION = '1.2.0';

/* ============================== Helfer ============================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const DAY = 86400000;
const startOfDay = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const LANGS = { it: 'Italienisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch' };
const SPEECH = { it: 'it-IT', de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES' };
const ACCENTS = { it: ['à', 'è', 'é', 'ì', 'ò', 'ù'], fr: ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û'], es: ['á', 'é', 'í', 'ñ', 'ó', 'ú', 'ü', '¿', '¡'], de: ['ä', 'ö', 'ü', 'ß'], en: [] };
const sizeClass = t => { const n = String(t || '').length; return n > 120 ? 'xs' : n > 60 ? 'sm' : n > 24 ? 'md' : ''; };
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  close: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
  left: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
  right: svg('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  speaker: svg('<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
  shuffle: svg('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  check: svg('<path d="M20 6L9 17l-5-5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  edit: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  cards: svg('<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>'),
  learn: svg('<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  test: svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  match: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  rocket: svg('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>'),
  gravity: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3"/>'),
  swap: svg('<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>'),
  upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  share: svg('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>'),
  redo: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
};
const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#4255ff"/><rect x="13" y="13" width="29" height="37" rx="5" fill="#fff" opacity=".45" transform="rotate(-11 27 31)"/><rect x="20" y="14" width="30" height="38" rx="5" fill="#fff"/><rect x="25" y="22" width="19" height="4" rx="2" fill="#4255ff"/><rect x="25" y="30" width="13" height="4" rx="2" fill="#c5cbff"/><rect x="25" y="41" width="6.7" height="6" rx="1.2" fill="#12a26c"/><rect x="31.7" y="41" width="6.6" height="6" fill="#e3e6ef"/><rect x="38.3" y="41" width="6.7" height="6" rx="1.2" fill="#e8524a"/></svg>`;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============================== Daten ============================== */
const STORE_KEY = 'quizlis.v1';
const INTERVALS = [0, 1, 2, 4, 7, 14, 30]; // Tage bis zur nächsten Wiederholung je Stufe

function newCard(term = '', def = '') { return { id: uid(), term, def, box: 0, due: 0, seen: false, ok: 0, bad: 0 }; }
function defaultSettings() { return { answerWith: 'term', strictAccents: false, autoSpeak: false, cardFront: 'term', speechRate: 0.9, hideInstall: false }; }
function seedData() {
  if (typeof LIBRARY !== 'undefined') return normalizeData({ sets: LIBRARY.map(librarySet) });
  return normalizeData({ sets: [] });
}
function normalizeData(d) {
  d.sets = (d.sets || []).map(s => ({
    id: s.id || uid(), libKey: s.libKey || null, title: s.title || 'Ohne Titel', desc: s.desc || '', termLang: s.termLang || 'it', defLang: s.defLang || 'de',
    created: s.created || Date.now(), updated: s.updated || Date.now(), lastTest: s.lastTest || null,
    cards: (s.cards || []).filter(c => c && (c.term || c.def)).map(c => ({ ...newCard(), ...c, id: c.id || uid() })),
  }));
  d.settings = { ...defaultSettings(), ...(d.settings || {}) };
  d.stats = { streak: 0, lastDay: null, days: {}, ...(d.stats || {}) };
  d.best = d.best || {};
  return d;
}
function loadData() {
  try { const d = JSON.parse(localStorage.getItem(STORE_KEY)); if (d && Array.isArray(d.sets)) return normalizeData(d); } catch (e) { /* leer */ }
  return seedData();
}
let DB = loadData();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) { toast('Speichern fehlgeschlagen – Speicher voll?'); } }
save();
const getSet = id => DB.sets.find(s => s.id === id);

function markStudied(n = 1) {
  const st = DB.stats, today = dayKey(), yest = dayKey(Date.now() - DAY);
  if (st.lastDay !== today) { st.streak = st.lastDay === yest ? st.streak + 1 : 1; st.lastDay = today; }
  st.days[today] = (st.days[today] || 0) + n;
  const keys = Object.keys(st.days).sort(); while (keys.length > 120) delete st.days[keys.shift()];
  save();
}
const currentStreak = () => { const st = DB.stats; return (st.lastDay === dayKey() || st.lastDay === dayKey(Date.now() - DAY)) ? st.streak : 0; };

/* Spaced Repetition (Leitner-Stufen) */
function srsUpdate(c, correct) {
  c.seen = true;
  if (correct) { c.box = Math.min(c.box + 1, INTERVALS.length - 1); c.ok++; } else { c.box = 1; c.bad++; }
  c.due = startOfDay() + INTERVALS[c.box] * DAY;
}
const cardState = c => !c.seen ? 'new' : (c.box >= 3 ? 'known' : 'learning');
const isDue = c => c.seen && c.due <= Date.now();
const STATE_TEXT = { new: 'Neu', learning: 'Am Lernen', known: 'Gelernt' };

/* Antwortprüfung */
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normAns = s => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[’‘`´]/g, "'").replace(/[.!?¿¡"„“”:]/g, ' ').replace(/\s*([/,;])\s*/g, '$1').replace(/\s+/g, ' ').trim();
const ARTICLES = {
  de: /^(der|die|das|ein|eine|einen|einem|einer|den|dem)\s+/,
  it: /^(il|lo|la|i|gli|le|un|uno|una)\s+|^(l'|un')\s*/,
};
const stripArticle = (v, lang) => ARTICLES[lang] ? v.replace(ARTICLES[lang], '') : v;
function variants(a, lang) {
  const base = normAns(a);
  const parts = base.split(/[/,;]|\s+oder\s+/).map(x => x.trim()).filter(Boolean);
  let vs = [base, ...parts];
  if (lang === 'de') vs = vs.concat(vs.map(v => stripArticle(v, 'de'))); // im Deutschen Artikel optional
  return [...new Set(vs)];
}
/* Ergebnis: ok | accent-ok (nur Akzent falsch, wird akzeptiert) | accent | article | typo | wrong */
function checkAnswer(input, answer, lang) {
  let i = normAns(input); if (!i) return 'wrong';
  if (lang === 'de') i = stripArticle(i, 'de');
  const vs = variants(answer, lang);
  const inParts = i.split(/[/,;]/).map(x => x.trim()).filter(Boolean);
  const all = f => f(i) || (inParts.length > 1 && inParts.every(f));
  if (all(x => vs.includes(x))) return 'ok';
  const vsL = vs.map(stripAccents);
  if (all(x => vsL.includes(stripAccents(x)))) return DB.settings.strictAccents ? 'accent' : 'accent-ok';
  if (lang && lang !== 'de' && ARTICLES[lang]) {
    const vsA = vs.map(v => stripAccents(stripArticle(v, lang))), iA = stripAccents(stripArticle(i, lang));
    if (vsA.includes(iA)) return 'article';
  }
  const iL = stripAccents(i);
  if (vs.some(v => v.length >= 4 && lev(stripAccents(v), iL) <= (v.length >= 9 ? 2 : 1))) return 'typo';
  return 'wrong';
}

/* Frage/Antwort-Richtung: dir = 'term' heißt: man antwortet mit dem Begriff (z. B. Italienisch) */
function qaFor(item) {
  const { c, s, dir } = item;
  return dir === 'term'
    ? { q: c.def, a: c.term, qLang: s.defLang, aLang: s.termLang }
    : { q: c.term, a: c.def, qLang: s.termLang, aLang: s.defLang };
}
const pickDir = () => DB.settings.answerWith === 'mixed' ? (Math.random() < .5 ? 'term' : 'def') : DB.settings.answerWith;
function distractors(all, item, dir, n = 3) {
  const correct = normAns(dir === 'term' ? item.c.term : item.c.def);
  const seen = new Set([correct]); const out = [];
  for (const x of shuffle(all)) {
    if (x.c.id === item.c.id) continue;
    const v = dir === 'term' ? x.c.term : x.c.def; const k = normAns(v);
    if (!seen.has(k)) { seen.add(k); out.push(v); }
    if (out.length >= n) break;
  }
  return out;
}

/* ============================== Sprachausgabe ============================== */
let VOICES = [];
const hasSpeech = 'speechSynthesis' in window;
function loadVoices() { try { VOICES = speechSynthesis.getVoices(); } catch (e) { /* */ } }
if (hasSpeech) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, lang) {
  if (!hasSpeech || !text) return;
  try {
    speechSynthesis.cancel();
    const code = SPEECH[lang] || lang || 'it-IT';
    const u = new SpeechSynthesisUtterance(String(text).replace(/\([^)]*\)/g, ' ').replace(/\s*\/\s*/g, ', '));
    u.lang = code; u.rate = DB.settings.speechRate || 0.9;
    const lc = code.toLowerCase();
    const v = VOICES.find(v => v.lang.toLowerCase().replace('_', '-') === lc) || VOICES.find(v => v.lang.toLowerCase().startsWith(lc.slice(0, 2)));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) { /* */ }
}
const speakBtn = (t, l) => hasSpeech ? `<button class="speak" type="button" data-act="speak" data-t="${esc(t)}" data-l="${esc(l)}" aria-label="Vorlesen">${ICON.speaker}</button>` : '';
const autoSpeak = (t, l) => { if (DB.settings.autoSpeak && l !== 'de') speak(t, l); };

/* ============================== Router & Rendering ============================== */
let actions = {}, cleanups = [], VIEW_TOKEN = 0;
/* setTimeout, das nach einem Seitenwechsel nicht mehr feuert */
function later(fn, ms) { const tok = VIEW_TOKEN; return setTimeout(() => { if (tok === VIEW_TOKEN) fn(); }, ms); }
const onCleanup = fn => cleanups.push(fn);
function setView(html, acts = {}) { actions = acts; $('#app').innerHTML = html; }
function go(h) { if (location.hash.replace(/^#/, '') === h) render(); else location.hash = h; }
function topbar(title, backHref = '#', right = '', closeIcon = false, backAct = '') {
  const icon = closeIcon ? ICON.close : ICON.back;
  const back = backAct ? `<button class="icon-btn" data-act="${backAct}" aria-label="Zurück">${icon}</button>` : `<a class="icon-btn" href="${backHref}" aria-label="Zurück">${icon}</a>`;
  return `<header class="topbar">${back}<div class="topbar-title">${esc(title)}</div><div class="topbar-right">${right}</div></header>`;
}
const bar = pct => `<div class="bar"><div style="width:${clamp(pct, 0, 100)}%"></div></div>`;

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.dataset.act === 'speak') { e.preventDefault(); e.stopPropagation(); speak(t.dataset.t, t.dataset.l); return; }
  const f = actions[t.dataset.act];
  if (f) { e.preventDefault(); f(t, e); }
});
/* Akzent-Tasten sollen den Fokus im Eingabefeld nicht stehlen */
document.addEventListener('pointerdown', e => { if (e.target.closest('.accent-bar button')) e.preventDefault(); });
document.addEventListener('click', e => {
  const b = e.target.closest('.accent-bar button'); if (!b) return;
  const inp = $(b.closest('.accent-bar').dataset.for); if (!inp) return;
  const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? inp.value.length;
  inp.setRangeText(b.textContent, s, en, 'end'); inp.focus(); inp.dispatchEvent(new Event('input', { bubbles: true }));
});
const accentBar = (lang, forSel) => (ACCENTS[lang] || []).length ? `<div class="accent-bar" data-for="${forSel}">${ACCENTS[lang].map(a => `<button type="button" tabindex="-1">${a}</button>`).join('')}</div>` : '';

const ROUTES = { '': viewHome, set: viewSet, edit: viewEdit, cards: viewCards, learn: viewLearn, test: viewTestSetup, testrun: viewTestRun, match: viewMatch, blast: viewBlast, gravity: viewGravity, settings: viewSettings, library: viewLibrary };
function render() {
  VIEW_TOKEN++;
  cleanups.forEach(f => { try { f(); } catch (e) { /* */ } }); cleanups = []; actions = {};
  if (hasSpeech) try { speechSynthesis.cancel(); } catch (e) { /* */ }
  const [name, ...args] = location.hash.replace(/^#\/?/, '').split('/');
  (ROUTES[name] || viewHome)(...args.map(decodeURIComponent));
  window.scrollTo(0, 0);
}

/* ============================== Startseite ============================== */
function viewHome() {
  const streak = currentStreak();
  const dueTotal = DB.sets.reduce((n, s) => n + s.cards.filter(isDue).length, 0);
  const today = DB.stats.days[dayKey()] || 0;
  const dueSets = DB.sets.filter(s => s.cards.some(isDue)).map(s => s.id);
  const sets = [...DB.sets].sort((a, b) => b.updated - a.updated);
  const setsHtml = sets.length ? sets.map(s => {
    const due = s.cards.filter(isDue).length;
    const known = s.cards.filter(c => cardState(c) === 'known').length;
    const pct = s.cards.length ? Math.round(known / s.cards.length * 100) : 0;
    return `<a class="set-tile" href="#set/${s.id}"><div class="set-tile-title">${esc(s.title)}</div>
      <div class="set-tile-meta"><span class="pill">${s.cards.length} Begriffe</span>${due ? `<span class="pill pill-warn">${due} fällig</span>` : ''}${pct ? `<span class="pill">${pct}% gelernt</span>` : ''}</div>
      <div class="progress"><div style="width:${pct}%"></div></div></a>`;
  }).join('') : `<div class="empty card">Noch keine Sets.<br>Leg dein erstes Set an!</div>`;

  const install = !isStandalone() && !DB.settings.hideInstall ? `<div class="card install">${LOGO}<div><b>Als App installieren</b>${isIOS
    ? 'In Safari unten auf <b style="display:inline">Teilen</b> tippen und dann <b style="display:inline">„Zum Home-Bildschirm“</b> wählen.'
    : 'Im Browser-Menü „Zum Startbildschirm hinzufügen“ wählen.'}</div><button class="icon-btn" data-act="hideInstall" aria-label="Ausblenden">${ICON.close}</button></div>` : '';

  setView(`
    <header class="topbar home-top"><div class="brand">${LOGO}<span>QuizLis</span></div><a class="icon-btn" href="#settings" aria-label="Einstellungen">${ICON.gear}</a></header>
    <main class="page">
      ${install}
      <section class="hero-card">
        <div class="streak"><div class="streak-num">🔥 ${streak}</div><div class="streak-label">${streak === 1 ? 'Tag' : 'Tage'} in Folge</div></div>
        <div class="hero-text">${dueTotal
          ? `<b>${dueTotal} ${dueTotal === 1 ? 'Karte ist' : 'Karten sind'}</b> heute zur Wiederholung fällig.<br><button class="btn" data-act="reviewAll">Jetzt wiederholen</button>`
          : (today ? 'Stark – heute schon gelernt! 💪 Keine Wiederholungen mehr fällig.' : 'Heute noch nicht gelernt. Ein paar Minuten reichen schon!')}</div>
      </section>
      <div class="section-head"><h2>Deine Sets</h2><div style="display:flex;gap:8px"><a class="btn btn-ghost btn-sm" href="#library">${ICON.cards} Bibliothek</a><a class="btn btn-primary btn-sm" href="#edit/new">${ICON.plus} Neu</a></div></div>
      <div class="set-list">${setsHtml}</div>
    </main>`, {
    hideInstall: () => { DB.settings.hideInstall = true; save(); render(); },
    reviewAll: () => go(`learn/${dueSets.join(',')}`),
  });
}

/* ============================== Set-Ansicht ============================== */
function viewSet(id) {
  const s = getSet(id); if (!s) return go('');
  const counts = { new: 0, learning: 0, known: 0 }; s.cards.forEach(c => counts[cardState(c)]++);
  const due = s.cards.filter(isDue).length;
  let idx = 0, flipped = false;

  const preview = () => {
    if (!s.cards.length) return '';
    const c = s.cards[idx];
    return `<div class="fc-stage preview"><div class="fc ${flipped ? 'flipped' : ''}" id="pv"><div class="fc-inner">
      <div class="fc-face fc-front">${speakBtn(c.term, s.termLang)}<div class="fc-text ${sizeClass(c.term)}">${esc(c.term)}</div></div>
      <div class="fc-face fc-back">${speakBtn(c.def, s.defLang)}<div class="fc-text ${sizeClass(c.def)}">${esc(c.def)}</div></div>
    </div></div></div>
    <div class="preview-nav"><button class="icon-btn" data-act="prev" aria-label="Zurück">${ICON.left}</button><span>${idx + 1} / ${s.cards.length}</span><button class="icon-btn" data-act="next" aria-label="Weiter">${ICON.right}</button></div>`;
  };
  const lt = s.lastTest;
  setView(`
    ${topbar('', '#', `<a class="icon-btn" href="#edit/${s.id}" aria-label="Bearbeiten">${ICON.edit}</a>`)}
    <main class="page">
      <div class="set-head"><h1>${esc(s.title)}</h1><p class="muted small">${s.cards.length} Begriffe · ${LANGS[s.termLang]} – ${LANGS[s.defLang]}</p>${s.desc ? `<p class="muted">${esc(s.desc)}</p>` : ''}</div>
      ${s.cards.length ? `<div id="pvwrap">${preview()}</div>
      <div class="mode-grid">
        <a class="mode" href="#cards/${s.id}">${ICON.cards}Karteikarten</a>
        <a class="mode" href="#learn/${s.id}">${ICON.learn}Lernen${due ? `<span class="badge">${due}</span>` : ''}</a>
        <a class="mode" href="#test/${s.id}">${ICON.test}Test</a>
        <a class="mode" href="#match/${s.id}">${ICON.match}Match</a>
        <a class="mode" href="#blast/${s.id}">${ICON.rocket}Blast</a>
        <a class="mode" href="#gravity/${s.id}">${ICON.gravity}Gravity</a>
      </div>
      <h2>Dein Fortschritt</h2>
      <div class="stats">
        <div class="card stat new"><b>${counts.new}</b><span>Neu</span></div>
        <div class="card stat learning"><b>${counts.learning}</b><span>Am Lernen</span></div>
        <div class="card stat known"><b>${counts.known}</b><span>Gelernt</span></div>
      </div>
      ${lt ? `<p class="last-test muted">Letzter Test: <b>Note ${lt.grade}</b> (${lt.pct} %) am ${new Date(lt.date).toLocaleDateString('de-DE')}</p>` : '<div style="height:12px"></div>'}
      <div class="section-head"><h2>Begriffe in diesem Set (${s.cards.length})</h2></div>
      ${s.cards.map(c => `<div class="card term-row"><div class="t"><span class="dot ${cardState(c)}" title="${STATE_TEXT[cardState(c)]}"></span>${esc(c.term)}</div><div class="d">${esc(c.def)}</div>${speakBtn(c.term, s.termLang)}</div>`).join('')}
      ` : `<div class="empty card">Dieses Set ist noch leer.<br><br><a class="btn btn-primary" href="#edit/${s.id}">Karten hinzufügen</a></div>`}
    </main>`, {
    prev: () => { idx = (idx - 1 + s.cards.length) % s.cards.length; flipped = false; paintPreview(); },
    next: () => { idx = (idx + 1) % s.cards.length; flipped = false; paintPreview(); },
  });
  function paintPreview() { $('#pvwrap').innerHTML = preview(); bindPreview(); }
  function bindPreview() {
    const el = $('#pv'); if (!el) return;
    attachSwipe(el, {
      tap: () => { flipped = !flipped; el.classList.toggle('flipped', flipped); },
      left: () => actions.next(), right: () => actions.prev(), noFly: true,
    });
  }
  bindPreview();
}

/* Wisch-Gesten für Karteikarten */
function attachSwipe(el, { tap, left, right, noFly }) {
  let x0 = null, y0 = 0, dx = 0, moved = false;
  const reset = () => { el.style.transform = ''; el.style.setProperty('--ok-o', 0); el.style.setProperty('--bad-o', 0); };
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('.speak')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false; el.style.transition = 'none';
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* */ }
  });
  el.addEventListener('pointermove', e => {
    if (x0 === null) return;
    dx = e.clientX - x0; const dy = e.clientY - y0;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
    el.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
    el.style.setProperty('--ok-o', clamp(dx / 100, 0, 1)); el.style.setProperty('--bad-o', clamp(-dx / 100, 0, 1));
  });
  el.addEventListener('pointerup', () => {
    if (x0 === null) return; x0 = null; el.style.transition = '';
    if (!moved) { reset(); tap && tap(); return; }
    if (dx > 90 && right) { if (noFly) { reset(); right(); } else { el.style.transform = 'translateX(120vw) rotate(18deg)'; later(right, 180); } }
    else if (dx < -90 && left) { if (noFly) { reset(); left(); } else { el.style.transform = 'translateX(-120vw) rotate(-18deg)'; later(left, 180); } }
    else reset();
  });
  el.addEventListener('pointercancel', () => { x0 = null; el.style.transition = ''; reset(); });
}


/* ============================== Foto-Texterkennung (Tesseract.js, läuft auf dem Gerät) ============================== */
const OCR_LANG = { it: 'ita', de: 'deu', en: 'eng', fr: 'fra', es: 'spa' };
let tessLoading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (tessLoading) return tessLoading;
  tessLoading = new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    sc.onload = res; sc.onerror = () => { tessLoading = null; rej(new Error('load')); };
    document.head.appendChild(sc);
  });
  return tessLoading;
}
async function downscale(file, max = 2200) {
  const img = await createImageBitmap(file);
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  const ctx = c.getContext('2d'); ctx.filter = 'grayscale(1) contrast(1.3)'; ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
/* Zweispaltige Vokabellisten: an der größten Lücke zwischen den Wörtern einer Zeile trennen */
function linesFromOcr(data) {
  const out = [];
  for (const line of (data.lines || [])) {
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
async function ocrVocab(file, langs, onProgress) {
  await loadTesseract();
  const worker = await Tesseract.createWorker(langs, 1, { logger: m => { if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100)); else if (/load|init/i.test(m.status)) onProgress(-1); } });
  try { const { data } = await worker.recognize(await downscale(file)); return linesFromOcr(data); }
  finally { worker.terminate(); }
}
/* ============================== Set bearbeiten ============================== */
function parseImport(text) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
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

function viewEdit(id) {
  const isNew = id === 'new';
  const s = isNew ? null : getSet(id);
  if (!isNew && !s) return go('');
  const draft = {
    title: s?.title || '', desc: s?.desc || '', termLang: s?.termLang || 'it', defLang: s?.defLang || 'de',
    rows: s ? s.cards.map(c => ({ id: c.id, term: c.term, def: c.def })) : [0, 1, 2].map(() => ({ id: null, term: '', def: '' })),
  };
  let showImport = isNew, importText = '';
  const snapshot = () => JSON.stringify([draft.title, draft.desc, draft.termLang, draft.defLang, draft.rows.filter(r => r.term.trim() || r.def.trim())]);
  const initial = snapshot();
  const langOpts = sel => Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v}</option>`).join('');

  function sync() {
    draft.title = $('#e-title').value; draft.desc = $('#e-desc').value;
    draft.termLang = $('#e-tl').value; draft.defLang = $('#e-dl').value;
    if ($('#e-imp')) importText = $('#e-imp').value;
    draft.rows = $$('.edit-row').map(r => ({ id: r.dataset.id || null, term: $('.e-term', r).value, def: $('.e-def', r).value }));
  }
  const inputAttrs = 'autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"';
  function paint(focusLast) {
    const y = window.scrollY;
    setView(`
      ${topbar(isNew ? 'Neues Set' : 'Set bearbeiten', '', '', true, 'leave')}
      <main class="page">
        <div class="card edit-head">
          <label class="field"><input id="e-title" type="text" value="${esc(draft.title)}" placeholder="z. B. Italienisch Lektion 3"><span>Titel</span></label>
          <label class="field"><input id="e-desc" type="text" value="${esc(draft.desc)}" placeholder="optional"><span>Beschreibung</span></label>
          <div class="lang-row">
            <label>Begriff<select id="e-tl">${langOpts(draft.termLang)}</select></label>
            <label>Definition<select id="e-dl">${langOpts(draft.defLang)}</select></label>
          </div>
        </div>
        <div class="edit-tools">
          <button class="btn btn-ghost btn-sm" data-act="toggleImport">${ICON.upload} Importieren</button>
          <button class="btn btn-ghost btn-sm" data-act="swapAll">${ICON.swap} Begriff ⇄ Definition</button>
        </div>
        ${showImport ? `<div class="card import-box">
          <p><b>Liste einfügen</b> – eine Karte pro Zeile. Begriff und Definition getrennt durch Tab, Bindestrich, Semikolon, = oder Komma.<br><span class="muted">Aus Quizlet (am PC): Set öffnen → ⋯ → Exportieren → Text kopieren.</span></p>
          <textarea id="e-imp" placeholder="ciao	hallo&#10;la casa - das Haus&#10;mangiare; essen" ${inputAttrs}>${esc(importText)}</textarea>
          <div class="row-btns" style="align-items:center"><label class="btn btn-ghost btn-sm" style="margin-right:auto">📷 Foto scannen<input type="file" id="e-photo" accept="image/*" hidden></label><span class="muted small" id="imp-count"></span><button class="btn btn-primary btn-sm" data-act="doImport">Übernehmen</button></div>
          <p class="muted small" style="margin:10px 0 0">Tipp: Vokabelliste gerade und gut beleuchtet fotografieren. Danach das Ergebnis kurz prüfen – Seitenzahlen oder Überschriften einfach löschen.</p>
        </div>` : ''}
        <div id="rows">${draft.rows.map((r, i) => `
          <div class="card edit-row" data-id="${r.id || ''}">
            <div class="edit-row-head"><span>${i + 1}</span><button class="icon-btn sm" data-act="delRow" data-i="${i}" aria-label="Karte löschen">${ICON.trash}</button></div>
            <div class="edit-fields">
              <label class="field"><input class="e-term" type="text" value="${esc(r.term)}" ${inputAttrs} lang="${draft.termLang}"><span>Begriff · ${LANGS[draft.termLang]}</span></label>
              <label class="field"><input class="e-def" type="text" value="${esc(r.def)}" ${inputAttrs} lang="${draft.defLang}"><span>Definition · ${LANGS[draft.defLang]}</span></label>
            </div>
          </div>`).join('')}
        </div>
        <button class="add-row" data-act="addRow">+ Karte hinzufügen</button>
        <div class="sticky-save"><button class="btn btn-primary btn-block btn-lg" data-act="save" style="margin:0">Speichern</button></div>
        ${!isNew ? `<div class="danger-zone"><button class="btn btn-danger btn-sm" data-act="delSet">${ICON.trash} Set löschen</button></div>` : ''}
      </main>`, {
      leave: () => { sync(); if (snapshot() !== initial && !confirm('Änderungen verwerfen?')) return; go(isNew ? '' : `set/${s.id}`); },
      toggleImport: () => { sync(); showImport = !showImport; paint(); if (showImport) $('#e-imp')?.focus(); },
      doImport: () => {
        sync(); const rows = parseImport(importText);
        if (!rows.length) return toast('Keine Karten erkannt – prüfe das Format');
        draft.rows = draft.rows.filter(r => r.term.trim() || r.def.trim()).concat(rows);
        importText = ''; showImport = false; paint(); toast(`${rows.length} Karten übernommen`);
      },
      swapAll: () => { sync(); draft.rows.forEach(r => { [r.term, r.def] = [r.def, r.term]; }); [draft.termLang, draft.defLang] = [draft.defLang, draft.termLang]; paint(); toast('Seiten getauscht'); },
      addRow: () => { sync(); draft.rows.push({ id: null, term: '', def: '' }); paint(true); },
      delRow: t => { sync(); draft.rows.splice(+t.dataset.i, 1); paint(); },
      save: () => {
        sync();
        const rows = draft.rows.filter(r => r.term.trim() && r.def.trim());
        if (!draft.title.trim()) { toast('Bitte gib dem Set einen Titel'); $('#e-title').focus(); return; }
        if (!rows.length) return toast('Mindestens eine Karte mit Begriff und Definition');
        const set = s || { id: uid(), created: Date.now(), cards: [], lastTest: null };
        const old = new Map(set.cards.map(c => [c.id, c]));
        set.cards = rows.map(r => {
          const o = r.id && old.get(r.id);
          if (o) { o.term = r.term.trim(); o.def = r.def.trim(); return o; }
          return newCard(r.term.trim(), r.def.trim());
        });
        Object.assign(set, { title: draft.title.trim(), desc: draft.desc.trim(), termLang: draft.termLang, defLang: draft.defLang, updated: Date.now() });
        if (!s) DB.sets.push(set);
        save(); toast('Gespeichert'); go(`set/${set.id}`);
      },
      delSet: () => {
        if (!confirm(`Set „${s.title}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;
        DB.sets = DB.sets.filter(x => x.id !== s.id); Object.keys(DB.best).forEach(k => { if (k.endsWith(s.id)) delete DB.best[k]; }); save(); toast('Set gelöscht'); go('');
      },
    });
    ['#e-tl', '#e-dl'].forEach(sel => $(sel).addEventListener('change', () => { sync(); paint(); }));
    const imp = $('#e-imp');
    if (imp) {
      const upd = () => { const n = parseImport(imp.value).length; $('#imp-count').textContent = n ? `${n} Karten erkannt` : ''; };
      imp.addEventListener('input', upd); upd();
      $('#e-photo').addEventListener('change', async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        const cnt = $('#imp-count'), langs = [...new Set([OCR_LANG[draft.termLang], OCR_LANG[draft.defLang]].filter(Boolean))].join('+');
        cnt.textContent = 'Texterkennung wird geladen …';
        try {
          const text = await ocrVocab(f, langs, p => { if ($('#imp-count')) $('#imp-count').textContent = p < 0 ? 'Texterkennung wird geladen …' : `Erkenne Text … ${p} %`; });
          const box = $('#e-imp'); if (!box) return;
          box.value = (box.value.trim() ? box.value.trim() + '\n' : '') + text; importText = box.value; upd();
          toast(parseImport(text).length ? 'Text erkannt – bitte kurz prüfen' : 'Text erkannt, aber keine Paare gefunden – bitte Trennzeichen ergänzen');
        } catch (err) { if ($('#imp-count')) $('#imp-count').textContent = ''; toast('Texterkennung nicht möglich – bist du online?'); }
      });
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
      if (focusLast) { const rows = $$('.edit-row'); const last = rows[rows.length - 1]; last.scrollIntoView({ block: 'center' }); $('.e-term', last).focus(); }
    });
  }
  paint();
  if (isNew) $('#e-title').focus();
}

/* ============================== Karteikarten ============================== */
function viewCards(id, onlyIds) {
  const s = getSet(id); if (!s || !s.cards.length) return go(s ? `set/${id}` : '');
  const base = onlyIds ? s.cards.filter(c => onlyIds.split(',').includes(c.id)) : [...s.cards];
  let deck = [...base], i = 0, flipped = false, known = [], unknown = [], shuffled = false;
  const side = (c, which) => which === 'term' ? { t: c.term, l: s.termLang } : { t: c.def, l: s.defLang };

  function paint() {
    if (i >= deck.length) return paintDone();
    const c = deck[i], fr = DB.settings.cardFront, f = side(c, fr), b = side(c, fr === 'term' ? 'def' : 'term');
    flipped = false;
    setView(`
      ${topbar(`${i + 1} / ${deck.length}`, `#set/${s.id}`, `<button class="icon-btn ${shuffled ? 'on' : ''}" data-act="shuffle" aria-label="Mischen">${ICON.shuffle}</button>`, true)}
      ${bar(i / deck.length * 100)}
      <main class="page fc-page">
        <div class="fc-counts"><span class="cnt bad">${unknown.length}</span><span class="muted small">Tippen zum Umdrehen</span><span class="cnt ok">${known.length}</span></div>
        <div class="fc-stage"><div class="fc" id="fc"><div class="fc-inner">
          <div class="fc-face fc-front"><span class="side-label">${LANGS[f.l]}</span>${speakBtn(f.t, f.l)}<div class="fc-text ${sizeClass(f.t)}">${esc(f.t)}</div></div>
          <div class="fc-face fc-back"><span class="side-label">${LANGS[b.l]}</span>${speakBtn(b.t, b.l)}<div class="fc-text ${sizeClass(b.t)}">${esc(b.t)}</div></div>
        </div><div class="swipe-tag swipe-ok">Kann ich</div><div class="swipe-tag swipe-bad">Noch lernen</div></div></div>
        <div class="fc-controls">
          <button class="round-btn bad" data-act="no" aria-label="Noch lernen">${ICON.close}</button>
          <button class="btn btn-ghost btn-sm" data-act="side">${ICON.swap} Vorne: ${LANGS[f.l]}</button>
          <button class="round-btn ok" data-act="yes" aria-label="Kann ich">${ICON.check}</button>
        </div>
      </main>`, {
      no: () => answer(false), yes: () => answer(true),
      side: () => { DB.settings.cardFront = fr === 'term' ? 'def' : 'term'; save(); paint(); },
      shuffle: () => { shuffled = !shuffled; deck = shuffled ? shuffle(base) : [...base]; i = 0; known = []; unknown = []; toast(shuffled ? 'Gemischt – von vorne' : 'Originalreihenfolge'); paint(); },
    });
    const el = $('#fc');
    attachSwipe(el, {
      tap: () => { flipped = !flipped; el.classList.toggle('flipped', flipped); if (flipped) autoSpeak(b.t, b.l); },
      left: () => answer(false), right: () => answer(true),
    });
    autoSpeak(f.t, f.l);
  }
  function answer(k) { (k ? known : unknown).push(deck[i]); i++; markStudied(); paint(); }
  function paintDone() {
    setView(`
      ${topbar('Karteikarten', `#set/${s.id}`, '', true)}
      <main class="page done">
        <div class="celebrate">${unknown.length ? '💪' : '🎉'}</div>
        <h1>${unknown.length ? 'Gut gemacht!' : 'Perfekt – alles gewusst!'}</h1>
        <p class="muted">Kann ich: <b>${known.length}</b> · Noch lernen: <b>${unknown.length}</b></p>
        ${unknown.length ? `<button class="btn btn-primary btn-block btn-lg" data-act="again">Unsichere Karten wiederholen (${unknown.length})</button>
        <button class="btn btn-ghost btn-block" data-act="learn">${ICON.learn} Im Lernen-Modus festigen</button>` : ''}
        <button class="btn btn-ghost btn-block" data-act="restart">${ICON.redo} Alle Karten von vorne</button>
        <a class="btn btn-ghost btn-block" href="#set/${s.id}">Zurück zum Set</a>
      </main>`, {
      again: () => { deck = shuffled ? shuffle(unknown) : unknown; i = 0; known = []; unknown = []; paint(); },
      learn: () => go(`learn/${s.id}/${unknown.map(c => c.id).join(',')}`),
      restart: () => { deck = shuffled ? shuffle(base) : [...base]; i = 0; known = []; unknown = []; paint(); },
    });
  }
  paint();
}

/* ============================== Lernen ============================== */
function pickForLearning(all, n = 10) {
  const now = Date.now();
  const due = all.filter(x => x.c.seen && x.c.due <= now).sort((a, b) => a.c.box - b.c.box || a.c.due - b.c.due);
  const fresh = all.filter(x => !x.c.seen);
  return [...due, ...fresh].slice(0, n);
}

function viewLearn(setIdsStr, cardIdsStr) {
  const sets = String(setIdsStr || '').split(',').map(getSet).filter(Boolean);
  if (!sets.length) return go('');
  const backHref = sets.length === 1 ? `#set/${sets[0].id}` : '#';
  const all = sets.flatMap(s => s.cards.map(c => ({ c, s })));
  if (!all.length) return go(backHref.slice(1));

  let pool;
  if (cardIdsStr === 'all') pool = shuffle(all).slice(0, 10);
  else if (cardIdsStr) { const ids = new Set(cardIdsStr.split(',')); pool = all.filter(x => ids.has(x.c.id)); }
  else pool = pickForLearning(all);
  if (!pool.length) return paintNothingDue();

  const canMC = all.length >= 2;
  const items = shuffle(pool).map(x => ({ ...x, stage: (!canMC || x.c.box >= 2) ? 1 : 0, err: false, dir: pickDir() }));
  const total = items.length, done = [], queue = [...items];
  let locked = false;
  const cur = () => queue[0];
  const curD = () => qaFor(queue[0]);
  const pct = () => items.reduce((n, it) => n + Math.min(it.stage, 2), 0) / (total * 2) * 100;
  const title = () => `Lernen · ${done.length}/${total}`;
  const qHead = d => `<div class="q-head"><span class="muted small" id="q-lang">${LANGS[d.qLang]}</span><span id="q-speak">${speakBtn(d.q, d.qLang)}</span></div><div class="q-text ${sizeClass(d.q)}" id="q-text">${esc(d.q)}</div>`;
  const shell = inner => `${topbar(title(), backHref, '', true)}${bar(pct())}<main class="page">${inner}</main>`;
  const acts = {
    mc: t => {
      if (locked) return; locked = true;
      const it = cur(), d = curD(), k = +t.dataset.k, ok = it.opts[k] === d.a;
      $$('.mc-opt').forEach((b, j) => b.classList.add(it.opts[j] === d.a ? 'correct' : (j === k ? 'wrong' : 'dim')));
      result(ok, d);
    },
    dunno: () => { if (locked) return; locked = true; $('#wi').blur(); result(false, curD(), '', 'wrong'); },
    next: () => advance(false),
    override: () => { const it = cur(); it.err = it.prevErr; it.stage++; markStudied(); advance(true); },
  };

  function paint() {
    if (!queue.length) return paintEnd();
    locked = false;
    const it = cur(), d = curD();
    if (it.stage === 0) {
      it.opts = shuffle([d.a, ...distractors(all, it, it.dir, 3)]);
      if (it.opts.length < 2) it.stage = 1;
    }
    if (it.stage === 0) {
      setView(shell(`<div class="card learn-card">${qHead(d)}
        <div class="q-instr">Wähle die richtige Antwort</div>
        <div class="mc-grid">${it.opts.map((o, k) => `<button class="mc-opt" data-act="mc" data-k="${k}"><span class="mc-num">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>
        <div id="fb"></div></div>`), acts);
    } else {
      const inp = $('#wi');
      if (inp && inp.dataset.lang === d.aLang) {
        /* Schreibansicht weiterverwenden – so bleibt die iPhone-Tastatur offen */
        $('.topbar-title').textContent = title(); $('.bar > div').style.width = `${pct()}%`;
        $('#q-lang').textContent = LANGS[d.qLang]; $('#q-speak').innerHTML = speakBtn(d.q, d.qLang);
        const qt = $('#q-text'); qt.textContent = d.q; qt.className = `q-text ${sizeClass(d.q)}`;
        $('#fb').innerHTML = ''; $('.row-btns', $('#wf')).style.display = '';
        inp.readOnly = false; inp.value = ''; inp.focus();
      } else {
        setView(shell(`<div class="card learn-card">${qHead(d)}
          <div class="q-instr">Schreib die Antwort auf ${LANGS[d.aLang]}</div>
          <form id="wf" autocomplete="off"><input id="wi" class="write-input" type="text" placeholder="Antwort eingeben" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" lang="${d.aLang}" data-lang="${d.aLang}">
          ${accentBar(d.aLang, '#wi')}
          <div class="row-btns"><button type="button" class="btn btn-ghost" data-act="dunno">Weiß ich nicht</button><button type="submit" class="btn btn-primary">Antworten</button></div></form>
          <div id="fb"></div></div>`), acts);
        const w = $('#wi'); w.focus();
        $('#wf').addEventListener('submit', e => {
          e.preventDefault();
          if (locked) { if ($('[data-act=next]')) advance(false); return; }
          const v = w.value; if (!v.trim()) { w.focus(); return; }
          locked = true;
          const dd = curD(), r = checkAnswer(v, dd.a, dd.aLang), ok = r === 'ok' || r === 'accent-ok';
          if (!ok) { w.readOnly = true; w.blur(); }
          result(ok, dd, v, r);
        });
      }
    }
    autoSpeak(d.q, d.qLang);
  }

  function result(ok, d, user = null, kind = null) {
    const it = cur();
    if ($('#wf')) $('.row-btns', $('#wf')).style.display = 'none';
    if (ok) {
      it.stage++; markStudied();
      const accentHint = kind === 'accent-ok' ? `<div>Richtig – achte aber auf die Akzente:</div><div class="ans ok">${esc(d.a)}${speakBtn(d.a, d.aLang)}</div>` : '';
      $('#fb').innerHTML = `<div class="fb fb-ok"><div class="fb-title">${['Super!', 'Richtig!', 'Klasse!', 'Genau!', 'Perfetto!', 'Bravissima!'][Math.floor(Math.random() * 6)]} ✓</div>${accentHint}</div>`;
      autoSpeak(d.a, d.aLang);
      later(() => advance(true), kind === 'accent-ok' ? 2000 : 900);
    } else {
      it.prevErr = it.err; it.err = true;
      const titleTxt = { typo: 'Fast richtig – kleiner Tippfehler?', accent: 'Achte auf die Akzente!', article: 'Denk an den Artikel!' }[kind] || (user === null ? 'Nicht ganz – das lernst du noch!' : 'Noch nicht ganz – merk es dir!');
      $('#fb').innerHTML = `<div class="fb fb-bad"><div class="fb-title">${titleTxt}</div>
        ${user ? `<div class="muted small">Deine Antwort</div><div class="ans bad">${esc(user)}</div>` : ''}
        ${user !== null ? `<div class="muted small">Richtige Antwort</div><div class="ans ok">${esc(d.a)}${speakBtn(d.a, d.aLang)}</div>` : ''}
        <div class="row-btns">${user ? '<button class="btn btn-ghost" data-act="override">Ich hatte recht</button>' : ''}<button class="btn btn-primary" data-act="next">Weiter</button></div></div>`;
      autoSpeak(d.a, d.aLang);
      $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function advance(correct) {
    const it = queue.shift(); if (!it) return;
    if (correct && it.stage >= 2) { srsUpdate(it.c, !it.err); done.push(it); save(); }
    else { const pos = Math.min(queue.length, correct ? 2 + Math.floor(Math.random() * 3) : 2); queue.splice(pos, 0, it); }
    paint();
  }

  function paintEnd() {
    const more = pickForLearning(all).length;
    const errs = done.filter(x => x.err).length;
    setView(`${topbar('Lernen', backHref, '', true)}${bar(100)}<main class="page done">
      <div class="celebrate">🎉</div><h1>Runde geschafft!</h1>
      <p class="muted">${done.length} Begriffe gelernt${errs ? ` · ${errs} davon kommen bald wieder` : ' – alles ohne Fehler!'}</p>
      ${more ? `<button class="btn btn-primary btn-block btn-lg" data-act="again">Weiterlernen (${more} warten)</button>` : '<p><b>Für heute ist alles erledigt.</b> Morgen geht\'s weiter! ✨</p>'}
      <a class="btn btn-ghost btn-block" href="${backHref}">Fertig</a>
      <div class="done-list">${done.map(x => `<div class="card done-item"><span class="${x.err ? 'bad' : 'ok'}">${x.err ? ICON.redo : ICON.check}</span><b>${esc(x.c.term)}</b><span class="muted">${esc(x.c.def)}</span></div>`).join('')}</div>
    </main>`, { again: () => go(`learn/${setIdsStr}`) });
  }

  function paintNothingDue() {
    const nexts = all.filter(x => x.c.seen).map(x => x.c.due);
    const next = nexts.length ? new Date(Math.min(...nexts)).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) : null;
    setView(`${topbar('Lernen', backHref, '', true)}<main class="page done">
      <div class="celebrate">✨</div><h1>Alles erledigt!</h1>
      <p class="muted">Gerade ist nichts zur Wiederholung fällig.${next ? `<br>Nächste Wiederholung: <b>${next}</b>` : ''}</p>
      <button class="btn btn-primary btn-block btn-lg" data-act="anyway">Trotzdem üben</button>
      <a class="btn btn-ghost btn-block" href="${backHref}">Zurück</a></main>`, { anyway: () => go(`learn/${setIdsStr}/all`) });
  }
  paint();
}

/* ============================== Test (Klausurmodus) ============================== */
let CURRENT_TEST = null;
const GRADE_TEXT = { 1: 'Sehr gut', 2: 'Gut', 3: 'Befriedigend', 4: 'Ausreichend', 5: 'Mangelhaft', 6: 'Ungenügend' };
const gradeFor = p => p >= 92 ? 1 : p >= 81 ? 2 : p >= 67 ? 3 : p >= 50 ? 4 : p >= 30 ? 5 : 6;
const TYPE_TEXT = { tf: 'Wahr oder falsch', mc: 'Multiple Choice', write: 'Schriftlich' };

function viewTestSetup(setIdsStr) {
  const pre = new Set(String(setIdsStr || '').split(','));
  const first = DB.sets.find(s => pre.has(s.id)) || DB.sets[0];
  if (!first) return go('');
  const backHref = pre.size === 1 && getSet([...pre][0]) ? `#set/${[...pre][0]}` : '#';
  const aw = DB.settings.answerWith;
  setView(`${topbar('Test einrichten', backHref, '', true)}
    <main class="page"><div class="card form-card">
      <h2>Klausur-Modus</h2>
      <p class="muted small">Wie im echten Test: keine Hilfen, keine Aussprache, Auswertung mit Note erst am Ende.</p>
      <div class="form-group"><span class="label">Sets</span>
        ${DB.sets.map(s => `<label class="check"><input type="checkbox" name="sets" value="${s.id}" ${pre.has(s.id) ? 'checked' : ''}><span>${esc(s.title)} <span class="muted small">(${s.cards.length})</span></span></label>`).join('')}
      </div>
      <div class="form-group"><label class="label" for="t-n">Anzahl Fragen <span class="muted small" id="t-max"></span></label><input type="number" id="t-n" min="1" inputmode="numeric"></div>
      <div class="form-group"><label class="label" for="t-aw">Antworten auf</label><select id="t-aw">
        <option value="term" ${aw === 'term' ? 'selected' : ''}>${LANGS[first.termLang]} (Begriff)</option>
        <option value="def" ${aw === 'def' ? 'selected' : ''}>${LANGS[first.defLang]} (Definition)</option>
        <option value="mixed" ${aw === 'mixed' ? 'selected' : ''}>Gemischt</option></select></div>
      <div class="form-group"><span class="label">Fragetypen</span>
        <label class="check"><input type="checkbox" name="types" value="tf" checked><span>Wahr oder falsch</span></label>
        <label class="check"><input type="checkbox" name="types" value="mc" checked><span>Multiple Choice</span></label>
        <label class="check"><input type="checkbox" name="types" value="write" checked><span>Schriftlich</span></label>
      </div>
      <div class="form-group"><label class="label" for="t-time">Zeitlimit</label><select id="t-time">
        <option value="0">Kein Zeitlimit</option><option value="5">5 Minuten</option><option value="10">10 Minuten</option><option value="15">15 Minuten</option><option value="20">20 Minuten</option><option value="30">30 Minuten</option><option value="45">45 Minuten</option></select></div>
      <button class="btn btn-primary btn-block btn-lg" data-act="start">Test starten</button>
    </div></main>`, { start });
  const selected = () => $$('input[name=sets]:checked').map(i => getSet(i.value)).filter(Boolean);
  const updMax = () => {
    const max = selected().reduce((n, s) => n + s.cards.length, 0);
    $('#t-max').textContent = `(max. ${max})`; const inp = $('#t-n'); inp.max = max;
    if (!inp.dataset.touched) inp.value = Math.min(20, max) || '';
  };
  $$('input[name=sets]').forEach(i => i.addEventListener('change', updMax));
  $('#t-n').addEventListener('input', e => { e.target.dataset.touched = '1'; });
  updMax();

  function start() {
    const sets = selected();
    const all = sets.flatMap(s => s.cards.map(c => ({ c, s })));
    if (!all.length) return toast('Bitte mindestens ein Set mit Karten wählen');
    const types = $$('input[name=types]:checked').map(i => i.value);
    if (!types.length) return toast('Bitte mindestens einen Fragetyp wählen');
    const n = clamp(parseInt($('#t-n').value, 10) || Math.min(20, all.length), 1, all.length);
    const awSel = $('#t-aw').value, mins = +$('#t-time').value;
    const order = { tf: 0, mc: 1, write: 2 };
    const qs = shuffle(all).slice(0, n).map((x, k) => {
      const dir = awSel === 'mixed' ? (Math.random() < .5 ? 'term' : 'def') : awSel;
      const it = { ...x, dir }; const d = qaFor(it);
      const q = { type: types[k % types.length], c: x.c, s: x.s, dir, ...d, user: null };
      if (all.length < 2 && q.type !== 'write') q.type = 'write';
      if (q.type === 'mc') { q.opts = shuffle([d.a, ...distractors(all, it, dir, 3)]); if (q.opts.length < 2) q.type = 'write'; }
      if (q.type === 'tf') {
        const wrong = distractors(all, it, dir, 1)[0];
        q.tfTrue = !wrong || Math.random() < .5; q.shown = q.tfTrue ? d.a : wrong;
      }
      return q;
    }).sort((a, b) => order[a.type] - order[b.type]);
    CURRENT_TEST = { setIds: sets.map(s => s.id), qs, mins, start: Date.now(), done: false, backHref: sets.length === 1 ? `#set/${sets[0].id}` : '#' };
    go('testrun');
  }
}

function viewTestRun() {
  const T = CURRENT_TEST; if (!T) return go('');
  if (T.done) return paintResult();
  const n = T.qs.length;
  const answered = () => T.qs.filter(q => q.user !== null && q.user !== '').length;
  let lastType = null;
  const body = T.qs.map((q, k) => {
    const sec = q.type !== lastType ? `<div class="tq-type">${TYPE_TEXT[q.type]}</div>` : ''; lastType = q.type;
    let inner;
    if (q.type === 'tf') inner = `<div class="tf-pair"><div>${esc(q.q)}</div><div class="eq">=</div><div>${esc(q.shown)}</div></div>
      <div class="tf-btns"><button class="choice" data-act="tf" data-k="${k}" data-v="1">Wahr</button><button class="choice" data-act="tf" data-k="${k}" data-v="0">Falsch</button></div>`;
    else if (q.type === 'mc') inner = `<div class="tq-q">${esc(q.q)}</div>${q.opts.map((o, j) => `<button class="choice" data-act="mc" data-k="${k}" data-o="${j}">${esc(o)}</button>`).join('')}`;
    else inner = `<div class="tq-q">${esc(q.q)}</div><input class="write-input t-input" id="ti${k}" data-k="${k}" type="text" placeholder="Antwort auf ${LANGS[q.aLang]}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" lang="${q.aLang}">${accentBar(q.aLang, '#ti' + k)}`;
    return `${sec}<div class="card tq"><div class="muted small">${k + 1} von ${n}</div>${inner}</div>`;
  }).join('');
  setView(`${topbar('Test', T.backHref, `<span class="timer" id="timer"></span>`, true, 'leave')}${bar(0)}
    <main class="page"><p class="muted small" id="answered" style="text-align:center;margin:8px 0 0"></p>${body}
    <button class="btn btn-primary btn-block btn-lg" data-act="submit" style="margin-top:20px">Test abgeben</button></main>`, {
    tf: t => { const q = T.qs[+t.dataset.k]; q.user = t.dataset.v === '1'; selectIn(t); upd(); },
    mc: t => { const q = T.qs[+t.dataset.k]; q.user = q.opts[+t.dataset.o]; selectIn(t); upd(); },
    submit: () => submit(false),
    leave: () => { if (answered() && !confirm('Test abbrechen? Deine Antworten gehen verloren.')) return; CURRENT_TEST = null; location.hash = T.backHref; },
  });
  const selectIn = t => { $$('.choice', t.closest('.tq')).forEach(b => b.classList.remove('selected')); t.classList.add('selected'); };
  $('main').addEventListener('input', e => { if (e.target.classList.contains('t-input')) { T.qs[+e.target.dataset.k].user = e.target.value; upd(); } });
  function upd() { const a = answered(); $('#answered').textContent = `${a} von ${n} beantwortet`; $('.bar > div').style.width = `${a / n * 100}%`; }
  upd();
  const tick = () => {
    const el = $('#timer'); if (!el) return;
    const elapsed = Date.now() - T.start;
    if (T.mins) {
      const rest = T.mins * 60000 - elapsed;
      if (rest <= 0) { el.textContent = '0:00'; toast('Zeit ist um!'); submit(true); return; }
      el.textContent = fmtTime(rest); el.classList.toggle('low', rest < 60000);
    } else el.textContent = fmtTime(elapsed);
  };
  tick(); const iv = setInterval(tick, 1000); onCleanup(() => clearInterval(iv));

  function submit(force) {
    const open = n - answered();
    if (!force && open && !confirm(`${open} ${open === 1 ? 'Frage ist' : 'Fragen sind'} noch unbeantwortet. Trotzdem abgeben?`)) return;
    clearInterval(iv);
    T.qs.forEach(q => {
      if (q.type === 'tf') q.correct = q.user !== null && q.user === q.tfTrue;
      else if (q.type === 'mc') q.correct = q.user === q.a;
      else { q.kind = checkAnswer(q.user || '', q.a, q.aLang); q.correct = q.kind === 'ok' || q.kind === 'accent-ok'; }
      if (!q.correct) { q.c.seen = true; q.c.box = Math.min(q.c.box, 1); q.c.due = Date.now(); }
    });
    T.done = true; T.end = Date.now();
    T.ok = T.qs.filter(q => q.correct).length; T.pct = Math.round(T.ok / n * 100); T.grade = gradeFor(T.pct);
    T.setIds.forEach(id => { const s = getSet(id); if (s) s.lastTest = { pct: T.pct, grade: T.grade, date: Date.now() }; });
    markStudied(n); save(); paintResult();
  }
}
const fmtTime = ms => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

function paintResult() {
  const T = CURRENT_TEST, n = T.qs.length, wrong = T.qs.filter(q => !q.correct);
  const yours = q => q.type === 'tf' ? (q.user === null ? '–' : q.user ? 'Wahr' : 'Falsch') : (q.user || '–');
  const right = q => q.type === 'tf' ? `${q.tfTrue ? 'Wahr' : 'Falsch'} (${esc(q.q)} = ${esc(q.a)})` : esc(q.a);
  setView(`${topbar('Testergebnis', T.backHref, '', true)}<main class="page">
    <div class="card result-card"><div class="grade grade-${T.grade}">${T.grade}<small>Note</small></div>
      <div><div class="result-title">${GRADE_TEXT[T.grade]}</div><div class="muted">${T.ok} von ${n} richtig · ${T.pct} %<br>Zeit: ${fmtTime(T.end - T.start)}</div></div></div>
    ${wrong.length ? `<button class="btn btn-primary btn-block btn-lg" data-act="practice">${ICON.learn} Fehler im Lernen-Modus üben (${wrong.length})</button>` : '<p style="text-align:center"><b>Alles richtig – stark! 🎉</b></p>'}
    <button class="btn btn-ghost btn-block" data-act="retry">${ICON.redo} Neuen Test starten</button>
    <div class="section-head" style="margin-top:24px"><h2>Auswertung</h2></div>
    ${T.qs.map((q, k) => `<div class="card rq ${q.correct ? 'ok' : 'bad'}">
      <div class="muted small">${k + 1} · ${TYPE_TEXT[q.type]} · ${q.correct ? '✓ richtig' : '✗ falsch'}</div>
      <div class="rq-q">${esc(q.type === 'tf' ? `${q.q} = ${q.shown}` : q.q)}</div>
      <div class="line yours ${q.correct ? '' : 'bad'}">Deine Antwort: <b>${esc(yours(q))}</b></div>
      ${q.correct && q.kind !== 'accent-ok' ? '' : `<div class="line right">Richtig: <b>${right(q)}</b></div>`}
    </div>`).join('')}
  </main>`, {
    practice: () => go(`learn/${T.setIds.join(',')}/${[...new Set(wrong.map(q => q.c.id))].join(',')}`),
    retry: () => go(`test/${T.setIds.join(',')}`),
  });
}

/* ============================== Match ============================== */
function viewMatch(id) {
  const s = getSet(id); if (!s) return go('');
  if (s.cards.length < 2) { toast('Für Match braucht das Set mindestens 2 Karten'); return go(`set/${id}`); }
  const fmt = t => `${t.toFixed(1).replace('.', ',')} s`;

  function intro() {
    const best = DB.best[id];
    setView(`${topbar('Match', `#set/${s.id}`, '', true)}<main class="page done">
      <div class="celebrate">⚡</div><h1>Bereit fürs Match?</h1>
      <p class="muted">Ordne alle Begriffe so schnell wie möglich ihren Definitionen zu.<br>Jeder Fehler kostet 1 Sekunde.</p>
      ${best ? `<p>Deine Bestzeit: <b>${fmt(best)}</b></p>` : ''}
      <button class="btn btn-primary btn-block btn-lg" data-act="play">Spiel starten</button></main>`, { play });
  }
  function play() {
    const picked = [], seenT = new Set(), seenD = new Set();
    for (const c of shuffle(s.cards)) {
      const t = normAns(c.term), d = normAns(c.def);
      if (seenT.has(t) || seenD.has(d) || seenT.has(d) || seenD.has(t) || t === d) continue;
      seenT.add(t); seenD.add(d); picked.push(c); if (picked.length >= 6) break;
    }
    const tiles = shuffle(picked.flatMap(c => [{ cid: c.id, text: c.term }, { cid: c.id, text: c.def }]));
    let sel = null, left = picked.length, penalty = 0, busy = false; const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000 + penalty;
    setView(`${topbar('Match', `#set/${s.id}`, '', true)}<main class="page">
      <div class="match-top"><span class="match-timer" id="mt">0,0 s</span><span id="pen"></span></div>
      <div class="match-grid">${tiles.map((t, k) => `<button class="tile ${t.text.length > 45 ? 'xs' : t.text.length > 22 ? 'sm' : ''}" data-act="tile" data-k="${k}">${esc(t.text)}</button>`).join('')}</div>
      </main>`, {
      tile: el => {
        if (busy || el.classList.contains('matched')) return;
        const k = +el.dataset.k;
        if (sel === null) { sel = k; el.classList.add('sel'); return; }
        if (sel === k) { sel = null; el.classList.remove('sel'); return; }
        const a = $(`.tile[data-k="${sel}"]`), b = el;
        if (tiles[sel].cid === tiles[k].cid) {
          a.classList.remove('sel'); a.classList.add('matched'); b.classList.add('matched'); sel = null; left--;
          later(() => { a.classList.add('gone'); b.classList.add('gone'); }, 450);
          if (!left) finish();
        } else {
          busy = true; penalty += 1; a.classList.remove('sel'); a.classList.add('wrong'); b.classList.add('wrong'); sel = null;
          $('#pen').innerHTML = '<span class="penalty">+1 s</span>';
          setTimeout(() => { a.classList.remove('wrong'); b.classList.remove('wrong'); busy = false; }, 450);
        }
      },
    });
    const iv = setInterval(() => { const el = $('#mt'); if (el) el.textContent = fmt(now()); }, 100);
    onCleanup(() => clearInterval(iv));
    function finish() {
      clearInterval(iv);
      const time = Math.round(now() * 10) / 10, best = DB.best[id], isBest = !best || time < best;
      if (isBest) DB.best[id] = time;
      markStudied(picked.length); save();
      later(() => setView(`${topbar('Match', `#set/${s.id}`, '', true)}<main class="page done">
        <div class="celebrate">${isBest ? '🏆' : '⚡'}</div><h1>${isBest ? 'Neue Bestzeit!' : 'Geschafft!'}</h1>
        <div class="big-time">${fmt(time)}</div>
        ${!isBest ? `<p class="muted">Bestzeit: ${fmt(best)}</p>` : best ? `<p class="muted">Vorher: ${fmt(best)}</p>` : ''}
        ${penalty ? `<p class="muted small">inkl. ${penalty} s Strafzeit</p>` : ''}
        <button class="btn btn-primary btn-block btn-lg" data-act="play">Nochmal spielen</button>
        <a class="btn btn-ghost btn-block" href="#set/${s.id}">Zurück zum Set</a></main>`, { play }), 550);
    }
  }
  intro();
}

/* ============================== Spiele: gemeinsame Teile ============================== */
function gameIntro({ s, key, emoji, title, text, minCards, play }) {
  if (s.cards.length < minCards) { toast(`Für ${title} braucht das Set mindestens ${minCards} Karten`); return go(`set/${s.id}`); }
  const best = DB.best[`${key}_${s.id}`];
  setView(`${topbar(title, `#set/${s.id}`, '', true)}<main class="page done">
    <div class="celebrate">${emoji}</div><h1>${title}</h1>
    <p class="muted">${text}</p>
    ${best ? `<p>Dein Rekord: <b>${best} Punkte</b></p>` : ''}
    <button class="btn btn-primary btn-block btn-lg" data-act="play">Spiel starten</button>
    <a class="btn btn-ghost btn-block" href="#set/${s.id}">Zurück zum Set</a></main>`, { play });
}
function gameOver({ s, key, title, score, won, stats, replay }) {
  const k = `${key}_${s.id}`, prev = DB.best[k] || 0, isBest = score > prev;
  if (isBest) DB.best[k] = score;
  save();
  setView(`${topbar(title, `#set/${s.id}`, '', true)}<main class="page done">
    <div class="celebrate">${isBest && score ? '🏆' : won ? '🎉' : '💥'}</div>
    <h1>${isBest && score ? 'Neuer Rekord!' : won ? 'Alle Wörter geschafft!' : 'Game over'}</h1>
    <div class="big-time">${score} Punkte</div>
    <p class="muted">${stats}${!isBest && prev ? `<br>Rekord: ${prev} Punkte` : ''}</p>
    <button class="btn btn-primary btn-block btn-lg" data-act="replay">Nochmal spielen</button>
    <a class="btn btn-ghost btn-block" href="#set/${s.id}">Zurück zum Set</a></main>`, { replay });
}
const hearts = n => '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(Math.max(0, 3 - n));
function floatPoints(field, x, y, txt) {
  const el = document.createElement('div'); el.className = 'float-pts'; el.textContent = txt;
  el.style.left = `${x}px`; el.style.top = `${y}px`; field.appendChild(el); later(() => el.remove(), 900);
}

/* ============================== Blast ============================== */
function viewBlast(id) {
  const s = getSet(id); if (!s) return go('');
  const all = s.cards.map(c => ({ c, s }));
  const intro = () => gameIntro({ s, key: 'blast', emoji: '🚀', title: 'Blast', minCards: 2, play,
    text: 'Unten steht ein Wort – schieß den Asteroiden mit der richtigen Übersetzung ab!<br>Je schneller du triffst, desto mehr Punkte. Du hast 3 Leben.' });

  function play() {
    const deck = shuffle(all).map(x => ({ ...x, dir: pickDir() }));
    let lives = 3, score = 0, hits = 0, misses = 0, combo = 0, rocks = [], roundStart = 0, roundLen = 0, busy = false, raf = 0, last = 0;
    const level = () => 1 + Math.floor(hits / 5);
    setView(`${topbar('Blast', `#set/${s.id}`, '', true)}
      <div class="game-page" style="height:auto;flex:1">
        <div class="game-hud"><span id="score">0</span><span class="lvl" id="lvl">Level 1</span><span class="lives" id="lives">${hearts(3)}</span></div>
        <div class="space" id="field"><div class="ship">🚀</div></div>
        <div class="game-prompt"><div class="lbl" id="plbl"></div><div class="word" id="pword"></div><div class="fuel" id="fuel"><div></div></div></div>
      </div>`, {
      rock: el => shoot(rocks[+el.dataset.k]),
    });
    $('#app').style.height = '100dvh'; onCleanup(() => { $('#app').style.height = ''; cancelAnimationFrame(raf); });
    const field = $('#field');
    const hud = () => { $('#score').textContent = `${score} Pkt`; $('#lvl').textContent = `Level ${level()}`; $('#lives').textContent = hearts(lives); };
    hud();

    function round() {
      if (!deck.length) return finish(true);
      busy = false;
      const it = deck[0], d = qaFor(it);
      $('#plbl').textContent = `${LANGS[d.qLang]} → ${LANGS[d.aLang]}`; $('#pword').textContent = d.q;
      autoSpeak(d.q, d.qLang);
      rocks.forEach(r => r.el.remove());
      const opts = shuffle([d.a, ...distractors(all, it, it.dir, 3)]);
      const W = field.clientWidth, H = field.clientHeight - 70;
      const slots = shuffle([[0, 0], [1, 0], [0, 1], [1, 1]]);
      const speed = 18 + level() * 9;
      rocks = opts.map((o, k) => {
        const el = document.createElement('button'); el.className = 'rock'; el.dataset.act = 'rock'; el.dataset.k = k; el.textContent = o;
        field.appendChild(el);
        const w = el.offsetWidth, h = el.offsetHeight;
        const [sx, sy] = slots[k % 4];
        const x = clamp(sx * W / 2 + Math.random() * Math.max(1, W / 2 - w), 0, Math.max(0, W - w));
        const y = clamp(sy * H / 2 + Math.random() * Math.max(1, H / 2 - h), 0, Math.max(0, H - h));
        const a = Math.random() * Math.PI * 2;
        return { el, x, y, w, h, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ok: o === d.a, text: o };
      });
      roundLen = Math.max(5, 13 - level()) * 1000; roundStart = performance.now(); last = roundStart;
    }

    function loop(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const W = field.clientWidth, H = field.clientHeight - 70;
      for (const r of rocks) {
        if (r.dead) continue;
        r.x += r.vx * dt; r.y += r.vy * dt;
        if (r.x < 0) { r.x = 0; r.vx = Math.abs(r.vx); } if (r.x > W - r.w) { r.x = W - r.w; r.vx = -Math.abs(r.vx); }
        if (r.y < 0) { r.y = 0; r.vy = Math.abs(r.vy); } if (r.y > H - r.h) { r.y = H - r.h; r.vy = -Math.abs(r.vy); }
        r.el.style.transform = `translate(${r.x}px, ${r.y}px)`;
      }
      if (!busy) {
        const left = 1 - (t - roundStart) / roundLen;
        const fuel = $('#fuel'); fuel.firstChild.style.width = `${clamp(left, 0, 1) * 100}%`; fuel.classList.toggle('low', left < .3);
        if (left <= 0) miss(null);
      }
      raf = requestAnimationFrame(loop);
    }

    function laserTo(r) {
      const ship = $('.ship'), fx = field.clientWidth / 2, fy = field.clientHeight - ship.offsetHeight / 2 - 10;
      const tx = r.x + r.w / 2, ty = r.y + r.h / 2, len = Math.hypot(tx - fx, ty - fy), ang = Math.atan2(ty - fy, tx - fx);
      const l = document.createElement('div'); l.className = 'laser';
      l.style.left = `${fx}px`; l.style.top = `${fy}px`; l.style.width = `${len}px`; l.style.transform = `rotate(${ang}rad)`;
      field.appendChild(l); later(() => l.remove(), 300);
    }

    function shoot(r) {
      if (busy || !r || r.dead) return;
      busy = true; laserTo(r);
      if (r.ok) {
        const left = clamp(1 - (performance.now() - roundStart) / roundLen, 0, 1);
        combo++; hits++;
        const pts = Math.round((50 + left * 100) * level() * (combo >= 3 ? 1.5 : 1));
        score += pts; floatPoints(field, r.x + r.w / 2 - 20, r.y, `+${pts}`);
        r.dead = true; r.el.style.setProperty('--t', r.el.style.transform); r.el.classList.add('boom');
        deck.shift(); markStudied(); hud();
        later(round, 500);
      } else miss(r);
    }

    function miss(r) {
      busy = true; combo = 0; lives--; misses++; hud();
      if (r) { r.el.classList.add('wrong'); }
      rocks.forEach(x => { if (x.ok) x.el.classList.add('right'); });
      const it = deck.shift(); deck.splice(Math.min(deck.length, 3), 0, it);
      later(() => lives <= 0 ? finish(false) : round(), 1400);
    }

    function finish(won) {
      cancelAnimationFrame(raf); $('#app').style.height = '';
      gameOver({ s, key: 'blast', title: 'Blast', score, won, replay: play, stats: `${hits} Treffer · ${misses} Fehler · Level ${level()}` });
    }

    round(); raf = requestAnimationFrame(t => { last = t; loop(t); });
  }
  intro();
}

/* ============================== Gravity ============================== */
function viewGravity(id) {
  const s = getSet(id); if (!s) return go('');
  const all = s.cards.map(c => ({ c, s }));
  const intro = () => gameIntro({ s, key: 'gravity', emoji: '🌍', title: 'Gravity', minCards: 1, play,
    text: 'Asteroiden stürzen auf deinen Planeten! Tippe die Übersetzung ein, bevor sie einschlagen.<br>Bei einem Fehler musst du das richtige Wort abschreiben. Du hast 3 Leben.' });

  function play() {
    const queue = shuffle(all).map(x => ({ ...x, dir: pickDir() }));
    let lives = 3, score = 0, hits = 0, misses = 0, raf = 0, start = 0, dur = 0, rock = null, mode = 'fall', cur = null, x = 0;
    const level = () => 1 + Math.floor(hits / 4);
    const firstLang = qaFor(queue[0]).aLang;
    setView(`${topbar('Gravity', `#set/${s.id}`, '', true)}
      <div class="game-page" style="height:auto;flex:1">
        <div class="game-hud"><span id="score">0 Pkt</span><span class="lvl" id="lvl">Level 1</span><span class="lives" id="lives">${hearts(3)}</span></div>
        <form class="g-form" id="gf" autocomplete="off"><input id="gi" class="write-input" type="text" placeholder="Antwort eintippen + Enter" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" lang="${firstLang}">${accentBar(firstLang, '#gi')}</form>
        <div class="space" id="field" style="margin-bottom:12px"><div class="planet" id="planet"></div></div>
      </div>`);
    $('#app').style.height = '100dvh';
    const field = $('#field'), inp = $('#gi'), form = $('#gf');
    /* Spielfeld an sichtbare Höhe anpassen (iPhone-Tastatur) */
    const fit = () => { const vv = window.visualViewport; if (!vv) return; const top = field.getBoundingClientRect().top; field.style.flex = 'none'; field.style.height = `${Math.max(160, vv.height - top - 12)}px`; };
    if (window.visualViewport) { visualViewport.addEventListener('resize', fit); fit(); }
    onCleanup(() => { cancelAnimationFrame(raf); $('#app').style.height = ''; window.visualViewport && visualViewport.removeEventListener('resize', fit); });
    const hud = () => { $('#score').textContent = `${score} Pkt`; $('#lvl').textContent = `Level ${level()}`; $('#lives').textContent = hearts(lives); };
    inp.focus();

    function spawn() {
      if (!queue.length) return finish(true);
      cur = queue.shift(); const d = qaFor(cur);
      mode = 'fall'; inp.value = ''; inp.lang = d.aLang;
      if (rock) rock.remove(); $('.copy-box')?.remove();
      rock = document.createElement('div'); rock.className = 'rock'; rock.textContent = d.q; field.appendChild(rock);
      x = Math.random() * Math.max(1, field.clientWidth - rock.offsetWidth);
      dur = Math.max(4500, 11000 - (level() - 1) * 1100); start = performance.now();
      autoSpeak(d.q, d.qLang);
    }
    function loop(t) {
      if (mode === 'fall' && rock) {
        const ground = field.clientHeight - 30 - rock.offsetHeight;
        const p = (t - start) / dur, y = -rock.offsetHeight + p * (ground + rock.offsetHeight);
        rock.style.transform = `translate(${x}px, ${y}px)`;
        if (p >= 1) fail(true);
      }
      raf = requestAnimationFrame(loop);
    }
    function fail(impact) {
      mode = 'copy'; misses++; lives--; hud();
      const d = qaFor(cur);
      rock.style.setProperty('--t', rock.style.transform); rock.classList.add(impact ? 'boom' : 'wrong');
      if (impact) $('#planet').classList.remove('hit'), void field.offsetWidth, $('#planet').classList.add('hit');
      const box = document.createElement('div'); box.className = 'copy-box';
      box.innerHTML = `<div class="muted small">${impact ? 'Einschlag! 💥' : 'Leider falsch.'} Richtig ist:</div><div class="ans ok">${esc(d.a)}${speakBtn(d.a, d.aLang)}</div>${lives > 0 ? '<div class="small" style="margin-top:8px">Tippe es ab, um weiterzumachen.</div>' : ''}`;
      field.appendChild(box); inp.value = '';
      queue.splice(Math.min(queue.length, 3), 0, cur);
      if (lives <= 0) { mode = 'over'; later(() => finish(false), 2200); }
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = inp.value; if (!v.trim() || mode === 'over') return;
      const d = qaFor(cur), r = checkAnswer(v, d.a, d.aLang), ok = r === 'ok' || r === 'accent-ok';
      if (mode === 'copy') {
        if (ok) { queue.splice(queue.indexOf(cur), 1); queue.splice(Math.min(queue.length, 3), 0, cur); spawn(); }
        else { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
        return;
      }
      if (ok) {
        hits++; const left = clamp(1 - (performance.now() - start) / dur, 0, 1);
        const pts = Math.round((40 + left * 60) * level()); score += pts; markStudied();
        const m = rock.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px/);
        floatPoints(field, m ? +m[1] + 20 : 20, m ? Math.max(0, +m[2]) : 20, `+${pts}`);
        rock.style.setProperty('--t', rock.style.transform); rock.classList.add('boom'); const old = rock; rock = null; later(() => old.remove(), 450);
        hud(); inp.value = ''; later(spawn, 350); mode = 'wait';
      } else fail(false);
    });
    function finish(won) {
      cancelAnimationFrame(raf); $('#app').style.height = '';
      gameOver({ s, key: 'gravity', title: 'Gravity', score, won, replay: play, stats: `${hits} Wörter getroffen · ${misses} Fehler · Level ${level()}` });
    }
    spawn(); raf = requestAnimationFrame(loop);
  }
  intro();
}


/* ============================== Wortschatz-Bibliothek ============================== */
function viewLibrary() {
  const packs = typeof LIBRARY !== 'undefined' ? LIBRARY : [];
  const has = k => DB.sets.some(s => s.libKey === k);
  const count = p => p.cards.trim().split('\n').length;
  const missing = packs.filter(p => !has(p.key));
  setView(`${topbar('Wortschatz-Bibliothek', '#')}
    <main class="page">
      <div class="card form-card" style="margin-bottom:12px">
        <h2>Italienisch · Basiswortschatz Kl. 13</h2>
        <p class="muted small" style="margin-bottom:0">Thematisch nach dem Bildungsplan „Italienisch, neu beginnende Fremdsprache“ des Beruflichen Gymnasiums Baden-Württemberg (Jahrgangsstufe 2, Ziel B1). Ergänze die Sets mit den Vokabeln aus eurem Unterricht.</p>
        ${missing.length ? `<button class="btn btn-primary btn-block" data-act="addAll">${ICON.plus} Alle fehlenden hinzufügen (${missing.length})</button>` : ''}
      </div>
      ${packs.map(p => `<div class="card set-tile" style="cursor:default">
        <div class="set-tile-title">${esc(p.title)}</div>
        <p class="muted small" style="margin:0 0 10px">${esc(p.desc)}</p>
        <div class="set-tile-meta" style="margin:0;align-items:center"><span class="pill">${count(p)} Begriffe</span>
          ${has(p.key) ? '<span class="pill" style="margin-left:auto;color:var(--ok)">✓ In deinen Sets</span>' : `<button class="btn btn-primary btn-sm" style="margin-left:auto" data-act="add" data-k="${p.key}">${ICON.plus} Hinzufügen</button>`}</div>
      </div>`).join('<div style="height:12px"></div>')}
    </main>`, {
    add: t => { const p = packs.find(x => x.key === t.dataset.k); if (!p || has(p.key)) return; DB.sets.push(librarySet(p)); save(); toast('Set hinzugefügt'); render(); },
    addAll: () => { missing.forEach(p => DB.sets.push(librarySet(p))); save(); toast(`${missing.length} Sets hinzugefügt`); render(); },
  });
}
/* ============================== Einstellungen ============================== */
function viewSettings() {
  const st = DB.settings;
  const total = DB.sets.reduce((n, s) => n + s.cards.length, 0);
  setView(`${topbar('Einstellungen', '#')}
    <main class="page">
      <div class="card form-card">
        <h2>Lernen</h2>
        <div class="switch-row settings-row"><div>Antworten auf<small>Was du im Lernen-Modus eintippst</small></div>
          <select id="s-aw"><option value="term" ${st.answerWith === 'term' ? 'selected' : ''}>Begriff (Italienisch)</option><option value="def" ${st.answerWith === 'def' ? 'selected' : ''}>Definition (Deutsch)</option><option value="mixed" ${st.answerWith === 'mixed' ? 'selected' : ''}>Gemischt</option></select></div>
        <div class="switch-row"><div>Akzente streng prüfen<small>Aus: „citta“ statt „città“ zählt als richtig (mit Hinweis)</small></div><input type="checkbox" class="switch" id="s-strict" ${st.strictAccents ? 'checked' : ''}></div>
        <div class="switch-row"><div>Automatisch vorlesen<small>Italienische Wörter werden sofort vorgesprochen</small></div><input type="checkbox" class="switch" id="s-auto" ${st.autoSpeak ? 'checked' : ''}></div>
        <div class="switch-row settings-row"><div>Sprechtempo</div>
          <select id="s-rate"><option value="0.7" ${st.speechRate == 0.7 ? 'selected' : ''}>Langsam</option><option value="0.9" ${st.speechRate == 0.9 ? 'selected' : ''}>Normal</option><option value="1.05" ${st.speechRate == 1.05 ? 'selected' : ''}>Schnell</option></select></div>
        <button class="btn btn-ghost btn-block" data-act="testVoice">${ICON.speaker} Stimme testen</button>
      </div>
      <div class="card form-card" style="margin-top:16px">
        <h2>Sicherung</h2>
        <p class="muted small">Alle Sets und Lernfortschritte (${DB.sets.length} Sets, ${total} Karten) sind nur auf diesem Gerät gespeichert. Mach ab und zu eine Sicherung – z. B. in die Dateien-App oder per Mail.</p>
        <button class="btn btn-primary btn-block" data-act="export">${ICON.share} Sicherung exportieren</button>
        <button class="btn btn-ghost btn-block" data-act="import">${ICON.download} Sicherung wiederherstellen</button>
        <input type="file" id="s-file" accept=".json,application/json" hidden>
      </div>
      <div class="card form-card" style="margin-top:16px">
        <h2>Zurücksetzen</h2>
        <button class="btn btn-danger btn-block" data-act="resetProgress">Lernfortschritt zurücksetzen</button>
        <p class="muted small" style="margin-bottom:0">Sets bleiben erhalten, nur Fortschritt, Bestzeiten und Serie werden gelöscht.</p>
      </div>
      <p class="muted small" style="text-align:center;margin-top:24px">QuizLis ${APP_VERSION} · Daten bleiben auf deinem Gerät</p>
    </main>`, {
    testVoice: () => speak('Ciao! Come stai? Oggi impariamo l\'italiano.', 'it'),
    export: exportBackup,
    import: () => $('#s-file').click(),
    resetProgress: () => {
      if (!confirm('Lernfortschritt aller Sets wirklich zurücksetzen?')) return;
      DB.sets.forEach(s => { s.lastTest = null; s.cards.forEach(c => Object.assign(c, { box: 0, due: 0, seen: false, ok: 0, bad: 0 })); });
      DB.best = {}; DB.stats = { streak: 0, lastDay: null, days: {} }; save(); toast('Fortschritt zurückgesetzt'); render();
    },
  });
  $('#s-aw').addEventListener('change', e => { st.answerWith = e.target.value; save(); });
  $('#s-strict').addEventListener('change', e => { st.strictAccents = e.target.checked; save(); });
  $('#s-auto').addEventListener('change', e => { st.autoSpeak = e.target.checked; save(); });
  $('#s-rate').addEventListener('change', e => { st.speechRate = +e.target.value; save(); speak('Ciao, come stai?', 'it'); });
  $('#s-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result); const d = obj.data || obj;
        if (!Array.isArray(d.sets)) throw new Error('format');
        if (!confirm(`Sicherung mit ${d.sets.length} Sets laden? Die aktuellen Daten auf diesem Gerät werden ersetzt.`)) return;
        DB = normalizeData(d); save(); toast('Sicherung wiederhergestellt'); go('');
      } catch (err) { toast('Diese Datei ist keine gültige QuizLis-Sicherung'); }
    };
    r.readAsText(f);
  });
}

async function exportBackup() {
  const json = JSON.stringify({ app: 'QuizLis', version: APP_VERSION, exported: new Date().toISOString(), data: DB });
  const name = `QuizLis-Sicherung-${dayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'QuizLis Sicherung' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ============================== Start ============================== */
window.addEventListener('hashchange', render);
render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  const hadController = !!navigator.serviceWorker.controller; let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    if (!/learn|test|cards|match|blast|gravity|edit/.test(location.hash)) location.reload(); else toast('Update installiert – wird beim nächsten Start aktiv');
  });
  navigator.serviceWorker.register('./sw.js').then(r => r.update()).catch(() => {});
}
