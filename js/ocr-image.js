/* Bildaufbereitung vor der Texterkennung – reine Funktionen auf RGBA-Pixeldaten ({ data, width, height }).
   Gleicht ungleichmäßiges Licht aus (adaptive Schwelle), entfernt Rauschen und schätzt die Schräglage. */

/* Graustufen + leichte Glättung (3×3) gegen Bildrauschen */
export function toGray({ data, width: w, height: h }) {
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) g[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= w) continue; s += g[yy * w + xx]; n++; } }
    out[y * w + x] = s / n;
  }
  return out;
}

/* Adaptive Schwelle (Bradley): Pixel ist Schrift, wenn er deutlich dunkler ist als seine Umgebung.
   So verschwinden Schatten und Farbverläufe, die eine globale Schwelle (wie in Tesseract) verwirren. */
export function binarize(gray, w, h, { win = Math.max(15, Math.round(Math.max(w, h) / 24)), t = 0.16 } = {}) {
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) { let row = 0; for (let x = 1; x <= w; x++) { row += gray[(y - 1) * w + x - 1]; I[y * (w + 1) + x] = I[(y - 1) * (w + 1) + x] + row; } }
  const bin = new Uint8Array(w * h), r = win >> 1;
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const sum = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      bin[y * w + x] = gray[y * w + x] < mean * (1 - t) ? 1 : 0;
    }
  }
  return bin;
}

/* Einzelne Störpunkte entfernen (Schriftpixel ohne Nachbarn) */
export function despeckle(bin, w, h) {
  const out = new Uint8Array(bin);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (!bin[i]) continue;
    const n = bin[i - 1] + bin[i + 1] + bin[i - w] + bin[i + w] + bin[i - w - 1] + bin[i - w + 1] + bin[i + w - 1] + bin[i + w + 1];
    if (n <= 1) out[i] = 0;
  }
  return out;
}

/* Schräglage schätzen: bei richtigem Winkel bilden die Textzeilen scharfe Spitzen im Zeilenprofil */
export function estimateSkew(bin, w, h, { maxDeg = 8, step = 0.25 } = {}) {
  const sx = Math.max(1, Math.floor(w / 500)), sy = Math.max(1, Math.floor(h / 500));
  const pts = [];
  for (let y = 0; y < h; y += sy) for (let x = 0; x < w; x += sx) if (bin[y * w + x]) pts.push(x, y);
  if (pts.length < 200) return 0;
  let best = 0, bestV = -1;
  for (let deg = -maxDeg; deg <= maxDeg + 1e-9; deg += step) {
    const tan = Math.tan(deg * Math.PI / 180), prof = new Float64Array(Math.ceil(h / sy) + Math.ceil(w * Math.abs(tan) / sy) + 4), off = w * Math.max(0, tan);
    for (let i = 0; i < pts.length; i += 2) prof[Math.floor((pts[i + 1] - pts[i] * tan + off) / sy)]++;
    let v = 0; for (let i = 1; i < prof.length; i++) { const d = prof[i] - prof[i - 1]; v += d * d; }
    if (v > bestV) { bestV = v; best = deg; }
  }
  return best;
}

/* Binärbild → RGBA (schwarz auf weiß) */
export function toRGBA(bin, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, p = 0; i < bin.length; i++, p += 4) { const v = bin[i] ? 0 : 255; out[p] = out[p + 1] = out[p + 2] = v; out[p + 3] = 255; }
  return out;
}
