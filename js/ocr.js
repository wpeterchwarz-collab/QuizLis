/* Foto-Texterkennung mit Tesseract.js – läuft komplett auf dem Gerät, wird erst bei Bedarf geladen. */
import { linesFromOcr } from './core.js';

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

async function prepareImage(file, max = 2200) {
  let img;
  try { img = await createImageBitmap(file); } catch (e) { throw Object.assign(new Error('image'), { code: 'image' }); }
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  const ctx = c.getContext('2d'); ctx.filter = 'grayscale(1) contrast(1.3)'; ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/* onProgress(p): p = -1 während des Ladens, sonst 0–100 */
export async function ocrVocab(file, langCodes, onProgress = () => {}) {
  const langs = [...new Set(langCodes.map(l => OCR_LANG[l]).filter(Boolean))].join('+') || 'ita+deu';
  const image = await prepareImage(file);
  onProgress(-1);
  await loadTesseract();
  const worker = await window.Tesseract.createWorker(langs, 1, {
    logger: m => onProgress(m.status === 'recognizing text' ? Math.round(m.progress * 100) : -1),
  });
  try { const { data } = await worker.recognize(image); return linesFromOcr(data); }
  finally { worker.terminate(); }
}
export const ocrErrorText = e => e?.code === 'image' ? 'Das Bild konnte nicht gelesen werden – bitte ein anderes Foto wählen'
  : e?.code === 'offline' ? 'Texterkennung braucht beim ersten Mal Internet' : 'Texterkennung fehlgeschlagen – bitte nochmal versuchen';
