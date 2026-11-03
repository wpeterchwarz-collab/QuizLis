import { esc, shuffle, sizeClass } from '../util.js';
import { LANGS, GOALS, qaFor, distractors, srsUpdate, pickForLearning, isCorrect, cardState } from '../core.js';
import { DB, save, getSet, markStudied } from '../store.js';
import { $, $$, setView, go, topbar, bar, ICON, speakBtn, autoSpeak, accentBar, later } from '../ui.js';
import { check, dir } from './common.js';

const PRAISE = ['Super!', 'Richtig!', 'Klasse!', 'Genau!', 'Perfetto!', 'Bravissima!'];

export function viewLearn(setIdsStr, cardIdsStr) {
  const sets = String(setIdsStr || '').split(',').map(getSet).filter(Boolean);
  if (!sets.length) return go('');
  const backHref = sets.length === 1 ? `#set/${sets[0].id}` : '#';
  const all = sets.flatMap(s => s.cards.map(c => ({ c, s })));
  if (!all.length) return go(backHref.slice(1));

  /* Lernziel: gilt pro Set; beim Wiederholen mehrerer Sets immer „langfristig“ */
  const single = sets.length === 1 ? sets[0] : null;
  const goal = single?.goal || 'long';
  const size = DB.settings.roundSize || 10;
  const goalBtn = single ? `<button class="goal-pill" data-act="goal" aria-label="Lernziel ändern">${goal === 'short' ? '⚡ Prüfung' : '⏳ Langzeit'}</button>` : '';
  if (single && cardIdsStr === 'goal') return chooseGoal(false);
  if (single && !single.goal && !cardIdsStr) return chooseGoal(true);

  let pool;
  if (cardIdsStr === 'all') pool = shuffle(all).slice(0, size);
  else if (cardIdsStr) { const ids = new Set(cardIdsStr.split(',')); pool = all.filter(x => ids.has(x.c.id)); }
  else pool = pickForLearning(all, size, Date.now(), goal);
  if (!pool.length) return goal === 'short' ? paintAllKnown() : paintNothingDue();

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
  const shell = inner => `${topbar(title(), backHref, goalBtn, { close: true })}${bar(pct())}<main class="page">${inner}</main>`;
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
    goal: () => { if (done.length && !confirm('Lernziel ändern? Die laufende Runde wird neu gestartet (bisheriger Fortschritt bleibt gespeichert).')) return; chooseGoal(false); },
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
    if (correct && it.stage >= 2) { srsUpdate(it.c, !it.err, Date.now(), goal); done.push(it); save(); }
    else queue.splice(Math.min(queue.length, correct ? 2 + Math.floor(Math.random() * 3) : 2), 0, it);
    paint();
  }

  function paintEnd() {
    const more = pickForLearning(all, 1e9, Date.now(), goal).length;
    const errs = done.filter(x => x.err).length;
    setView(`${topbar('Lernen', backHref, '', { close: true })}${bar(100)}<main class="page done">
      <div class="celebrate">🎉</div><h1>Runde geschafft!</h1>
      <p class="muted">${done.length} Begriffe gelernt${errs ? ` · ${errs} davon kommen bald wieder` : ' – alles ohne Fehler!'}</p>
      ${progressLine()}
      ${more ? `<button class="btn btn-primary btn-block btn-lg" data-act="again">Weiterlernen (${more} ${goal === 'short' ? 'noch offen' : 'warten'})</button>` : (goal === 'short' ? '<p><b>Alle Wörter sitzen!</b> 🎉</p>' : '<p><b>Für heute ist alles erledigt.</b> Morgen geht\'s weiter! ✨</p>')}
      <a class="btn btn-ghost btn-block" href="${backHref}">Fertig</a>
      <div class="done-list">${done.map(x => `<div class="card done-item"><span class="${x.err ? 'bad' : 'ok'}">${x.err ? ICON.redo : ICON.check}</span><b>${esc(x.c.term)}</b><span class="muted">${esc(x.c.def)}</span></div>`).join('')}</div>
    </main>`, { again: () => go(`learn/${setIdsStr}`) });
  }

  function progressLine() {
    if (!single) return '';
    const known = single.cards.filter(c => cardState(c) === 'known').length, n = single.cards.length;
    return `<div class="card goal-progress"><div class="progress"><div style="width:${Math.round(known / n * 100)}%"></div></div><span><b>${known} von ${n}</b> gelernt (${Math.round(known / n * 100)} %)</span></div>`;
  }

  /* Lernziel wählen – beim ersten Lernen eines Sets und jederzeit über den Knopf oben rechts */
  function chooseGoal(first) {
    const cur = single.goal;
    const opt = (key, emoji, text) => `<button class="card goal-opt ${cur === key ? 'on' : ''}" data-act="pick" data-g="${key}">
      <span class="goal-emoji">${emoji}</span><span><span class="goal-title">${GOALS[key]}</span><span class="muted small">${text}</span></span></button>`;
    setView(`${topbar('Lernen', backHref, '', { close: true })}<main class="page">
      <h1>${first ? 'Wie möchtest du lernen?' : 'Lernziel ändern'}</h1>
      <p class="muted">Für dieses Set: <b>${esc(single.title)}</b></p>
      ${opt('long', '⏳', 'Die App fragt jedes Wort in wachsenden Abständen ab (nach 1, 2, 4, 7 … Tagen). So bleibt der Wortschatz bis zum Abi hängen. Ein Wort gilt als <b>gelernt</b>, wenn du es an 3 verschiedenen Tagen gewusst hast – das dauert also bewusst ein paar Tage.')}
      ${opt('short', '⚡', 'Ohne Wartezeiten: Du lernst Runde für Runde, bis alle Wörter sitzen – ideal kurz vor einer Klassenarbeit. Ein Wort gilt als <b>gelernt</b>, sobald du es in einer Runde fehlerfrei gewusst hast.')}
      <p class="muted small">Du kannst das jederzeit ändern – oben rechts im Lernmodus oder auf der Set-Seite. Dein bisheriger Fortschritt bleibt erhalten.</p>
    </main>`, { pick: t => { single.goal = t.dataset.g; save(); go(`learn/${setIdsStr}`); } });
  }

  function paintAllKnown() {
    setView(`${topbar('Lernen', backHref, goalBtn, { close: true })}<main class="page done">
      <div class="celebrate">🏆</div><h1>Alle Wörter sitzen!</h1>
      ${progressLine()}
      <p class="muted">Vor der Prüfung nochmal alles durchgehen? Oder auf „Langfristig merken“ umstellen, damit die Wörter auch danach hängen bleiben.</p>
      <button class="btn btn-primary btn-block btn-lg" data-act="anyway">Alles nochmal üben</button>
      <a class="btn btn-ghost btn-block" href="#test/${single.id}">${ICON.test} Test machen</a>
      <button class="btn btn-ghost btn-block" data-act="goal">⏳ Auf „Langfristig merken“ umstellen</button></main>`,
    { anyway: () => go(`learn/${setIdsStr}/all`), goal: () => chooseGoal(false) });
  }

  function paintNothingDue() {
    const nexts = all.filter(x => x.c.seen).map(x => x.c.due);
    const next = nexts.length ? new Date(Math.min(...nexts)).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) : null;
    setView(`${topbar('Lernen', backHref, goalBtn, { close: true })}<main class="page done">
      <div class="celebrate">✨</div><h1>Alles erledigt!</h1>
      <p class="muted">Gerade ist nichts zur Wiederholung fällig.${next ? `<br>Nächste Wiederholung: <b>${next}</b>` : ''}</p>
      ${progressLine()}
      <button class="btn btn-primary btn-block btn-lg" data-act="anyway">Trotzdem üben</button>
      ${single ? '<button class="btn btn-ghost btn-block" data-act="goal">⚡ Prüfung steht an? Auf „Pauken“ umstellen</button>' : ''}
      <a class="btn btn-ghost btn-block" href="${backHref}">Zurück</a></main>`, { anyway: () => go(`learn/${setIdsStr}/all`), goal: () => chooseGoal(false) });
  }
  paint();
}
