import { esc, sizeClass } from '../util.js';
import { LANGS, STATE_TEXT, cardState, isDue } from '../core.js';
import { getSet } from '../store.js';
import { $, setView, go, topbar, ICON, speakBtn, attachSwipe } from '../ui.js';

export function viewSet(id) {
  const s = getSet(id); if (!s) return go('');
  const counts = { new: 0, learning: 0, known: 0 }; s.cards.forEach(c => counts[cardState(c)]++);
  const due = s.cards.filter(c => isDue(c)).length;
  let idx = 0, flipped = false;

  const preview = () => {
    const c = s.cards[idx];
    return `<div class="fc-stage preview"><div class="fc ${flipped ? 'flipped' : ''}" id="pv"><div class="fc-inner">
      <div class="fc-face fc-front">${speakBtn(c.term, s.termLang)}<div class="fc-text ${sizeClass(c.term)}">${esc(c.term)}</div></div>
      <div class="fc-face fc-back">${speakBtn(c.def, s.defLang)}<div class="fc-text ${sizeClass(c.def)}">${esc(c.def)}</div></div>
    </div></div></div>
    <div class="preview-nav"><button class="icon-btn" data-act="prev" aria-label="Vorherige Karte">${ICON.left}</button><span>${idx + 1} / ${s.cards.length}</span><button class="icon-btn" data-act="next" aria-label="Nächste Karte">${ICON.right}</button></div>`;
  };
  const step = d => { idx = (idx + d + s.cards.length) % s.cards.length; flipped = false; $('#pvwrap').innerHTML = preview(); bind(); };
  const bind = () => {
    const el = $('#pv'); if (!el) return;
    attachSwipe(el, { tap: () => { flipped = !flipped; el.classList.toggle('flipped', flipped); }, left: () => step(1), right: () => step(-1), fly: false });
  };
  const lt = s.lastTest;
  const modes = [['cards', ICON.cards, 'Karteikarten'], ['learn', ICON.learn, 'Lernen'], ['test', ICON.test, 'Test'], ['match', ICON.match, 'Match'], ['blast', ICON.rocket, 'Blast'], ['gravity', ICON.gravity, 'Gravity']];
  setView(`
    ${topbar('', '#', `<a class="icon-btn" href="#edit/${s.id}" aria-label="Set bearbeiten">${ICON.edit}</a>`)}
    <main class="page">
      <div class="set-head"><h1>${esc(s.title)}</h1><p class="muted small">${s.cards.length} Begriffe · ${LANGS[s.termLang]} – ${LANGS[s.defLang]}</p>${s.desc ? `<p class="muted">${esc(s.desc)}</p>` : ''}</div>
      ${s.cards.length ? `<div id="pvwrap">${preview()}</div>
      <div class="mode-grid">${modes.map(([r, ic, label]) => `<a class="mode" href="#${r}/${s.id}">${ic}${label}${r === 'learn' && due ? `<span class="badge">${due}</span>` : ''}</a>`).join('')}</div>
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
    </main>`, { prev: () => step(-1), next: () => step(1) });
  bind();
}
