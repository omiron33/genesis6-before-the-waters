// s11-multiply · "multiply upon the earth." (59.36-63.06). Lower over the plain at night: fires spread
// from one district to the next across the dark land like a contagion, the roads lit with torches,
// smoke thickening and lit red from below. The camera tracks sideways along the spreading fires until
// they fill the land to the horizon.
import { grade, ease, clamp01, mix, keys, linesAt } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS } from '/song/lib/x-mount.js';

export const kind = 'shader';

export default (P) => {
  const [L1] = linesAt(P.from - 0.6, 'multiply');
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const x = mix(-5.5, -1.0, p);
    return { pos: [x, 1.1, 7.6], target: [x + 1.6, 0.0, 12.5], fov: 46, roll: -0.04 };
  };
  return {
    name: 's11-multiply', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uNight: 0.95, uKindle: 1.0, uHaze: 1.6, uSpread: [-4.0, 11.0, 0.0], uKeyCol: [0.5, 0.55, 0.7] },
    camera: cam,
    update(t, u) {
      u.uWindT.value = t;
      // the contagion: slow at first, racing once the word is sung, to the horizon by the end
      const r = keys(t, [[P.from, 0.3], [L1.start, 1.2], [L1.end, 9.0], [P.to, 30.0]], ease.in2);
      u.uSpread.value.set(-4.0, 11.0, r);
    },
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.22, threshold: 0.8, vignette: 0.55 }); },
    finish(t) { return { flare: { amount: 0.05, threshold: 1.2, tint: [1.0, 0.5, 0.3], length: 0.2 }, grade: { shadows: [0.02, 0.005, 0.01], highlights: [1.0, 0.9, 0.85], amount: 0.4 } }; },
  };
};
