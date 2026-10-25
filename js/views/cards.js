import { esc, shuffle, sizeClass } from '../util.js';
import { LANGS } from '../core.js';
import { DB, save, getSet, markStudied } from '../store.js';
import { $, setView, go, topbar, bar, toast, ICON, speakBtn, autoSpeak, attachSwipe } from '../ui.js';

export function viewCards(id, onlyIds) {
  const s = getSet(id); if (!s || !s.cards.length) return go(s ? `set/${id}` : '');
  const ids = onlyIds ? new Set(onlyIds.split(',')) : null;
  const base = ids ? s.cards.filter(c => ids.has(c.id)) : [...s.cards];
  if (!base.length) return go(`cards/${id}`);
  let deck = [...base], i = 0, known = [], unknown = [], shuffled = false;
  const side = (c, which) => which === 'term' ? { t: c.term, l: s.termLang } : { t: c.def, l: s.defLang };
  const restart = cards => { deck = shuffled ? shuffle(cards) : [...cards]; i = 0; known = []; unknown = []; paint(); };

  function paint() {
    if (i >= deck.length) return paintDone();
    const c = deck[i], fr = DB.settings.cardFront, f = side(c, fr), b = side(c, fr === 'term' ? 'def' : 'term');
    let flipped = false;
    setView(`
      ${topbar(`${i + 1} / ${deck.length}`, `#set/${s.id}`, `<button class="icon-btn ${shuffled ? 'on' : ''}" data-act="shuffle" aria-label="Mischen">${ICON.shuffle}</button>`, { close: true })}
      ${bar(i / deck.length * 100)}
      <main class="page fc-page">
        <div class="fc-counts"><span class="cnt bad" aria-label="Noch lernen">${unknown.length}</span><span class="muted small">Tippen zum Umdrehen</span><span class="cnt ok" aria-label="Kann ich">${known.length}</span></div>
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
      shuffle: () => { shuffled = !shuffled; toast(shuffled ? 'Gemischt – von vorne' : 'Originalreihenfolge'); restart(base); },
    });
    const el = $('#fc');
    attachSwipe(el, {
      tap: () => { flipped = !flipped; el.classList.toggle('flipped', flipped); if (flipped) autoSpeak(b.t, b.l); },
      left: () => answer(false), right: () => answer(true),
    });
    autoSpeak(f.t, f.l);
  }
  function answer(k) { if (i >= deck.length) return; (k ? known : unknown).push(deck[i]); i++; markStudied(); paint(); }
  function paintDone() {
    setView(`
      ${topbar('Karteikarten', `#set/${s.id}`, '', { close: true })}
      <main class="page done">
        <div class="celebrate">${unknown.length ? '💪' : '🎉'}</div>
        <h1>${unknown.length ? 'Gut gemacht!' : 'Perfekt – alles gewusst!'}</h1>
        <p class="muted">Kann ich: <b>${known.length}</b> · Noch lernen: <b>${unknown.length}</b></p>
        ${unknown.length ? `<button class="btn btn-primary btn-block btn-lg" data-act="again">Unsichere Karten wiederholen (${unknown.length})</button>
        <button class="btn btn-ghost btn-block" data-act="learn">${ICON.learn} Im Lernen-Modus festigen</button>` : ''}
        <button class="btn btn-ghost btn-block" data-act="restart">${ICON.redo} Alle Karten von vorne</button>
        <a class="btn btn-ghost btn-block" href="#set/${s.id}">Zurück zum Set</a>
      </main>`, {
      again: () => restart(unknown),
      learn: () => go(`learn/${s.id}/${unknown.map(c => c.id).join(',')}`),
      restart: () => restart(base),
    });
  }
  paint();
}
