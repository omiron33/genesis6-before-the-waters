// s34-die: "everything on earth will die." (the belted climax; God's foretelling, in cold ash)
// The fountains of the great deep break open: across the night plain the cracked ground bursts and
// columns of water roar up one after another on the hits, lightning runs through the storm, and the
// flood rises over the land; the camera rises with it but the water rises faster and closes over the
// lens, and the vision ends in a full-frame white flash of lightning (into s35).
import { grade, ease, clamp01, drift, keys } from '/song/lib/look.js';
import { DEEP_GLSL, DEEP_UNIFORMS, FORETOLD } from '/song/lib/x-flood-deep.js';
import { flashAt, toward } from '/song/lib/x-flood-sky.js';

export const kind = 'shader';

export default (P) => {
  // fountains: x, z, burst time, height
  const founts = [
    [-26, 62, 181.3, 55], [24, 105, 181.9, 85], [-75, 150, 182.5, 105],
    [55, 50, 183.13, 48], [6, 210, 184.38, 140], [-10, 34, 185.01, 36],
  ].flat();
  const strikes = [
    { t: 181.25, k: 1.0, bolt: true }, { t: 182.5, k: 0.6 }, { t: 183.75, k: 0.9, bolt: true },
    { t: 185.01, k: 0.6 }, { t: 186.26, k: 1.0, bolt: true }, { t: 186.89, k: 0.7 },
  ];
  const level = (t) => keys(t, [[181.25, -2.2], [182.6, -1.2, ease.inOut3], [184.4, 1.2, ease.inOut3], [186.4, 4.2, ease.inOut3], [187.6, 8.2, ease.in2]]);
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.05);
    return {
      pos: [2 + d[0], 1.8 + 5.2 * p + d[1], -10 + 6 * p],
      target: [-4 + 6 * p, 12 + 4 * p - 10 * ease.inOut3(clamp01((t - 186.9) / 0.6)), 120],
      fov: 58 - 6 * p,
    };
  };
  return {
    name: 's34-die', from: P.from, to: P.to,
    frag: DEEP_GLSL + 'vec3 shade(vec2 fc) { return deepScene(fc); }',
    uniforms: { ...DEEP_UNIFORMS, uRain: 1.0, uWind: 0.35, uFlow: 1.2, uFount: founts, uFire: [0, 0, 0, 0] },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uLevel.value = level(t);
      const f = flashAt(t, strikes);
      u.uFlash.value = f.flash; u.uBoltOn.value = f.bolt;
      const s = f.s ?? strikes[0];
      const bx = [-140, 90, -40][strikes.indexOf(s) % 3], bz = 380;
      u.uBolt.value.set(bx, strikes.indexOf(s) * 3.7 + 1.0, bz);
      u.uLightDir.value.set(...toward(c.pos, bx, 300, bz));
      // the vision ends in a full-frame white flash (the last ~8 frames)
      u.uWhite.value = clamp01((t - (P.to - 0.135)) / 0.06);
    },
    post(t) { return grade(t, { exposure: 1.45, ...FORETOLD }); },
    finish(t) { return { grade: { shadows: [0.01, 0.012, 0.016], highlights: [0.94, 0.95, 0.97], amount: 0.5 } }; },
  };
};
