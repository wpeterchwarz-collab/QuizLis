# QuizLis

Vokabel-Lern-App (PWA) im Stil bekannter Karteikarten-Apps – gebaut für Italienisch, funktioniert für jede Sprache. Läuft komplett im Browser bzw. als App auf dem iPhone, offline, ohne Konto und ohne Kosten.

**Funktionen**
- Karteikarten mit Umdrehen und Wischen
- Lernen mit wählbarem **Lernziel** pro Set (jederzeit umschaltbar):
  - *Langfristig merken*: Wiederholung in wachsenden Abständen (1, 2, 4, 7 … Tage); „gelernt“ = an 3 Tagen gewusst
  - *Für eine Prüfung pauken*: ohne Wartezeiten, bis alle Wörter sitzen; „gelernt“ = in einer Runde fehlerfrei gewusst
- Multiple Choice → selbst schreiben, Akzent-Leiste, Artikel- und Tippfehler-Hinweise, Wörter pro Runde einstellbar (10/20/30)
- Test/Klausurmodus mit Note, Zeitlimit und Fehler-Training
- Spiele: Match, Blast, Gravity
- Sets anlegen, Listen importieren (auch aus Quizlet) oder Vokabeln per **Foto** scannen – Texterkennung auf dem Gerät, erkennt Schulbuchspalten (auch mit Beispielsatz-Spalte, schräg fotografiert, umbrochene Zeilen, Deutsch links oder rechts) und zeigt vor dem Übernehmen eine Prüfliste
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
  ocr-image.js Bildaufbereitung: Licht ausgleichen, Rauschen entfernen, Schräglage schätzen
  ocr-pairs.js Wortpositionen → Spalten → Vokabelpaare, Sprach-Erkennung, Lesefehler-Korrektur
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
**Foto-Testbilder:** `python3 tests/fixtures/make-fixtures.py` erzeugt die Testfotos, `node tests/fixtures/record-ocr.mjs` (bei laufendem `npm start`) zeichnet die echte Texterkennung dazu auf – die Unit-Tests prüfen damit die Paar-Bildung ohne Tesseract.

Bei jedem Push laufen alle Tests automatisch in GitHub Actions (Chromium und WebKit/Safari).

**Neue Version veröffentlichen:** `APP_VERSION` in `js/core.js`, `VERSION` in `sw.js` und `version` in `package.json` gleich hochzählen (ein Test prüft das), neue Dateien in `ASSETS` in `sw.js` eintragen. Die App lädt das Update dann beim nächsten Start.
