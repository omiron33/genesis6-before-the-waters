import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFilm, validateData } from '../tools/validate.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const film = JSON.parse(fs.readFileSync(new URL('../film.json', import.meta.url)));
test('the film covers the full recording in 47 contiguous shader scenes', () => {
  assert.deepEqual(validateFilm(film, root), []);
  assert.equal(film.scenes.length, 47);
  assert.equal(film.scenes.at(-1).to, 254.8);
});
test('every scene has a lyric layer and the film-wide lyric backing is set', () => {
  for (const scene of film.scenes) assert(fs.existsSync(path.join(root, 'scenes', `${scene.scene}.lyric.js`)), `missing lyric module: ${scene.scene}`);
  assert.equal(film.lyric.lift, false);
  assert(film.lyric.haloSpread > 0 && film.lyric.shade > 0 && film.lyric.shade <= 1);
});
test('lyric and font data are consistent', () => {
  assert.deepEqual(validateData(film, root).errors, []);
});
test('gaps, duplicate IDs and unsupported transitions are rejected', () => {
  const bad = structuredClone(film);
  bad.scenes[1].from += 0.1;
  bad.scenes[1].id = bad.scenes[0].id;
  bad.scenes[1].transition = { type: 'fade' };
  const errors = validateFilm(bad);
  assert(errors.some((error) => error.includes('Gap')));
  assert(errors.some((error) => error.includes('Duplicate')));
  assert(errors.some((error) => error.includes('hard cuts')));
});
