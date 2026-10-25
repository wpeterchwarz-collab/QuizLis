# QuizLis

Vokabel-Lern-App (PWA) im Stil bekannter Karteikarten-Apps – gebaut für Italienisch, funktioniert für jede Sprache. Läuft komplett im Browser bzw. als App auf dem iPhone, offline, ohne Konto und ohne Kosten.

**Funktionen**
- Karteikarten mit Umdrehen und Wischen
- Lernen mit Spaced Repetition (Multiple Choice → selbst schreiben), Akzent-Leiste, Artikel- und Tippfehler-Hinweise
- Test/Klausurmodus mit Note, Zeitlimit und Fehler-Training
- Spiele: Match, Blast, Gravity
- Sets anlegen, Listen importieren (auch aus Quizlet) oder Vokabeln per **Foto** scannen (Texterkennung auf dem Gerät)
- Wortschatz-Bibliothek: Basiswortschatz Italienisch Kl. 13 (Bildungsplan Berufliches Gymnasium BW)
- Aussprache, Lernserie, Sicherung exportieren/importieren, Dunkelmodus

## Auf dem iPhone installieren
1. Link in **Safari** öffnen
2. Unten auf **Teilen** tippen → **„Zum Home-Bildschirm“**
3. QuizLis immer über das App-Symbol starten

Alle Daten bleiben lokal auf dem Gerät. Unter *Einstellungen → Sicherung exportieren* lässt sich ein Backup anlegen.

## Aufbau
```
index.html, styles.css, sw.js (Offline), manifest.webmanifest
js/
  core.js      reine Lernlogik (Antwortprüfung, Spaced Repetition, Import, Noten) – ohne DOM, voll getestet
  store.js     Datenspeicher (localStorage)
  ui.js        Router, Icons, Sprachausgabe, Wisch-Gesten
  library.js   Basiswortschatz
  ocr.js       Foto-Texterkennung (Tesseract.js, wird bei Bedarf geladen)
  views/       eine Datei pro Ansicht (home, set, edit, cards, learn, test, match, games, library, settings)
tests/
  unit/        node:test – Logik, Datenreparatur, Release-Checks
  e2e/         Playwright – alle Modi im iPhone-Format, Offline, Sicherung, Foto-Import
```

## Entwicklung & Tests
```
npm install
npm start              # http://localhost:4173
npm test               # Unit-Tests
npm run test:e2e       # Oberflächentests (Playwright)
```
Bei jedem Push laufen alle Tests automatisch in GitHub Actions (Chromium und WebKit/Safari).

**Neue Version veröffentlichen:** `APP_VERSION` in `js/core.js`, `VERSION` in `sw.js` und `version` in `package.json` gleich hochzählen (ein Test prüft das), neue Dateien in `ASSETS` in `sw.js` eintragen. Die App lädt das Update dann beim nächsten Start.
