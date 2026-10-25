import { dayKey } from '../util.js';
import { APP_VERSION } from '../core.js';
import { DB, save, replaceDB } from '../store.js';
import { $, setView, render, go, topbar, toast, speak, ICON } from '../ui.js';

export function viewSettings() {
  const st = DB.settings;
  const total = DB.sets.reduce((n, s) => n + s.cards.length, 0);
  const opt = (v, label, cur) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${label}</option>`;
  setView(`${topbar('Einstellungen', '#')}
    <main class="page">
      <div class="card form-card">
        <h2>Lernen</h2>
        <div class="switch-row settings-row"><div>Antworten auf<small>Was du im Lernen-Modus und in den Spielen eintippst</small></div>
          <select id="s-aw" aria-label="Antworten auf">${opt('term', 'Begriff (Italienisch)', st.answerWith)}${opt('def', 'Definition (Deutsch)', st.answerWith)}${opt('mixed', 'Gemischt', st.answerWith)}</select></div>
        <div class="switch-row"><label for="s-strict">Akzente streng prüfen<small>Aus: „citta“ statt „città“ zählt als richtig (mit Hinweis)</small></label><input type="checkbox" class="switch" id="s-strict" ${st.strictAccents ? 'checked' : ''}></div>
        <div class="switch-row"><label for="s-auto">Automatisch vorlesen<small>Italienische Wörter werden sofort vorgesprochen</small></label><input type="checkbox" class="switch" id="s-auto" ${st.autoSpeak ? 'checked' : ''}></div>
        <div class="switch-row settings-row"><div>Sprechtempo</div>
          <select id="s-rate" aria-label="Sprechtempo">${opt(0.7, 'Langsam', st.speechRate)}${opt(0.9, 'Normal', st.speechRate)}${opt(1.05, 'Schnell', st.speechRate)}</select></div>
        <button class="btn btn-ghost btn-block" data-act="testVoice">${ICON.speaker} Stimme testen</button>
      </div>
      <div class="card form-card" style="margin-top:16px">
        <h2>Sicherung</h2>
        <p class="muted small">Alle Sets und Lernfortschritte (${DB.sets.length} Sets, ${total} Karten) sind nur auf diesem Gerät gespeichert. Mach ab und zu eine Sicherung – z. B. in die Dateien-App oder per Mail.</p>
        <button class="btn btn-primary btn-block" data-act="export">${ICON.share} Sicherung exportieren</button>
        <button class="btn btn-ghost btn-block" data-act="import">${ICON.download} Sicherung wiederherstellen</button>
        <input type="file" id="s-file" accept=".json,application/json" hidden>
      </div>
      <div class="card form-card" style="margin-top:16px">
        <h2>Zurücksetzen</h2>
        <button class="btn btn-danger btn-block" data-act="resetProgress">Lernfortschritt zurücksetzen</button>
        <p class="muted small" style="margin-bottom:0">Sets bleiben erhalten, nur Fortschritt, Bestzeiten und Serie werden gelöscht.</p>
      </div>
      <p class="muted small" style="text-align:center;margin-top:24px">QuizLis ${APP_VERSION} · Daten bleiben auf deinem Gerät</p>
    </main>`, {
    testVoice: () => speak('Ciao! Come stai? Oggi impariamo l\'italiano.', 'it'),
    export: exportBackup,
    import: () => $('#s-file').click(),
    resetProgress: () => {
      if (!confirm('Lernfortschritt aller Sets wirklich zurücksetzen?')) return;
      DB.sets.forEach(s => { s.lastTest = null; s.cards.forEach(c => Object.assign(c, { box: 0, due: 0, seen: false, ok: 0, bad: 0 })); });
      DB.best = {}; DB.stats = { streak: 0, lastDay: null, days: {} }; save(); toast('Fortschritt zurückgesetzt'); render();
    },
  });
  $('#s-aw').addEventListener('change', e => { st.answerWith = e.target.value; save(); });
  $('#s-strict').addEventListener('change', e => { st.strictAccents = e.target.checked; save(); });
  $('#s-auto').addEventListener('change', e => { st.autoSpeak = e.target.checked; save(); });
  $('#s-rate').addEventListener('change', e => { st.speechRate = +e.target.value; save(); speak('Ciao, come stai?', 'it'); });
  $('#s-file').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const obj = JSON.parse(await f.text()); const d = obj?.data || obj;
      if (!d || !Array.isArray(d.sets)) throw new Error('format');
      if (!confirm(`Sicherung mit ${d.sets.length} Sets laden? Die aktuellen Daten auf diesem Gerät werden ersetzt.`)) return;
      replaceDB(d); toast('Sicherung wiederhergestellt'); go('');
    } catch (err) { toast('Diese Datei ist keine gültige QuizLis-Sicherung'); }
  });
}

export async function exportBackup() {
  const json = JSON.stringify({ app: 'QuizLis', version: APP_VERSION, exported: new Date().toISOString(), data: DB });
  const name = `QuizLis-Sicherung-${dayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'QuizLis Sicherung' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
