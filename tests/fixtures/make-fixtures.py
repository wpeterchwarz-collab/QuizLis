"""Erzeugt realistische Testbilder für den Foto-Import (Schulbuch-Vokabellisten).
Aufruf: python3 tests/fixtures/make-fixtures.py  – schreibt PNG/JPG + erwartete Paare (JSON) nach tests/fixtures/."""
import json, random, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
F = '/usr/share/fonts/truetype/liberation/'
serif, serif_b, serif_i, sans = F + 'LiberationSerif-Regular.ttf', F + 'LiberationSerif-Bold.ttf', F + 'LiberationSerif-Italic.ttf', F + 'LiberationSans-Regular.ttf'
random.seed(7)

PAIRS = [
    ('il colloquio di lavoro', 'das Vorstellungsgespräch'),
    ('la candidatura', 'die Bewerbung'),
    ('il datore di lavoro', 'der Arbeitgeber'),
    ('lo stipendio', 'das Gehalt, der Lohn'),
    ('a tempo indeterminato', 'unbefristet'),
    ("l'esperienza professionale", 'die Berufserfahrung'),
    ('dare le dimissioni', 'kündigen (als Arbeitnehmer)'),
    ('la città', 'die Stadt'),
    ('perché', 'warum; weil'),
    ('affidabile', 'zuverlässig'),
]
EXAMPLES = ['Domani ho un colloquio.', 'Ho mandato la mia candidatura.', 'Il mio datore di lavoro è gentile.', 'Lo stipendio è basso.',
            'Cerco un lavoro fisso.', 'Ho poca esperienza.', 'Marco ha dato le dimissioni.', 'Vivo in una città grande.', 'Perché non vieni?', 'È una persona affidabile.']

def page(w, h):
    return Image.new('RGB', (w, h), (252, 251, 247))

def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ''
    for wd in words:
        t = (cur + ' ' + wd).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = wd
    return lines + [cur]

def two_columns(swap=False, narrow_right=False):
    im = page(1240, 1300 if narrow_right else 1100); d = ImageDraw.Draw(im)
    d.text((70, 40), 'Unità 3 – Il mondo del lavoro', font=ImageFont.truetype(sans, 40), fill=(40, 60, 140))
    fb, fr = ImageFont.truetype(serif_b, 34), ImageFont.truetype(serif, 34)
    y, xr = 140, 640
    for it, de in PAIRS:
        left, right = (de, it) if swap else (it, de)
        d.text((70, y), left, font=fr if swap else fb, fill=(20, 20, 20))
        lines = wrap(d, right, fb if swap else fr, 260 if narrow_right else 560)
        for k, l in enumerate(lines): d.text((xr, y + k * 40), l, font=fb if swap else fr, fill=(20, 20, 20))
        y += 40 * len(lines) + 46
    d.text((600, im.size[1] - 50), "47", font=ImageFont.truetype(sans, 26), fill=(90, 90, 90))
    return im

def three_columns():
    im = page(1700, 1100); d = ImageDraw.Draw(im)
    d.text((60, 36), 'Vocabolario – Lezione 5', font=ImageFont.truetype(sans, 38), fill=(30, 30, 30))
    fb, fi, fr = ImageFont.truetype(serif_b, 31), ImageFont.truetype(serif_i, 29), ImageFont.truetype(serif, 31)
    y = 130
    for (it, de), ex in zip(PAIRS, EXAMPLES):
        d.text((60, y), it, font=fb, fill=(15, 15, 15))
        d.text((560, y + 2), ex, font=fi, fill=(70, 70, 70))
        d.text((1180, y), de, font=fr, fill=(15, 15, 15))
        y += 92
    return im

def notebook():
    """Vokabelheft: liniertes Papier, „Wort – Übersetzung“ in einer Zeile, kursiv."""
    im = page(1240, 1000); d = ImageDraw.Draw(im)
    font = ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf', 38)
    for y in range(120, 1000, 70): d.line([(0, y), (1240, y)], fill=(170, 200, 235), width=2)
    d.line([(90, 0), (90, 1000)], fill=(235, 150, 150), width=2)
    for k, (it, de) in enumerate(PAIRS[:8]):
        d.text((120, 120 + k * 70 + 14), f'{it} – {de}', font=font, fill=(25, 40, 120))
    return im

def photo(im):
    """Handyfoto nachahmen: schräg, ungleichmäßiges Licht, leicht unscharf, Rauschen, JPEG."""
    im = im.rotate(2.2, expand=True, fillcolor=(205, 200, 190), resample=Image.BICUBIC)
    w, h = im.size
    shade = Image.new('L', (w, h)); sd = ImageDraw.Draw(shade)
    for x in range(w): sd.line([(x, 0), (x, h)], fill=int(255 - 70 * x / w))
    im = Image.composite(im, Image.new('RGB', (w, h), (120, 115, 105)), shade.point(lambda v: v))
    im = im.resize((int(w * 1.6), int(h * 1.6)), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.6))
    px = im.load()
    for _ in range(int(im.size[0] * im.size[1] * 0.01)):
        x, y = random.randrange(im.size[0]), random.randrange(im.size[1]); v = random.randint(60, 200); px[x, y] = (v, v, v)
    return im

def save(name, im, pairs, jpg=False):
    path = os.path.join(HERE, name + ('.jpg' if jpg else '.png'))
    im.save(path, quality=72) if jpg else im.save(path)
    json.dump([list(p) for p in pairs], open(os.path.join(HERE, name + '.json'), 'w'), ensure_ascii=False, indent=1)
    print('geschrieben:', path)

save('buch-2spalten', two_columns(), PAIRS)
save('buch-2spalten-umbruch', two_columns(narrow_right=True), PAIRS)
save('buch-3spalten', three_columns(), PAIRS)
save('buch-deutsch-links', two_columns(swap=True), PAIRS)
save('foto-schraeg', photo(two_columns()), PAIRS, jpg=True)
save('foto-3spalten', photo(three_columns()), PAIRS, jpg=True)
save('heft-strich', photo(notebook()), PAIRS[:8], jpg=True)
