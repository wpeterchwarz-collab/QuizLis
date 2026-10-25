import { esc, dayKey } from '../util.js';
import { cardState, isDue, currentStreak } from '../core.js';
import { DB, save } from '../store.js';
import { setView, render, go, ICON, LOGO, isStandalone, isIOS } from '../ui.js';

export function viewHome() {
  const streak = currentStreak(DB.stats);
  const dueTotal = DB.sets.reduce((n, s) => n + s.cards.filter(c => isDue(c)).length, 0);
  const today = DB.stats.days[dayKey()] || 0;
  const dueSets = DB.sets.filter(s => s.cards.some(c => isDue(c))).map(s => s.id);
  const sets = [...DB.sets].sort((a, b) => b.updated - a.updated);
  const setsHtml = sets.length ? sets.map(s => {
    const due = s.cards.filter(c => isDue(c)).length;
    const known = s.cards.filter(c => cardState(c) === 'known').length;
    const pct = s.cards.length ? Math.round(known / s.cards.length * 100) : 0;
    return `<a class="set-tile" href="#set/${s.id}"><div class="set-tile-title">${esc(s.title)}</div>
      <div class="set-tile-meta"><span class="pill">${s.cards.length} Begriffe</span>${due ? `<span class="pill pill-warn">${due} fällig</span>` : ''}${pct ? `<span class="pill">${pct}% gelernt</span>` : ''}</div>
      <div class="progress"><div style="width:${pct}%"></div></div></a>`;
  }).join('') : `<div class="empty card">Noch keine Sets.<br>Leg ein eigenes Set an oder hol dir eins aus der Bibliothek.</div>`;

  const install = !isStandalone() && !DB.settings.hideInstall ? `<div class="card install">${LOGO}<div><b>Als App installieren</b>${isIOS
    ? 'In Safari unten auf <b style="display:inline">Teilen</b> tippen und dann <b style="display:inline">„Zum Home-Bildschirm“</b> wählen. Danach immer über das App-Symbol starten.'
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
      <div class="section-head"><h2>Deine Sets</h2><div class="head-btns"><a class="btn btn-ghost btn-sm" href="#library">${ICON.cards} Bibliothek</a><a class="btn btn-primary btn-sm" href="#edit/new">${ICON.plus} Neu</a></div></div>
      <div class="set-list">${setsHtml}</div>
    </main>`, {
    hideInstall: () => { DB.settings.hideInstall = true; save(); render(); },
    reviewAll: () => go(`learn/${dueSets.join(',')}`),
  });
}
