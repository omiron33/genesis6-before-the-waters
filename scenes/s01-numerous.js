// s01-numerous · "As people grew numerous / upon the earth," (2.86-8.47). A high, slow crane over the
// great valley at dusk: more and more lights kindle across the plain, scattered villages becoming
// towns, roads of torches threading between them, hearth smoke lying in bands, the river catching the
// last violet light. The camera keeps sinking toward one walled city.
import { grade, ease, clamp01, mix, keys, linesAt } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS } from '/song/lib/x-mount.js';

export const kind = 'shader';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'As people', 'upon the earth');
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const e = 0.15 * p + 0.85 * ease.inOut3(p);
    const pos = [mix(1.6, 3.9, e), mix(2.9, 1.05, e), mix(-0.6, 3.0, e)];
    const target = [mix(0.5, 5.0, e), 0.0, mix(15.0, 7.2, e)];
    return { pos, target, fov: mix(50, 42, e), roll: mix(-0.04, 0.02, e) };
  };
  return {
    name: 's01-numerous', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uKindle: 0.1, uHaze: 1.2 },
    camera: cam,
    update(t, u) {
      u.uWindT.value = t;
      // the lights kindle as the people grow numerous: a first wave on the first line, the rest on "earth"
      u.uKindle.value = keys(t, [[P.from, 0.08], [L1.start, 0.14], [L1.end, 0.5], [L2.start, 0.55], [L2.end + 0.4, 0.95], [P.to, 1.0]]);
    },
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.16, threshold: 0.85, vignette: 0.5 }); },
    finish(t) { return { flare: { amount: 0.06, threshold: 1.1, tint: [1.0, 0.6, 0.35], length: 0.2 }, grade: { shadows: [0.01, 0.015, 0.035], highlights: [1.0, 0.95, 0.92], amount: 0.4 } }; },
  };
};
