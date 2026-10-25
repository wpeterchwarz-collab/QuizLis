import { esc, shuffle } from '../util.js';
import { uniquePairs } from '../core.js';
import { DB, save, getSet, markStudied } from '../store.js';
import { $, setView, go, topbar, toast, later, onCleanup } from '../ui.js';

const fmt = t => `${t.toFixed(1).replace('.', ',')} s`;

export function viewMatch(id) {
  const s = getSet(id); if (!s) return go('');
  if (uniquePairs(s.cards, 2).length < 2) { toast('Für Match braucht das Set mindestens 2 verschiedene Karten'); return go(`set/${id}`); }

  function intro() {
    const best = DB.best[id];
    setView(`${topbar('Match', `#set/${s.id}`, '', { close: true })}<main class="page done">
      <div class="celebrate">⚡</div><h1>Bereit fürs Match?</h1>
      <p class="muted">Ordne alle Begriffe so schnell wie möglich ihren Definitionen zu.<br>Jeder Fehler kostet 1 Sekunde.</p>
      ${best ? `<p>Deine Bestzeit: <b>${fmt(best)}</b></p>` : ''}
      <button class="btn btn-primary btn-block btn-lg" data-act="play">Spiel starten</button></main>`, { play });
  }
  function play() {
    const picked = uniquePairs(s.cards, 6);
    const tiles = shuffle(picked.flatMap(c => [{ cid: c.id, text: c.term }, { cid: c.id, text: c.def }]));
    let sel = null, left = picked.length, penalty = 0, busy = false; const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000 + penalty;
    setView(`${topbar('Match', `#set/${s.id}`, '', { close: true })}<main class="page">
      <div class="match-top"><span class="match-timer" id="mt">0,0 s</span><span id="pen"></span></div>
      <div class="match-grid">${tiles.map((t, k) => `<button class="tile ${t.text.length > 45 ? 'xs' : t.text.length > 22 ? 'sm' : ''}" data-act="tile" data-k="${k}">${esc(t.text)}</button>`).join('')}</div>
      </main>`, {
      tile: el => {
        if (busy || el.classList.contains('matched')) return;
        const k = +el.dataset.k;
        if (sel === null) { sel = k; el.classList.add('sel'); return; }
        if (sel === k) { sel = null; el.classList.remove('sel'); return; }
        const a = $(`.tile[data-k="${sel}"]`), b = el;
        sel = null; a.classList.remove('sel');
        if (tiles[+a.dataset.k].cid === tiles[k].cid) {
          a.classList.add('matched'); b.classList.add('matched'); left--;
          later(() => { a.classList.add('gone'); b.classList.add('gone'); }, 450);
          if (!left) finish();
        } else {
          busy = true; penalty += 1; a.classList.add('wrong'); b.classList.add('wrong');
          $('#pen').innerHTML = '<span class="penalty">+1 s</span>';
          later(() => { a.classList.remove('wrong'); b.classList.remove('wrong'); busy = false; }, 450);
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
      later(() => setView(`${topbar('Match', `#set/${s.id}`, '', { close: true })}<main class="page done">
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
