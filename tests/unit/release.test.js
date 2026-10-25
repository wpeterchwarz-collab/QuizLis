import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { APP_VERSION } from '../../js/core.js';

const sw = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('Versionen stimmen überein (App, Service Worker, package.json)', () => {
  assert.equal(sw.match(/const VERSION = '([^']+)'/)[1], APP_VERSION);
  assert.equal(pkg.version, APP_VERSION);
});

test('Service Worker speichert alle App-Dateien für den Offline-Betrieb', () => {
  const files = [...readdirSync(new URL('../../js', import.meta.url)).filter(f => f.endsWith('.js')).map(f => `./js/${f}`),
    ...readdirSync(new URL('../../js/views', import.meta.url)).map(f => `./js/views/${f}`), './index.html', './styles.css', './manifest.webmanifest'];
  for (const f of files) assert.ok(sw.includes(`'${f}'`), `${f} fehlt in sw.js`);
});
