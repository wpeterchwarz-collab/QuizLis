import { esc } from '../util.js';
import { LIBRARY, librarySet, libraryCount } from '../library.js';
import { DB, save } from '../store.js';
import { setView, render, topbar, toast, ICON } from '../ui.js';

export function viewLibrary() {
  const has = k => DB.sets.some(s => s.libKey === k);
  const missing = LIBRARY.filter(p => !has(p.key));
  const add = packs => { packs.forEach(p => DB.sets.push(librarySet(p))); save(); toast(packs.length === 1 ? 'Set hinzugefügt' : `${packs.length} Sets hinzugefügt`); render(); };
  setView(`${topbar('Wortschatz-Bibliothek', '#')}
    <main class="page">
      <div class="card form-card" style="margin-bottom:12px">
        <h2>Italienisch · Basiswortschatz Kl. 13</h2>
        <p class="muted small" style="margin-bottom:0">Thematisch nach dem Bildungsplan „Italienisch, neu beginnende Fremdsprache“ des Beruflichen Gymnasiums Baden-Württemberg (Jahrgangsstufe 2, Ziel B1). Ergänze die Sets mit den Vokabeln aus eurem Unterricht.</p>
        ${missing.length ? `<button class="btn btn-primary btn-block" data-act="addAll">${ICON.plus} Alle fehlenden hinzufügen (${missing.length})</button>` : ''}
      </div>
      <div class="lib-list">${LIBRARY.map(p => `<div class="card lib-item">
        <div class="set-tile-title">${esc(p.title)}</div>
        <p class="muted small">${esc(p.desc)}</p>
        <div class="set-tile-meta"><span class="pill">${libraryCount(p)} Begriffe</span>
          ${has(p.key) ? '<span class="pill pill-ok">✓ In deinen Sets</span>' : `<button class="btn btn-primary btn-sm" data-act="add" data-k="${esc(p.key)}">${ICON.plus} Hinzufügen</button>`}</div>
      </div>`).join('')}</div>
    </main>`, {
    add: t => { const p = LIBRARY.find(x => x.key === t.dataset.k); if (p && !has(p.key)) add([p]); },
    addAll: () => add(missing),
  });
}
