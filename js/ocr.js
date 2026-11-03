/* Foto-Texterkennung mit Tesseract.js – läuft komplett auf dem Gerät, wird erst bei Bedarf geladen.
   Ablauf: Foto verkleinern → Licht ausgleichen & Rauschen entfernen → gerade drehen → Text erkennen → Paare bilden. */
import { toGray, binarize, despeckle, estimateSkew, toRGBA } from './ocr-image.js';
import { pairsFromOcr } from './ocr-pairs.js';

const OCR_LANG = { it: 'ita', de: 'deu', en: 'eng', fr: 'fra', es: 'spa' };
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let loading = null;

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (!loading) loading = new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = TESSERACT_URL; sc.onload = res;
    sc.onerror = () => { loading = null; rej(Object.assign(new Error('offline'), { code: 'offline' })); };
    document.head.appendChild(sc);
  });
  return loading;
}
const err = code => Object.assign(new Error(code), { code });

/* Liefert ein aufbereitetes, gerade gedrehtes Schwarz-Weiß-Bild als Canvas */
export async function prepareImage(file, { max = 2400 } = {}) {
  let img;
  try { img = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { throw err('image'); }
  const sc = Math.min(1, max / Math.max(img.width, img.height)), w = Math.round(img.width * sc), h = Math.round(img.height * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
  const bin = despeckle(binarize(toGray(ctx.getImageData(0, 0, w, h)), w, h), w, h);
  const angle = estimateSkew(bin, w, h);
  ctx.putImageData(new ImageData(toRGBA(bin, w, h), w, h), 0, 0);
  if (Math.abs(angle) < 0.3) return { canvas: c, angle };
  /* gerade drehen */
  const rad = -angle * Math.PI / 180, cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  const r = document.createElement('canvas'); r.width = Math.ceil(w * cos + h * sin); r.height = Math.ceil(w * sin + h * cos);
  const rc = r.getContext('2d'); rc.fillStyle = '#fff'; rc.fillRect(0, 0, r.width, r.height);
  rc.translate(r.width / 2, r.height / 2); rc.rotate(rad); rc.drawImage(c, -w / 2, -h / 2);
  return { canvas: r, angle };
}

/* Rohdaten der Erkennung (Zeilen mit Wortpositionen) */
export async function recognizeLines(file, langCodes, onProgress = () => {}) {
  const langs = [...new Set(langCodes.map(l => OCR_LANG[l]).filter(Boolean))].join('+') || 'ita+deu';
  onProgress(-2);
  const { canvas } = await prepareImage(file);
  onProgress(-1);
  await loadTesseract();
  const worker = await window.Tesseract.createWorker(langs, 1, {
    logger: m => onProgress(m.status === 'recognizing text' ? Math.round(m.progress * 100) : -1),
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '11' }); // 11 = verstreuter Text, gut für Tabellen/Listen
    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    return { lines: (data.blocks || []).flatMap(b => b.paragraphs.flatMap(p => p.lines)).map(l => ({ bbox: l.bbox, words: l.words.map(w => ({ text: w.text, bbox: w.bbox, confidence: w.confidence })) })) };
  } finally { worker.terminate(); }
}

/* Foto → Vokabelpaare */
export async function ocrVocab(file, [termLang, defLang], onProgress) {
  const data = await recognizeLines(file, [termLang, defLang], onProgress);
  return pairsFromOcr(data, { termLang, defLang });
}

export const ocrErrorText = e => e?.code === 'image' ? 'Das Bild konnte nicht gelesen werden – bitte ein anderes Foto wählen'
  : e?.code === 'offline' ? 'Die Texterkennung braucht beim ersten Mal Internet' : 'Texterkennung fehlgeschlagen – bitte nochmal versuchen';
