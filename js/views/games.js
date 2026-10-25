/* Spiele Blast und Gravity */
import { esc, shuffle, clamp } from '../util.js';
import { LANGS, qaFor, distractors, isCorrect } from '../core.js';
import { DB, save, getSet, markStudied } from '../store.js';
import { $, setView, go, topbar, toast, later, onCleanup, speakBtn, autoSpeak, accentBar } from '../ui.js';
import { check, dir, inputAttrs } from './common.js';

function gameIntro({ s, key, emoji, title, text, minCards, play }) {
  if (s.cards.length < minCards) { toast(`Für ${title} braucht das Set mindestens ${minCards} Karten`); return go(`set/${s.id}`); }
  const best = DB.best[`${key}_${s.id}`];
  setView(`${topbar(title, `#set/${s.id}`, '', { close: true })}<main class="page done">
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
  setView(`${topbar(title, `#set/${s.id}`, '', { close: true })}<main class="page done">
    <div class="celebrate">${isBest && score ? '🏆' : won ? '🎉' : '💥'}</div>
    <h1>${isBest && score ? 'Neuer Rekord!' : won ? 'Alle Wörter geschafft!' : 'Game over'}</h1>
    <div class="big-time">${score} Punkte</div>
    <p class="muted">${stats}${!isBest && prev ? `<br>Rekord: ${prev} Punkte` : ''}</p>
    <button class="btn btn-primary btn-block btn-lg" data-act="replay">Nochmal spielen</button>
    <a class="btn btn-ghost btn-block" href="#set/${s.id}">Zurück zum Set</a></main>`, { replay });
}
const hearts = n => '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(Math.max(0, 3 - n));
const hud = `<div class="game-hud"><span id="score">0 Pkt</span><span class="lvl" id="lvl">Level 1</span><span class="lives" id="lives" aria-label="Leben">${hearts(3)}</span></div>`;
function floatPoints(field, x, y, txt) {
  const el = document.createElement('div'); el.className = 'float-pts'; el.textContent = txt;
  el.style.left = `${x}px`; el.style.top = `${y}px`; field.appendChild(el); later(() => el.remove(), 900);
}
/* Spielansicht: App auf Bildschirmhöhe fixieren (kein Scrollen während des Spiels) */
function gameShell(title, s, inner) {
  setView(`${topbar(title, `#set/${s.id}`, '', { close: true })}<div class="game-page">${hud}${inner}</div>`);
  $('#app').classList.add('in-game');
  onCleanup(() => $('#app').classList.remove('in-game'));
}
const boom = el => { el.style.setProperty('--t', el.style.transform || 'none'); el.classList.add('boom'); };

/* ============================== Blast ============================== */
export function viewBlast(id) {
  const s = getSet(id); if (!s) return go('');
  const all = s.cards.map(c => ({ c, s }));
  const intro = () => gameIntro({ s, key: 'blast', emoji: '🚀', title: 'Blast', minCards: 2, play,
    text: 'Unten steht ein Wort – schieß den Asteroiden mit der richtigen Übersetzung ab!<br>Je schneller du triffst, desto mehr Punkte. Du hast 3 Leben.' });

  function play() {
    const deck = shuffle(all).map(x => ({ ...x, dir: dir() }));
    let lives = 3, score = 0, hits = 0, misses = 0, combo = 0, rocks = [], roundStart = 0, roundLen = 0, busy = true, raf = 0, last = 0, over = false;
    const level = () => 1 + Math.floor(hits / 5);
    gameShell('Blast', s, `<div class="space" id="field"><div class="ship">🚀</div></div>
      <div class="game-prompt"><div class="lbl" id="plbl"></div><div class="word" id="pword"></div><div class="fuel" id="fuel"><div></div></div></div>`);
    const field = $('#field');
    const upd = () => { $('#score').textContent = `${score} Pkt`; $('#lvl').textContent = `Level ${level()}`; $('#lives').textContent = hearts(lives); };
    /* Treffer auf pointerdown – bewegliche Ziele würden ein „click“ oft verfehlen */
    field.addEventListener('pointerdown', e => { const el = e.target.closest('.rock'); if (el) { e.preventDefault(); shoot(rocks[+el.dataset.k]); } });
    onCleanup(() => cancelAnimationFrame(raf));

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
        const el = document.createElement('div'); el.className = 'rock'; el.dataset.k = k; el.textContent = o; el.setAttribute('role', 'button');
        field.appendChild(el);
        const w = el.offsetWidth, h = el.offsetHeight, [sx, sy] = slots[k % 4];
        const x = clamp(sx * W / 2 + Math.random() * Math.max(1, W / 2 - w), 0, Math.max(0, W - w));
        const y = clamp(sy * H / 2 + Math.random() * Math.max(1, H / 2 - h), 0, Math.max(0, H - h));
        const a = Math.random() * Math.PI * 2;
        el.style.transform = `translate(${x}px, ${y}px)`;
        return { el, x, y, w, h, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, ok: o === d.a };
      });
      roundLen = Math.max(5, 13 - level()) * 1000; roundStart = performance.now();
    }

    function loop(t) {
      if (over) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const W = field.clientWidth, H = field.clientHeight - 70;
      for (const r of rocks) {
        if (r.dead) continue;
        r.x += r.vx * dt; r.y += r.vy * dt;
        if (r.x < 0) { r.x = 0; r.vx = Math.abs(r.vx); } else if (r.x > W - r.w) { r.x = Math.max(0, W - r.w); r.vx = -Math.abs(r.vx); }
        if (r.y < 0) { r.y = 0; r.vy = Math.abs(r.vy); } else if (r.y > H - r.h) { r.y = Math.max(0, H - r.h); r.vy = -Math.abs(r.vy); }
        r.el.style.transform = `translate(${r.x}px, ${r.y}px)`;
      }
      if (!busy) {
        const left = 1 - (t - roundStart) / roundLen, fuel = $('#fuel');
        fuel.firstChild.style.width = `${clamp(left, 0, 1) * 100}%`; fuel.classList.toggle('low', left < 0.3);
        if (left <= 0) miss(null);
      }
      raf = requestAnimationFrame(loop);
    }

    function laserTo(r) {
      const fx = field.clientWidth / 2, fy = field.clientHeight - 34;
      const tx = r.x + r.w / 2, ty = r.y + r.h / 2;
      const l = document.createElement('div'); l.className = 'laser';
      l.style.left = `${fx}px`; l.style.top = `${fy}px`; l.style.width = `${Math.hypot(tx - fx, ty - fy)}px`;
      l.style.transform = `rotate(${Math.atan2(ty - fy, tx - fx)}rad)`;
      field.appendChild(l); later(() => l.remove(), 300);
    }

    function shoot(r) {
      if (busy || !r || r.dead) return;
      busy = true; laserTo(r);
      if (!r.ok) return miss(r);
      const left = clamp(1 - (performance.now() - roundStart) / roundLen, 0, 1);
      combo++; hits++;
      const pts = Math.round((50 + left * 100) * level() * (combo >= 3 ? 1.5 : 1));
      score += pts; floatPoints(field, r.x + r.w / 2 - 20, r.y, `+${pts}`);
      r.dead = true; boom(r.el);
      deck.shift(); markStudied(); upd();
      later(round, 500);
    }

    function miss(r) {
      busy = true; combo = 0; lives--; misses++; upd();
      if (r) r.el.classList.add('wrong');
      rocks.forEach(x => { if (x.ok) x.el.classList.add('right'); });
      const it = deck.shift(); deck.splice(Math.min(deck.length, 3), 0, it);  // später nochmal
      later(() => (lives <= 0 ? finish(false) : round()), 1400);
    }

    function finish(won) {
      over = true; cancelAnimationFrame(raf);
      gameOver({ s, key: 'blast', title: 'Blast', score, won, replay: play, stats: `${hits} Treffer · ${misses} Fehler · Level ${level()}` });
    }

    round(); raf = requestAnimationFrame(t => { last = t; loop(t); });
  }
  intro();
}

/* ============================== Gravity ============================== */
export function viewGravity(id) {
  const s = getSet(id); if (!s) return go('');
  const all = s.cards.map(c => ({ c, s }));
  const intro = () => gameIntro({ s, key: 'gravity', emoji: '🌍', title: 'Gravity', minCards: 1, play,
    text: 'Asteroiden stürzen auf deinen Planeten! Tippe die Übersetzung ein, bevor sie einschlagen.<br>Bei einem Fehler musst du das richtige Wort abschreiben. Du hast 3 Leben.' });

  function play() {
    const queue = shuffle(all).map(x => ({ ...x, dir: dir() }));
    /* mode: fall (Asteroid fällt) | wait (kurz nach Treffer) | copy (abschreiben) | over */
    let lives = 3, score = 0, hits = 0, misses = 0, raf = 0, start = 0, dur = 0, rock = null, mode = 'wait', cur = null, x = 0, barLang = null;
    const level = () => 1 + Math.floor(hits / 4);
    gameShell('Gravity', s, `
      <form class="g-form" id="gf" autocomplete="off"><input id="gi" class="write-input" type="text" placeholder="Antwort eintippen + Enter" ${inputAttrs} enterkeyhint="send" aria-label="Antwort"><div id="gbar"></div></form>
      <div class="space" id="field"><div class="planet" id="planet"></div></div>`);
    const field = $('#field'), inp = $('#gi'), form = $('#gf');
    const upd = () => { $('#score').textContent = `${score} Pkt`; $('#lvl').textContent = `Level ${level()}`; $('#lives').textContent = hearts(lives); };
    /* Spielfeld an die sichtbare Höhe anpassen (iPhone-Tastatur verdeckt sonst den Planeten) */
    const vv = window.visualViewport;
    const fit = () => { if (!vv) return; field.style.flex = 'none'; field.style.height = `${Math.max(160, vv.height - field.getBoundingClientRect().top - 12)}px`; };
    if (vv) { vv.addEventListener('resize', fit); fit(); }
    onCleanup(() => { cancelAnimationFrame(raf); vv?.removeEventListener('resize', fit); });
    inp.focus();

    function spawn() {
      if (!queue.length) return finish(true);
      cur = queue.shift(); const d = qaFor(cur);
      if (barLang !== d.aLang) { barLang = d.aLang; inp.lang = d.aLang; $('#gbar').innerHTML = accentBar(d.aLang, '#gi'); }
      inp.value = '';
      rock?.remove(); $('.copy-box')?.remove();
      rock = document.createElement('div'); rock.className = 'rock'; rock.textContent = d.q; field.appendChild(rock);
      x = Math.random() * Math.max(1, field.clientWidth - rock.offsetWidth);
      rock.style.transform = `translate(${x}px, ${-rock.offsetHeight}px)`;
      dur = Math.max(4500, 11000 - (level() - 1) * 1100); start = performance.now();
      mode = 'fall';
      autoSpeak(d.q, d.qLang);
    }
    function loop(t) {
      if (mode === 'over') return;
      if (mode === 'fall' && rock) {
        const ground = field.clientHeight - 44 - rock.offsetHeight;
        const p = (t - start) / dur, y = -rock.offsetHeight + p * (ground + rock.offsetHeight);
        rock.style.transform = `translate(${x}px, ${y}px)`;
        if (p >= 1) fail(true);
      }
      raf = requestAnimationFrame(loop);
    }
    function fail(impact) {
      mode = 'copy'; misses++; lives--; upd();
      const d = qaFor(cur);
      if (impact) { boom(rock); const p = $('#planet'); p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); }
      else rock.classList.add('wrong');
      const box = document.createElement('div'); box.className = 'copy-box';
      box.innerHTML = `<div class="muted small">${impact ? 'Einschlag! 💥' : 'Leider falsch.'} Richtig ist:</div><div class="ans ok">${esc(d.a)}${speakBtn(d.a, d.aLang)}</div>${lives > 0 ? '<div class="small" style="margin-top:8px">Tippe es ab, um weiterzumachen.</div>' : ''}`;
      field.appendChild(box); inp.value = '';
      queue.splice(Math.min(queue.length, 3), 0, cur);  // Wort kommt bald nochmal
      if (lives <= 0) { mode = 'over'; later(() => finish(false), 2200); }
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = inp.value;
      if (!v.trim() || mode === 'over' || mode === 'wait') return;
      const d = qaFor(cur), ok = isCorrect(check(v, d.a, d.aLang));
      if (mode === 'copy') {
        if (ok) spawn();
        else { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
        return;
      }
      if (!ok) return fail(false);
      mode = 'wait'; hits++;
      const left = clamp(1 - (performance.now() - start) / dur, 0, 1);
      const pts = Math.round((40 + left * 60) * level()); score += pts; markStudied();
      const m = rock.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px/);
      floatPoints(field, m ? +m[1] + 20 : 20, m ? Math.max(0, +m[2]) : 20, `+${pts}`);
      boom(rock); const old = rock; rock = null; later(() => old.remove(), 450);
      upd(); inp.value = ''; later(spawn, 350);
    });
    function finish(won) {
      mode = 'over'; cancelAnimationFrame(raf);
      gameOver({ s, key: 'gravity', title: 'Gravity', score, won, replay: play, stats: `${hits} Wörter getroffen · ${misses} Fehler · Level ${level()}` });
    }
    spawn(); raf = requestAnimationFrame(loop);
  }
  intro();
}
