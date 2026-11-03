/* Ordnet erkannten Text eines Vokabel-Fotos zu Paaren (Begriff ↔ Übersetzung).
   Reine Funktion ohne DOM – arbeitet nur mit den Wortpositionen der Texterkennung und ist dadurch testbar.

   Vorgehen:
   1. Wörter einsammeln, Störzeichen und unsichere Mini-Wörter verwerfen
   2. Schräglage des Fotos aus den Zeilen schätzen und herausrechnen
   3. Zeilen an großen Lücken in Abschnitte teilen, Abschnitte nach linker Kante zu Spalten bündeln
   4. Per Sprach-Erkennung die Begriff- und die Übersetzungsspalte wählen (Beispielsatz-Spalten werden übersprungen)
   5. Abschnitte beider Spalten nach Höhe zuordnen, umbrochene Zeilen anhängen */

const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const SEP = /^[-–—=:]$/;
const JUNK = /^[|¦‘’'"“”„«»_~`^°•·*#=+<>()[\]{}\\/.,:;!?-]+$/;
const cleanText = t => t.replace(/[’‘`´]/g, "'").replace(/^[|¦_~•·*#\s]+|[|¦_~•·*#\s]+$/g, '').replace(/\s+/g, ' ').trim();

/* ---------- Spracherkennung (grob, für Italienisch/Deutsch optimiert, für andere Sprachen neutral) ---------- */
const WORDS = {
  it: new Set('il lo la i gli le un uno una di del della dei delle degli da in con su per tra fra che e è non ma anche come più molto si mi ti ci vi ha ho sono essere avere fare'.split(' ')),
  de: new Set('der die das den dem des ein eine einen einem einer und oder nicht zu mit von für auf ist sind sein haben sich auch als wie im am beim zum zur'.split(' ')),
  fr: new Set('le la les un une des de du et est ne pas que qui pour avec dans sur au aux'.split(' ')),
  es: new Set('el la los las un una unos unas de del y es no que en con por para su al'.split(' ')),
  en: new Set('the a an of and to is are in on for with not be have this that'.split(' ')),
};
const CHARS = { it: /[àèéìòù]/g, de: /[äöüß]/g, fr: /[âçêëîïôûœ]/g, es: /[ñáíóú¿¡]/g, en: /(?!)/g };
export function langScore(text, lang) {
  const tokens = text.toLowerCase().replace(/^l'/, 'la ').split(/[\s,;/()]+/).filter(t => /\p{L}/u.test(t));
  if (!tokens.length || !WORDS[lang]) return 0;
  let s = 0;
  for (const t of tokens) {
    if (WORDS[lang].has(t)) s += 2;
    s += ((t.match(CHARS[lang]) || []).length) * 1.5;
    if (lang === 'it') { if (/[aeiou]$/.test(t)) s += 0.6; if (/(gli|gn|zz|cch|ggi|zion)/.test(t)) s += 0.8; if (/[bcdfghjkmpqrstvwxz]$/.test(t) && t.length > 2) s -= 0.6; }
    if (lang === 'de') { if (/(sch|ch|ung|keit|heit|lich|ig)$|sch|ck|tz|ei|ie/.test(t)) s += 0.7; if (/[bdfgklmnprstzh]$/.test(t)) s += 0.3; }
  }
  if (lang === 'de') s += (text.match(/(?:^|\s)\p{Lu}\p{Ll}{2,}/gu) || []).length * 0.4; // Großgeschriebene Substantive
  return s / tokens.length;
}
/* Beispielsätze: mehrere Wörter, großer Anfangsbuchstabe, Satzzeichen am Ende */
const sentenceness = text => (/^\p{Lu}/u.test(text) && /[.?!]$/.test(text) && text.split(' ').length >= 3) ? 1 : 0;

/* ---------- Typische Lesefehler je Sprache korrigieren ---------- */
const IT_ACCENTED = Object.fromEntries(('città università società libertà età verità qualità quantità attività possibilità realtà difficoltà novità felicità pubblicità '
  + 'identità comunità opportunità nazionalità curiosità tranquillità varietà caffè lunedì martedì mercoledì giovedì venerdì '
  + 'perché poiché benché finché affinché purché sicché cosicché più già così però può cioè giù ciò laggiù quaggiù').split(' ').map(w => [w.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), w]));
export function fixLetters(text, lang) {
  let t = text;
  if (lang === 'it') {
    t = t.replace(/ä/g, 'à').replace(/ö/g, 'ò').replace(/ü/g, 'ù').replace(/ë/g, 'è').replace(/Ä/g, 'À');
    t = t.replace(/\bII\b/g, 'Il').replace(/(^|\s)[1I|]'(?=[aeiouhAEIOUH])/g, "$1l'");
    t = t.replace(/\p{L}+/gu, w => { const r = IT_ACCENTED[w.toLowerCase()]; return r && !/[àèéìòù]/.test(w) ? (w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r) : w; });
  }
  if (lang === 'de') {
    t = t.replace(/à|á|â/g, 'ä').replace(/ò|ó|ô/g, 'ö').replace(/ù|ú|û|ii(?=\p{Ll})/gu, 'ü').replace(/(\p{Ll})B(?=\p{Ll}|\b)/gu, '$1ß');
  }
  return t;
}

/* ---------- Hauptfunktion ---------- */
export function pairsFromOcr(data, { termLang = 'it', defLang = 'de' } = {}) {
  const lines = (data?.lines || []).map(l => (l.words || [])
    .map(w => ({ text: cleanText(w.text || ''), conf: w.confidence ?? 90, ...w.bbox }))
    .filter(w => w.text && (SEP.test(w.text) || (!JUNK.test(w.text) && /\p{L}|\d/u.test(w.text) && !(w.text.length <= 2 && w.conf < 55) && w.conf >= 25)))
    .sort((a, b) => a.x0 - b.x0)).filter(l => l.length);
  const words = lines.flat();
  if (!words.length) return { pairs: [], unpaired: [], swapped: false };
  const h = median(words.map(w => w.y1 - w.y0)) || 20;
  const pageW = Math.max(...words.map(w => w.x1)) - Math.min(...words.map(w => w.x0)) || 1;

  /* 2. Schräglage: Steigung der Wortmitten innerhalb einer Zeile */
  const slopes = [];
  for (const l of lines) for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], dx = (b.x0 + b.x1 - a.x0 - a.x1) / 2;
    if (dx > h) slopes.push(((b.y0 + b.y1) - (a.y0 + a.y1)) / 2 / dx);
  }
  const slope = Math.max(-0.15, Math.min(0.15, median(slopes)));
  const yOf = (x, y) => y - slope * x;

  /* 3. Abschnitte (zusammenhängende Wortgruppen) */
  const segs = [];
  for (const l of lines) {
    /* Zeile mit Trennstrich („casa – Haus“) ist ein Eintrag und wird nicht an Lücken zerteilt */
    if (l.length > 2 && l.slice(1, -1).some(w => SEP.test(w.text))) { segs.push(l); continue; }
    let cur = [l[0]];
    for (let i = 1; i < l.length; i++) {
      if (l[i].x0 - l[i - 1].x1 > 1.4 * h) { segs.push(cur); cur = []; }
      cur.push(l[i]);
    }
    segs.push(cur);
  }
  const S = segs.map(ws => {
    const x0 = Math.min(...ws.map(w => w.x0)), x1 = Math.max(...ws.map(w => w.x1));
    const y0 = Math.min(...ws.map(w => yOf(w.x0, w.y0))), y1 = Math.max(...ws.map(w => yOf(w.x0, w.y1)));
    const text = ws.map(w => w.text).join(' ').replace(/(\p{L})([–—=])(?=\s|$)/gu, '$1 $2').replace(/(^|\s)([–—=])(?=\p{L})/gu, '$1$2 ').replace(/^[-–—=:]\s*|\s*[-–—=:]$/g, '');
    return { text, x0, x1, y0, y1, yc: (y0 + y1) / 2 };
  }).filter(s => /\p{L}{2,}/u.test(s.text));

  /* Vokabelheft-Stil: „casa - Haus“ in einer Zeile → direkt trennen */
  const sepRe = /\s[-–—=:]\s|\t|\s;\s/;
  const sepPairs = S.filter(s => sepRe.test(s.text));
  if (sepPairs.length >= Math.max(2, S.length * 0.5)) {
    const pairs = sepPairs.map(s => { const [t, ...d] = s.text.split(sepRe); return { term: t.trim(), def: d.join(', ').trim() }; }).filter(p => p.term && p.def);
    return orient(pairs, S.filter(s => !sepRe.test(s.text)).map(s => s.text), termLang, defLang);
  }

  /* Spalten über die linke Kante bündeln */
  const sorted = [...S].sort((a, b) => a.x0 - b.x0);
  const cols = [];
  for (const s of sorted) {
    const c = cols[cols.length - 1];
    if (c && s.x0 - c.maxX0 < Math.max(3 * h, pageW * 0.06)) { c.segs.push(s); c.maxX0 = s.x0; } else cols.push({ segs: [s], maxX0: s.x0 });
  }
  const big = Math.max(...cols.map(c => c.segs.length));
  const C = cols.filter(c => c.segs.length >= Math.max(2, big * 0.3));
  const leftovers = cols.filter(c => !C.includes(c)).flatMap(c => c.segs.map(s => s.text));
  if (C.length < 2) {
    /* nur eine Spalte: jede Zeile an ihrer größten Lücke teilen (alte Methode) */
    return orient([], S.map(s => s.text), termLang, defLang);
  }

  /* 4. Begriff- und Übersetzungsspalte wählen */
  C.forEach((c, i) => {
    const txt = c.segs.map(s => s.text);
    c.idx = i;
    c.sent = txt.filter(t => sentenceness(t)).length / txt.length;
    c.score = lang => median(txt.map(t => langScore(t, lang)));
  });
  let best = null;
  for (const a of C) for (const b of C) {
    if (a === b) continue;
    /* a = Begriff, b = Übersetzung; Beispielsatz-Spalten und große Abstände abwerten, links→rechts bevorzugen */
    const v = a.score(termLang) - a.score(defLang) + b.score(defLang) - b.score(termLang) - 1.5 * (a.sent + b.sent) + (a.idx < b.idx ? 0.05 : 0);
    if (!best || v > best.v) best = { v, a, b };
  }
  /* Ohne klares Sprachsignal: linke Spalte = Begriff, rechte = Übersetzung (Beispielsätze ausgenommen) */
  if (termLang === defLang || Math.abs(best.v) < 0.1) {
    const plain = C.filter(c => c.sent < 0.5);
    const L = plain[0] || C[0], R = plain[plain.length - 1] || C[C.length - 1];
    best = { a: L, b: R === L ? C[C.length - 1] : R };
  }
  const T = best.a, D = best.b;
  const unpaired = [...leftovers, ...C.filter(c => c !== T && c !== D).flatMap(c => c.segs.filter(s => !sentenceness(s.text)).map(s => s.text))];

  /* 5. Zeilen zuordnen. Ein Abschnitt ohne Partner direkt unter dem vorigen derselben Spalte ist ein Zeilenumbruch. */
  const entries = [];
  const byY = arr => [...arr].sort((a, b) => a.yc - b.yc);
  const tSegs = byY(T.segs), dSegs = byY(D.segs);
  const used = new Set();
  for (const t of tSegs) {
    let m = null, md = Infinity;
    for (const d of dSegs) { if (used.has(d)) continue; const dist = Math.abs(d.yc - t.yc); if (dist < md) { md = dist; m = d; } }
    if (m && md < 0.75 * h) { used.add(m); entries.push({ t: [t], d: [m], y: t.yc, last: { t, d: m } }); } else entries.push({ t: [t], d: [], y: t.yc, last: { t, d: null }, solo: 't' });
  }
  for (const d of dSegs) if (!used.has(d)) entries.push({ t: [], d: [d], y: d.yc, last: { t: null, d }, solo: 'd' });
  entries.sort((a, b) => a.y - b.y);
  const out = [];
  for (const e of entries) {
    const prev = out[out.length - 1];
    const side = e.solo, seg = side === 't' ? e.t[0] : side === 'd' ? e.d[0] : null;
    const prevSeg = prev && side ? prev[side][prev[side].length - 1] : null;
    if (side && prevSeg && seg.y0 - prevSeg.y1 < 0.9 * h && seg.y0 > prevSeg.y0) { prev[side].push(seg); continue; } // Umbruch
    out.push({ t: [...e.t], d: [...e.d] });
  }
  const pairs = [];
  for (const e of out) {
    const term = e.t.map(s => s.text).join(' ').trim(), def = e.d.map(s => s.text).join(' ').trim();
    if (term && def) pairs.push({ term: fixLetters(term, termLang), def: fixLetters(def, defLang) }); else if (term || def) unpaired.push(term || def);
  }
  return { pairs, unpaired, swapped: T.idx > D.idx };
}

/* Bei Paaren aus „Wort - Übersetzung“-Zeilen prüfen, ob die Sprachen vertauscht sind */
function orient(pairs, unpaired, termLang, defLang) {
  if (!pairs.length || termLang === defLang) return { pairs, unpaired, swapped: false };
  const v = pairs.reduce((n, p) => n + langScore(p.term, termLang) - langScore(p.term, defLang) + langScore(p.def, defLang) - langScore(p.def, termLang), 0);
  const fix = ps => ps.map(p => ({ term: fixLetters(p.term, termLang), def: fixLetters(p.def, defLang) }));
  if (v >= 0) return { pairs: fix(pairs), unpaired, swapped: false };
  return { pairs: fix(pairs.map(p => ({ term: p.def, def: p.term }))), unpaired, swapped: true };
}
