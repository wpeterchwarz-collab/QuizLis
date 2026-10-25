/* Oberfläche: Router, Ansichten-Wechsel, Icons, Sprachausgabe, Gesten. */
import { esc, clamp } from './util.js';
import { SPEECH, ACCENTS } from './core.js';
import { DB } from './store.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
export const ICON = {
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
export const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#4255ff"/><rect x="13" y="13" width="29" height="37" rx="5" fill="#fff" opacity=".45" transform="rotate(-11 27 31)"/><rect x="20" y="14" width="30" height="38" rx="5" fill="#fff"/><rect x="25" y="22" width="19" height="4" rx="2" fill="#4255ff"/><rect x="25" y="30" width="13" height="4" rx="2" fill="#c5cbff"/><rect x="25" y="41" width="6.7" height="6" rx="1.2" fill="#12a26c"/><rect x="31.7" y="41" width="6.6" height="6" fill="#e3e6ef"/><rect x="38.3" y="41" width="6.7" height="6" rx="1.2" fill="#e8524a"/></svg>`;

let toastTimer = 0;
export function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- Sprachausgabe ---------- */
export const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
let voices = [];
if (hasSpeech) { const lv = () => { try { voices = speechSynthesis.getVoices(); } catch (e) { /* */ } }; lv(); speechSynthesis.onvoiceschanged = lv; }
export function stopSpeech() { if (hasSpeech) try { speechSynthesis.cancel(); } catch (e) { /* */ } }
export function speak(text, lang) {
  if (!hasSpeech || !text) return;
  try {
    const code = SPEECH[lang] || 'it-IT', lc = code.toLowerCase();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\([^)]*\)/g, ' ').replace(/\s*\/\s*/g, ', '));
    u.lang = code; u.rate = DB.settings.speechRate || 0.9;
    const v = voices.find(x => x.lang.toLowerCase().replace('_', '-') === lc) || voices.find(x => x.lang.toLowerCase().startsWith(lc.slice(0, 2)));
    if (v) u.voice = v;
    /* iOS verschluckt Ausgaben direkt nach cancel() – kurz warten */
    if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(() => speechSynthesis.speak(u), 80); }
    else speechSynthesis.speak(u);
  } catch (e) { /* */ }
}
export const speakBtn = (t, l) => hasSpeech ? `<button class="speak" type="button" data-act="speak" data-t="${esc(t)}" data-l="${esc(l)}" aria-label="Vorlesen">${ICON.speaker}</button>` : '';
export const autoSpeak = (t, l) => { if (DB.settings.autoSpeak && l !== 'de') speak(t, l); };

/* ---------- Ansichten & Router ---------- */
let actions = {}, cleanups = [], viewToken = 0;
const routes = {};
export const registerRoutes = map => Object.assign(routes, map);
/* setTimeout, das nach einem Seitenwechsel nicht mehr feuert */
export function later(fn, ms) { const tok = viewToken; return setTimeout(() => { if (tok === viewToken) fn(); }, ms); }
export const onCleanup = fn => cleanups.push(fn);
export function setView(html, acts = {}) { actions = acts; $('#app').innerHTML = html; }
export const currentActions = () => actions;
export function go(h) { if (location.hash.replace(/^#/, '') === h) render(); else location.hash = h; }
export function render() {
  viewToken++;
  cleanups.forEach(f => { try { f(); } catch (e) { /* */ } });
  cleanups = []; actions = {}; stopSpeech();
  let name = '', args = [];
  try { [name, ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent); } catch (e) { name = ''; args = []; }
  (routes[name] || routes[''])(...args);
  window.scrollTo(0, 0);
}
export function topbar(title, backHref = '#', right = '', { close = false, act = '' } = {}) {
  const icon = close ? ICON.close : ICON.back;
  const back = act ? `<button class="icon-btn" data-act="${act}" aria-label="Zurück">${icon}</button>` : `<a class="icon-btn" href="${backHref}" aria-label="Zurück">${icon}</a>`;
  return `<header class="topbar">${back}<div class="topbar-title">${esc(title)}</div><div class="topbar-right">${right}</div></header>`;
}
export const bar = pct => `<div class="bar"><div style="width:${clamp(pct, 0, 100)}%"></div></div>`;
export const accentBar = (lang, forSel) => (ACCENTS[lang] || []).length
  ? `<div class="accent-bar" data-for="${forSel}">${ACCENTS[lang].map(a => `<button type="button" tabindex="-1">${a}</button>`).join('')}</div>` : '';

export function initUI() {
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    if (t.dataset.act === 'speak') { e.preventDefault(); e.stopPropagation(); speak(t.dataset.t, t.dataset.l); return; }
    const f = actions[t.dataset.act];
    if (f) { e.preventDefault(); f(t, e); }
  });
  /* Akzent-Tasten: Zeichen einfügen, ohne dem Eingabefeld den Fokus (und dem iPhone die Tastatur) zu nehmen */
  document.addEventListener('pointerdown', e => { if (e.target.closest('.accent-bar button')) e.preventDefault(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('.accent-bar button'); if (!b) return;
    const inp = $(b.closest('.accent-bar').dataset.for); if (!inp || inp.readOnly) return;
    const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? inp.value.length;
    inp.setRangeText(b.textContent, s, en, 'end'); inp.focus(); inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  window.addEventListener('hashchange', render);
}

/* ---------- Wisch-Gesten (Karteikarten) ---------- */
export function attachSwipe(el, { tap, left, right, fly = true }) {
  let x0 = null, y0 = 0, dx = 0, moved = false;
  const reset = () => { el.style.transform = ''; el.style.setProperty('--ok-o', 0); el.style.setProperty('--bad-o', 0); };
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('.speak')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false; el.style.transition = 'none';
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* */ }
  });
  el.addEventListener('pointermove', e => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 8 || Math.abs(e.clientY - y0) > 8) moved = true;
    el.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
    el.style.setProperty('--ok-o', clamp(dx / 100, 0, 1)); el.style.setProperty('--bad-o', clamp(-dx / 100, 0, 1));
  });
  el.addEventListener('pointerup', () => {
    if (x0 === null) return; x0 = null; el.style.transition = '';
    if (!moved) { reset(); tap?.(); return; }
    const fn = dx > 90 ? right : dx < -90 ? left : null;
    if (!fn) return reset();
    if (!fly) { reset(); fn(); return; }
    el.style.transform = `translateX(${dx > 0 ? '' : '-'}120vw) rotate(${dx > 0 ? 18 : -18}deg)`;
    el.style.pointerEvents = 'none';
    later(fn, 180);
  });
  el.addEventListener('pointercancel', () => { x0 = null; el.style.transition = ''; reset(); });
}
