/* QuizLis – Einstiegspunkt */
import { onStoreError } from './store.js';
import { initUI, registerRoutes, render, toast } from './ui.js';
import { viewHome } from './views/home.js';
import { viewSet } from './views/set.js';
import { viewEdit } from './views/edit.js';
import { viewCards } from './views/cards.js';
import { viewLearn } from './views/learn.js';
import { viewTestSetup, viewTestRun } from './views/test.js';
import { viewMatch } from './views/match.js';
import { viewBlast, viewGravity } from './views/games.js';
import { viewLibrary } from './views/library.js';
import { viewSettings } from './views/settings.js';

onStoreError(toast);
registerRoutes({
  '': viewHome, set: viewSet, edit: viewEdit, cards: viewCards, learn: viewLearn,
  test: viewTestSetup, testrun: viewTestRun, match: viewMatch, blast: viewBlast, gravity: viewGravity,
  library: viewLibrary, settings: viewSettings,
});
initUI();
render();

navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  const hadController = !!navigator.serviceWorker.controller; let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    /* Neue Version aktiv: auf ruhigen Seiten sofort neu laden, sonst beim nächsten Start */
    if (!/learn|test|cards|match|blast|gravity|edit/.test(location.hash)) location.reload();
    else toast('Update installiert – wird beim nächsten Start aktiv');
  });
  navigator.serviceWorker.register('./sw.js').then(r => r.update()).catch(() => {});
}
