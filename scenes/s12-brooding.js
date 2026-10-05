// s12-brooding: "Every heart was brooding / over evil without end."
// Macro in the dark: a bed of coals breathing red and black, heat shimmer over it, the ash crust
// cracking to show the glow beneath, sparks rising slowly. The heat beats like a heart on the song's
// pulse. At the end the coals go down under the ash. The camera creeps low across the bed.
import { grade, ease, clamp01, drift, beats } from '/song/lib/look.js';
import { EMBER_GLSL, EMBER_UNIFORMS } from '/song/lib/x-ember.js';

export const kind = 'shader';

export default (P) => {
  // the heart beats on every other beat of the song
  const bs = beats.filter((b) => b >= P.from - 1.3 && b <= P.to + 0.1).filter((_, i) => i % 2 === 0);
  while (bs.length < 8) bs.push(-100);
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.0012);
    return { pos: [-0.03 + 0.05 * p + d[0], 0.075 - 0.012 * p + d[1], -0.28 + 0.09 * p], target: [0.02 + 0.02 * p, -0.005, 0.25], fov: 38 };
  };
  return {
    name: 's12-brooding', from: P.from, to: P.to,
    frag: EMBER_GLSL + 'vec3 shade(vec2 fc) { return embers(fc); }',
    uniforms: { ...EMBER_UNIFORMS, uBeats: bs.slice(0, 8) },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      // focus on the coals a hand's breadth ahead, drifting a little deeper
      u.uFocus.value = 0.26 + 0.04 * clamp01((t - P.from) / (P.to - P.from));
      u.uDim.value = 0.7 * ease.inOut3(clamp01((t - (P.to - 1.1)) / 1.1));
    },
    post(t) { return grade(t, { exposure: 1.35, bloom: 0.14, threshold: 0.9, saturation: 1.02, vignette: 0.55, contrast: 1.06, lift: [0.004, 0.002, 0.002] }); },
    finish() { return { grade: { shadows: [0.02, 0.0, 0.0], highlights: [1.0, 0.92, 0.82], amount: 0.3 } }; },
  };
};
