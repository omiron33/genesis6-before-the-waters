// s26-destroy: God speaks: "They have filled the earth with wrong; / I will destroy them / and the
// earth." Inside the storm front over the valley city at night, seen from the dark plain: black
// cloud lit from within, the cyclopean walls and towers on their rise, smoke from the city's fires;
// a run of hard lightning strikes on the drum hits (measured kicks and the strongest beats from
// data/audio.json), each one lighting walls and towers white for an instant. Dry: no rain. The
// last flash whites out and cuts to black.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { CITY_GLSL, CITY_UNIFORMS } from '/song/lib/x-city.js';
import { STORM_GLSL, STORM_UNIFORMS } from '/song/lib/x-city-storm.js';

export const kind = 'shader';
const audio = await fetch('/song/data/audio.json').then((r) => r.json());

export default (P) => {
  const dur = P.to - P.from;
  // the strikes: every measured kick in the scene, plus the strongest beats, and one last flash
  const kicks = audio.kicks.filter((k) => k > P.from + 0.2 && k < P.to - 0.5);
  const strong = audio.beats.filter((b) => b.time > P.from + 0.2 && b.time < P.to - 0.3 && b.strength > 0.25).map((b) => b.time);
  let times = [...kicks, ...strong].sort((a, b) => a - b).filter((x, i, a) => i === 0 || x - a[i - 1] > 0.12);
  const tLast = P.to - 0.24;
  times = [...times.filter((x) => x < tLast - 0.25), tLast].slice(-16);
  const xs = times.map((_, i) => [-160, 60, -40, 190, -260, 120, -90, 240, 10, -200, 150, -20, 80, -120, 220, -30][i % 16]);
  const ks = times.map((tt, i) => (i === times.length - 1 ? 2.2 : kicks.includes(tt) ? 1.0 : 0.75));
  const pad = (a, v) => [...a, ...new Array(16 - a.length).fill(v)];
  const cam = (t) => {
    const x = clamp01((t - P.from) / dur);
    const e = ease.inOut3(x);
    const d = drift(t, 0.15);
    const pos = [-20 + 15 * e + d[0], 7.0 + 3 * e + d[1], -30 + 45 * e];
    const target = [-10 + 8 * e, 95 - 10 * e, 470];
    return { pos, target, fov: 46 };
  };
  return {
    name: 's26-destroy', from: P.from, to: P.to,
    frag: CITY_GLSL + STORM_GLSL + 'vec3 shade(vec2 fc) { return cityStorm(fc); }',
    uniforms: { ...CITY_UNIFORMS, ...STORM_UNIFORMS, uStrike: pad(times, 1e4), uStrikeX: pad(xs, 0), uStrikeK: pad(ks, 0) },
    camera: cam,
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.14, threshold: 0.95, saturation: 1.0, vignette: 0.5, contrast: 1.08 }); },
    finish(t) {
      // the last flash whites out, then the frame cuts to black
      const after = t - tLast;
      const fade = after < 0.1 ? 0 : clamp01((after - 0.1) / 0.06);
      return { flare: { amount: 0.08, threshold: 0.9, tint: [0.7, 0.8, 1.0], length: 0.35 }, grade: { shadows: [0.0, 0.01, 0.03], highlights: [0.95, 0.95, 1.0], amount: 0.4 }, fade };
    },
  };
};
