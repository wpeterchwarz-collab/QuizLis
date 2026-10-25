import { esc, shuffle, clamp, fmtTime } from '../util.js';
import { LANGS, GRADE_TEXT, qaFor, distractors, gradeFor, isCorrect } from '../core.js';
import { DB, save, getSet, markStudied } from '../store.js';
import { $, $$, setView, go, topbar, bar, toast, ICON, accentBar, onCleanup } from '../ui.js';
import { check, inputAttrs } from './common.js';

const TYPE_TEXT = { tf: 'Wahr oder falsch', mc: 'Multiple Choice', write: 'Schriftlich' };
const TYPE_ORDER = { tf: 0, mc: 1, write: 2 };
let CURRENT = null;

/* Erzeugt die Fragen eines Tests (rein, ohne DOM) */
export function buildTest(all, { n, types, answerWith }) {
  return shuffle(all).slice(0, n).map((x, k) => {
    const dir = answerWith === 'mixed' ? (Math.random() < 0.5 ? 'term' : 'def') : answerWith;
    const it = { ...x, dir }, d = qaFor(it);
    const q = { type: types[k % types.length], c: x.c, s: x.s, dir, ...d, user: null };
    if (q.type === 'mc') { q.opts = shuffle([d.a, ...distractors(all, it, dir, 3)]); if (q.opts.length < 2) q.type = 'write'; }
    if (q.type === 'tf') {
      const wrong = distractors(all, it, dir, 1)[0];
      if (!wrong) q.type = 'write';
      else { q.tfTrue = Math.random() < 0.5; q.shown = q.tfTrue ? d.a : wrong; }
    }
    return q;
  }).sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
}

export function viewTestSetup(setIdsStr) {
  const pre = new Set(String(setIdsStr || '').split(','));
  const first = DB.sets.find(s => pre.has(s.id)) || DB.sets[0];
  if (!first) return go('');
  const backHref = pre.size === 1 && getSet([...pre][0]) ? `#set/${[...pre][0]}` : '#';
  const aw = DB.settings.answerWith;
  setView(`${topbar('Test einrichten', backHref, '', { close: true })}
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
        ${Object.entries(TYPE_TEXT).map(([k, v]) => `<label class="check"><input type="checkbox" name="types" value="${k}" checked><span>${v}</span></label>`).join('')}
      </div>
      <div class="form-group"><label class="label" for="t-time">Zeitlimit</label><select id="t-time">
        <option value="0">Kein Zeitlimit</option>${[5, 10, 15, 20, 30, 45].map(m => `<option value="${m}">${m} Minuten</option>`).join('')}</select></div>
      <button class="btn btn-primary btn-block btn-lg" data-act="start">Test starten</button>
    </div></main>`, { start });
  const selected = () => $$('input[name=sets]:checked').map(i => getSet(i.value)).filter(Boolean);
  const updMax = () => {
    const max = selected().reduce((n, s) => n + s.cards.length, 0), inp = $('#t-n');
    $('#t-max').textContent = `(max. ${max})`; inp.max = max;
    if (!inp.dataset.touched || +inp.value > max) inp.value = Math.min(20, max) || '';
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
    const qs = buildTest(all, { n, types, answerWith: $('#t-aw').value });
    CURRENT = { setIds: sets.map(s => s.id), qs, mins: +$('#t-time').value, start: Date.now(), done: false, backHref: sets.length === 1 ? `#set/${sets[0].id}` : '#' };
    go('testrun');
  }
}

export function gradeTest(T) {
  T.qs.forEach(q => {
    if (q.type === 'tf') q.correct = q.user !== null && q.user === q.tfTrue;
    else if (q.type === 'mc') q.correct = q.user === q.a;
    else { q.kind = check(q.user || '', q.a, q.aLang); q.correct = isCorrect(q.kind); }
  });
  T.ok = T.qs.filter(q => q.correct).length;
  T.pct = T.qs.length ? Math.round(T.ok / T.qs.length * 100) : 0;
  T.grade = gradeFor(T.pct);
  return T;
}

