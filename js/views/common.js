/* Gemeinsame Helfer der Ansichten */
import { checkAnswer, pickDir } from '../core.js';
import { DB } from '../store.js';

export const check = (input, answer, lang) => checkAnswer(input, answer, lang, { strictAccents: DB.settings.strictAccents });
export const dir = () => pickDir(DB.settings.answerWith);
export const inputAttrs = 'autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"';
