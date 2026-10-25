import { esc, shuffle, sizeClass } from '../util.js';
import { LANGS, qaFor, distractors, srsUpdate, pickForLearning, isCorrect } from '../core.js';
import { save, getSet, markStudied } from '../store.js';
import { $, $$, setView, go, topbar, bar, ICON, speakBtn, autoSpeak, accentBar, later } from '../ui.js';
import { check, dir } from './common.js';

const PRAISE = ['Super!', 'Richtig!', 'Klasse!', 'Genau!', 'Perfetto!', 'Bravissima!'];

export function viewLearn(setIdsStr, cardIdsStr) {
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

  /* Jede Karte: Stufe 0 = Multiple Choice, Stufe 1 = selbst schreiben, Stufe 2 = geschafft */
  const canMC = all.length >= 2;
  const items = shuffle(pool).map(x => ({ ...x, stage: (!canMC || x.c.box >= 2) ? 1 : 0, err: false, prevErr: false, dir: dir() }));
  const total = items.length, done = [], queue = [...items];
  let locked = false;
  const cur = () => queue[0];
  const curD = () => qaFor(queue[0]);
  const pct = () => items.reduce((n, it) => n + Math.min(it.stage, 2), 0) / (total * 2) * 100;
  const title = () => `Lernen · ${done.length}/${total}`;
  const qHead = d => `<div class="q-head"><span class="muted small" id="q-lang">${LANGS[d.qLang]}</span><span id="q-speak">${speakBtn(d.q, d.qLang)}</span></div><div class="q-text ${sizeClass(d.q)}" id="q-text">${esc(d.q)}</div>`;
  const shell = inner => `${topbar(title(), backHref, '', { close: true })}${bar(pct())}<main class="page">${inner}</main>`;
  const acts = {
    mc: t => {
      if (locked) return; locked = true;
      const it = cur(), d = curD(), k = +t.dataset.k, ok = it.opts[k] === d.a;
      $$('.mc-opt').forEach((b, j) => b.classList.add(it.opts[j] === d.a ? 'correct' : (j === k ? 'wrong' : 'dim')));
      result(ok, d);
    },
    dunno: () => { if (locked) return; locked = true; $('#wi')?.blur(); result(false, curD(), '', 'wrong'); },
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
        <div id="fb" aria-live="polite"></div></div>`), acts);
    } else if ($('#wi') && $('#wi').dataset.lang === d.aLang) {
      /* Schreibansicht weiterverwenden – so bleibt die iPhone-Tastatur offen */
      const inp = $('#wi');
      $('.topbar-title').textContent = title(); $('.bar > div').style.width = `${pct()}%`;
      $('#q-lang').textContent = LANGS[d.qLang]; $('#q-speak').innerHTML = speakBtn(d.q, d.qLang);
      const qt = $('#q-text'); qt.textContent = d.q; qt.className = `q-text ${sizeClass(d.q)}`;
      $('#fb').innerHTML = ''; $('#wf .row-btns').hidden = false;
      inp.readOnly = false; inp.value = ''; inp.focus();
    } else {
      setView(shell(`<div class="card learn-card">${qHead(d)}
        <div class="q-instr">Schreib die Antwort auf ${LANGS[d.aLang]}</div>
        <form id="wf" autocomplete="off"><input id="wi" class="write-input" type="text" placeholder="Antwort eingeben" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" lang="${d.aLang}" data-lang="${d.aLang}" aria-label="Antwort">
        ${accentBar(d.aLang, '#wi')}
        <div class="row-btns"><button type="button" class="btn btn-ghost" data-act="dunno">Weiß ich nicht</button><button type="submit" class="btn btn-primary">Antworten</button></div></form>
        <div id="fb" aria-live="polite"></div></div>`), acts);
      const w = $('#wi'); w.focus();
      $('#wf').addEventListener('submit', e => {
        e.preventDefault();
        if (locked) { if ($('[data-act=next]')) advance(false); return; }
        const v = w.value; if (!v.trim()) { w.focus(); return; }
        locked = true;
        const dd = curD(), r = check(v, dd.a, dd.aLang), ok = isCorrect(r);
        if (!ok) { w.readOnly = true; w.blur(); }
        result(ok, dd, v, r);
      });
    }
    autoSpeak(d.q, d.qLang);
  }

  function result(ok, d, user = null, kind = null) {
    const it = cur();
    const btns = $('#wf .row-btns'); if (btns) btns.hidden = true;
    if (ok) {
      it.stage++; markStudied();
      const accentHint = kind === 'accent-ok' ? `<div>Richtig – achte aber auf die Akzente:</div><div class="ans ok">${esc(d.a)}${speakBtn(d.a, d.aLang)}</div>` : '';
      $('#fb').innerHTML = `<div class="fb fb-ok"><div class="fb-title">${PRAISE[Math.floor(Math.random() * PRAISE.length)]} ✓</div>${accentHint}</div>`;
      autoSpeak(d.a, d.aLang);
      later(() => advance(true), kind === 'accent-ok' ? 2000 : 900);
    } else {
      it.prevErr = it.err; it.err = true;
      const titleTxt = { typo: 'Fast richtig – kleiner Tippfehler?', accent: 'Achte auf die Akzente!', article: 'Denk an den Artikel!' }[kind]
        || (user === null ? 'Nicht ganz – das lernst du noch!' : 'Noch nicht ganz – merk es dir!');
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
    else queue.splice(Math.min(queue.length, correct ? 2 + Math.floor(Math.random() * 3) : 2), 0, it);
    paint();
  }

  function paintEnd() {
    const more = pickForLearning(all).length;
    const errs = done.filter(x => x.err).length;
    setView(`${topbar('Lernen', backHref, '', { close: true })}${bar(100)}<main class="page done">
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
    setView(`${topbar('Lernen', backHref, '', { close: true })}<main class="page done">
      <div class="celebrate">✨</div><h1>Alles erledigt!</h1>
      <p class="muted">Gerade ist nichts zur Wiederholung fällig.${next ? `<br>Nächste Wiederholung: <b>${next}</b>` : ''}</p>
      <button class="btn btn-primary btn-block btn-lg" data-act="anyway">Trotzdem üben</button>
      <a class="btn btn-ghost btn-block" href="${backHref}">Zurück</a></main>`, { anyway: () => go(`learn/${setIdsStr}/all`) });
  }
  paint();
}
