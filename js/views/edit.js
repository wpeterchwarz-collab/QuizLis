import { esc, uid } from '../util.js';
import { LANGS, newCard, parseImport } from '../core.js';
import { DB, save, getSet, removeSet } from '../store.js';
import { $, $$, setView, go, topbar, toast, ICON } from '../ui.js';
import { ocrVocab, ocrErrorText } from '../ocr.js';
import { inputAttrs } from './common.js';

export function viewEdit(id) {
  const isNew = id === 'new';
  const s = isNew ? null : getSet(id);
  if (!isNew && !s) return go('');
  const draft = {
    title: s?.title || '', desc: s?.desc || '', termLang: s?.termLang || 'it', defLang: s?.defLang || 'de',
    rows: s ? s.cards.map(c => ({ id: c.id, term: c.term, def: c.def })) : [0, 1, 2].map(() => ({ id: null, term: '', def: '' })),
  };
  let showImport = isNew, importText = '', ocrBusy = false, scan = null; // scan: { pairs: [{term, def, on}], unpaired: [] }
  const filled = () => draft.rows.filter(r => r.term.trim() || r.def.trim());
  const snapshot = () => JSON.stringify([draft.title, draft.desc, draft.termLang, draft.defLang, filled()]);
  const initial = snapshot();
  const langOpts = sel => Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v}</option>`).join('');

  function sync() {
    draft.title = $('#e-title').value; draft.desc = $('#e-desc').value;
    draft.termLang = $('#e-tl').value; draft.defLang = $('#e-dl').value;
    if ($('#e-imp')) importText = $('#e-imp').value;
    if (scan) $$('.scan-row').forEach((r, i) => { const p = scan.pairs[i]; p.term = $('.s-term', r).value; p.def = $('.s-def', r).value; p.on = $('.s-on', r).checked; });
    draft.rows = $$('.edit-row').map(r => ({ id: r.dataset.id || null, term: $('.e-term', r).value, def: $('.e-def', r).value }));
  }
  const rowHtml = (r, i) => `
    <div class="card edit-row" data-id="${esc(r.id || '')}">
      <div class="edit-row-head"><span>${i + 1}</span><button class="icon-btn sm" data-act="delRow" data-i="${i}" aria-label="Karte ${i + 1} löschen">${ICON.trash}</button></div>
      <div class="edit-fields">
        <label class="field"><input class="e-term" type="text" value="${esc(r.term)}" ${inputAttrs} lang="${draft.termLang}"><span>Begriff · ${LANGS[draft.termLang]}</span></label>
        <label class="field"><input class="e-def" type="text" value="${esc(r.def)}" ${inputAttrs} lang="${draft.defLang}"><span>Definition · ${LANGS[draft.defLang]}</span></label>
      </div>
    </div>`;

  const acts = {
    leave: () => { sync(); if (snapshot() !== initial && !confirm('Änderungen verwerfen?')) return; go(isNew ? '' : `set/${s.id}`); },
    toggleImport: () => { sync(); showImport = !showImport; paint(); if (showImport) $('#e-imp')?.focus(); },
    doImport: () => {
      sync(); const rows = parseImport(importText);
      if (!rows.length) return toast('Keine Karten erkannt – prüfe das Format');
      draft.rows = filled().concat(rows);
      importText = ''; showImport = false; paint(); toast(`${rows.length} Karten übernommen`);
    },
    swapAll: () => {
      sync(); draft.rows.forEach(r => { [r.term, r.def] = [r.def, r.term]; });
      [draft.termLang, draft.defLang] = [draft.defLang, draft.termLang]; paint(); toast('Seiten getauscht');
    },
    scanSwap: () => { sync(); scan.pairs.forEach(p => { [p.term, p.def] = [p.def, p.term]; }); paint(); },
    scanAll: () => { sync(); const on = !scan.pairs.every(p => p.on); scan.pairs.forEach(p => { p.on = on; }); paint(); },
    scanCancel: () => { scan = null; paint(); },
    scanTake: () => {
      sync();
      const rows = scan.pairs.filter(p => p.on && p.term.trim() && p.def.trim()).map(p => ({ id: null, term: p.term.trim(), def: p.def.trim() }));
      if (!rows.length) return toast('Keine Karte ausgewählt');
      draft.rows = filled().concat(rows); scan = null; showImport = false; paint(); toast(`${rows.length} Karten übernommen – jetzt noch speichern`);
    },
    addRow: () => { sync(); draft.rows.push({ id: null, term: '', def: '' }); paint(true); },
    delRow: t => { sync(); draft.rows.splice(+t.dataset.i, 1); paint(); },
    save: () => {
      sync();
      const rows = draft.rows.filter(r => r.term.trim() && r.def.trim());
      if (!draft.title.trim()) { toast('Bitte gib dem Set einen Titel'); $('#e-title').focus(); return; }
      if (!rows.length) return toast('Mindestens eine Karte mit Begriff und Definition');
      const half = draft.rows.length - rows.length - draft.rows.filter(r => !r.term.trim() && !r.def.trim()).length;
      const set = s || { id: uid(), libKey: null, created: Date.now(), cards: [], lastTest: null };
      const old = new Map(set.cards.map(c => [c.id, c]));
      set.cards = rows.map(r => {
        const o = r.id && old.get(r.id);
        if (o) { o.term = r.term.trim(); o.def = r.def.trim(); return o; }  // Lernfortschritt bleibt erhalten
        return newCard(r.term.trim(), r.def.trim());
      });
      Object.assign(set, { title: draft.title.trim(), desc: draft.desc.trim(), termLang: draft.termLang, defLang: draft.defLang, updated: Date.now() });
      if (!s) DB.sets.push(set);
      save(); toast(half ? `Gespeichert – ${half} unvollständige Karte(n) weggelassen` : 'Gespeichert'); go(`set/${set.id}`);
    },
    delSet: () => {
      if (!confirm(`Set „${s.title}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;
      removeSet(s.id); toast('Set gelöscht'); go('');
    },
  };

  const scanHtml = () => {
    if (!scan) return '';
    const n = scan.pairs.filter(p => p.on).length;
    return `<div class="scan-box">
      <div class="scan-head"><b>${scan.pairs.length ? `${scan.pairs.length} Paare erkannt – bitte kurz prüfen` : 'Keine Paare erkannt'}</b>
        ${scan.pairs.length ? `<button class="btn btn-ghost btn-sm" data-act="scanSwap">${ICON.swap} Spalten tauschen</button>` : ''}</div>
      ${scan.pairs.length ? `<div class="scan-cols muted small"><button class="link" data-act="scanAll">alle</button><span>oben ${LANGS[draft.termLang]}, darunter ${LANGS[draft.defLang]}</span></div>` : ''}
      ${scan.pairs.map((p, i) => `<div class="scan-row ${p.on ? '' : 'off'}"><input type="checkbox" class="s-on" ${p.on ? 'checked' : ''} aria-label="Paar ${i + 1} übernehmen"><div class="scan-pair">
        <input class="s-term" type="text" value="${esc(p.term)}" ${inputAttrs} lang="${draft.termLang}" aria-label="Begriff ${i + 1}">
        <input class="s-def" type="text" value="${esc(p.def)}" ${inputAttrs} lang="${draft.defLang}" aria-label="Übersetzung ${i + 1}"></div></div>`).join('')}
      ${scan.unpaired.length ? `<details class="scan-rest"><summary>${scan.unpaired.length} Textstück(e) ohne Partner (z. B. Überschriften)</summary><p>${scan.unpaired.map(esc).join(' · ')}</p></details>` : ''}
      <div class="row-btns"><button class="btn btn-ghost btn-sm" data-act="scanCancel">Verwerfen</button>${scan.pairs.length ? `<button class="btn btn-primary btn-sm" data-act="scanTake">${n} Karten übernehmen</button>` : ''}</div>
    </div>`;
  };

  function paint(focusLast) {
    const y = window.scrollY;
    setView(`
      ${topbar(isNew ? 'Neues Set' : 'Set bearbeiten', '', '', { close: true, act: 'leave' })}
      <main class="page">
        <div class="card edit-head">
          <label class="field"><input id="e-title" type="text" value="${esc(draft.title)}" placeholder="z. B. Italienisch Lektion 3"><span>Titel</span></label>
          <label class="field"><input id="e-desc" type="text" value="${esc(draft.desc)}" placeholder="optional"><span>Beschreibung</span></label>
          <div class="lang-row">
            <label>Begriff<select id="e-tl">${langOpts(draft.termLang)}</select></label>
            <label>Definition<select id="e-dl">${langOpts(draft.defLang)}</select></label>
          </div>
        </div>
        <div class="edit-tools">
          <button class="btn btn-ghost btn-sm" data-act="toggleImport">${ICON.upload} Importieren / Foto</button>
          <button class="btn btn-ghost btn-sm" data-act="swapAll">${ICON.swap} Begriff ⇄ Definition</button>
        </div>
        ${showImport ? `<div class="card import-box">
          <p><b>Liste einfügen oder Foto scannen</b> – eine Karte pro Zeile. Begriff und Definition getrennt durch Tab, Bindestrich, Semikolon, = oder Komma.<br><span class="muted">Aus Quizlet (am PC): Set öffnen → ⋯ → Exportieren → Text kopieren.</span></p>
          ${scanHtml()}
          <textarea id="e-imp" placeholder="ciao	hallo&#10;la casa - das Haus&#10;mangiare; essen" ${inputAttrs}>${esc(importText)}</textarea>
          <div class="row-btns" style="align-items:center"><label class="btn btn-ghost btn-sm" style="margin-right:auto">📷 Foto scannen<input type="file" id="e-photo" accept="image/*" hidden></label><span class="muted small" id="imp-count"></span><button class="btn btn-primary btn-sm" data-act="doImport">Übernehmen</button></div>
          <p class="muted small" style="margin:10px 0 0">Tipp: Seite möglichst von oben, ohne Schatten und formatfüllend fotografieren. Mehrere Fotos nacheinander gehen auch – die Ergebnisse werden gesammelt.</p>
        </div>` : ''}
        <div id="rows">${draft.rows.map(rowHtml).join('')}</div>
        <button class="add-row" data-act="addRow">+ Karte hinzufügen</button>
        <div class="sticky-save"><button class="btn btn-primary btn-block btn-lg" data-act="save" style="margin:0">Speichern</button></div>
        ${!isNew ? `<div class="danger-zone"><button class="btn btn-danger btn-sm" data-act="delSet">${ICON.trash} Set löschen</button></div>` : ''}
      </main>`, acts);
    ['#e-tl', '#e-dl'].forEach(sel => $(sel).addEventListener('change', () => { sync(); paint(); }));
    const imp = $('#e-imp');
    if (imp) {
      const upd = () => { if (ocrBusy) return; const n = parseImport(imp.value).length; $('#imp-count').textContent = n ? `${n} Karten erkannt` : ''; };
      imp.addEventListener('input', upd); upd();
      $('#e-photo').addEventListener('change', e => runOcr(e.target.files[0], e.target));
      $$('.scan-row .s-on').forEach(cb => cb.addEventListener('change', () => {
        cb.closest('.scan-row').classList.toggle('off', !cb.checked);
        const b = $('[data-act=scanTake]'); if (b) b.textContent = `${$$('.s-on:checked').length} Karten übernehmen`;
      }));
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
      if (focusLast) { const last = $$('.edit-row').pop(); last?.scrollIntoView({ block: 'center' }); $('.e-term', last)?.focus(); }
    });
  }

  async function runOcr(file, input) {
    input.value = ''; if (!file || ocrBusy) return;
    sync(); ocrBusy = true;
    const status = txt => { const el = $('#imp-count'); if (el) el.textContent = txt; };
    try {
      const res = await ocrVocab(file, [draft.termLang, draft.defLang],
        p => status(p === -2 ? 'Foto wird aufbereitet …' : p < 0 ? 'Texterkennung wird geladen …' : `Erkenne Text … ${p} %`));
      ocrBusy = false;
      /* Mehrere Fotos nacheinander: Ergebnisse sammeln */
      const prev = scan || { pairs: [], unpaired: [] };
      scan = { pairs: prev.pairs.concat(res.pairs.map(p => ({ ...p, on: true }))), unpaired: prev.unpaired.concat(res.unpaired) };
      paint();
      $('.scan-box')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      toast(res.pairs.length ? `${res.pairs.length} Paare erkannt${res.swapped ? ' (Spalten automatisch getauscht)' : ''}` : 'Keine Paare erkannt – bitte schärferes Foto oder Liste abtippen');
    } catch (e) { ocrBusy = false; status(''); toast(ocrErrorText(e)); }
  }

  paint();
  if (isNew) $('#e-title').focus();
}