export function viewTestRun() {
  const T = CURRENT; if (!T) return go('');
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
    else inner = `<div class="tq-q">${esc(q.q)}</div><input class="write-input t-input" id="ti${k}" data-k="${k}" type="text" placeholder="Antwort auf ${LANGS[q.aLang]}" ${inputAttrs} lang="${q.aLang}" aria-label="Antwort ${k + 1}">${accentBar(q.aLang, '#ti' + k)}`;
    return `${sec}<div class="card tq"><div class="muted small">${k + 1} von ${n}</div>${inner}</div>`;
  }).join('');
  setView(`${topbar('Test', T.backHref, `<span class="timer" id="timer"></span>`, { close: true, act: 'leave' })}${bar(0)}
    <main class="page"><p class="muted small" id="answered" style="text-align:center;margin:8px 0 0"></p>${body}
    <button class="btn btn-primary btn-block btn-lg" data-act="submit" style="margin-top:20px">Test abgeben</button></main>`, {
    tf: t => { T.qs[+t.dataset.k].user = t.dataset.v === '1'; selectIn(t); upd(); },
    mc: t => { const q = T.qs[+t.dataset.k]; q.user = q.opts[+t.dataset.o]; selectIn(t); upd(); },
    submit: () => submit(false),
    leave: () => { if (answered() && !confirm('Test abbrechen? Deine Antworten gehen verloren.')) return; CURRENT = null; location.hash = T.backHref; },
  });
  const selectIn = t => { $$('.choice', t.closest('.tq')).forEach(b => b.classList.toggle('selected', b === t)); };
  $('main').addEventListener('input', e => { if (e.target.classList.contains('t-input')) { T.qs[+e.target.dataset.k].user = e.target.value; upd(); } });
  function upd() { const a = answered(); $('#answered').textContent = `${a} von ${n} beantwortet`; $('.bar > div').style.width = `${a / n * 100}%`; }
  upd();
  const tick = () => {
    const el = $('#timer'); if (!el || T.done) return;
    const elapsed = Date.now() - T.start;
    if (T.mins) {
      const rest = T.mins * 60000 - elapsed;
      if (rest <= 0) { el.textContent = '0:00'; toast('Zeit ist um – der Test wurde abgegeben'); submit(true); return; }
      el.textContent = fmtTime(rest); el.classList.toggle('low', rest < 60000);
    } else el.textContent = fmtTime(elapsed);
  };
  tick(); const iv = setInterval(tick, 1000); onCleanup(() => clearInterval(iv));

  function submit(force) {
    if (T.done) return;
    const open = n - answered();
    if (!force && open && !confirm(`${open} ${open === 1 ? 'Frage ist' : 'Fragen sind'} noch unbeantwortet. Trotzdem abgeben?`)) return;
    clearInterval(iv);
    gradeTest(T);
    T.qs.forEach(q => { if (!q.correct) { q.c.seen = true; q.c.box = Math.min(q.c.box, 1); q.c.due = Date.now(); } }); // Fehler sofort wiederholen
    T.done = true; T.end = Date.now();
    T.setIds.forEach(id => { const s = getSet(id); if (s) s.lastTest = { pct: T.pct, grade: T.grade, date: Date.now() }; });
    markStudied(n); save(); paintResult();
  }
}

function paintResult() {
  const T = CURRENT, n = T.qs.length, wrong = T.qs.filter(q => !q.correct);
  const yours = q => q.type === 'tf' ? (q.user === null ? '–' : q.user ? 'Wahr' : 'Falsch') : (q.user || '–');
  const right = q => q.type === 'tf' ? `${q.tfTrue ? 'Wahr' : 'Falsch'} (${esc(q.q)} = ${esc(q.a)})` : esc(q.a);
  setView(`${topbar('Testergebnis', T.backHref, '', { close: true })}<main class="page">
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
