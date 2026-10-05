// s15-creatures: "and cattle, creatures that crawl, / and birds of the sky."
// Dusk on the open plain under the storm: long grass rippling in the wind, a herd of cattle moving
// slowly along a ridge as dark silhouettes against the last band of light, and above them a great
// flock of birds wheeling, far off and small, a murmuration. On "birds of the sky" the flock turns
// and streams away into the storm. The camera drifts slowly sideways with the herd.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { PLAIN_GLSL, PLAIN_UNIFORMS } from '/song/lib/x-storm-plain.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / span));
    const d = drift(t, 0.01);
    return { pos: [-6.0 + 3.0 * p + d[0], 0.42 + 0.3 * d[1], 0.0], target: [-6.0 + 6.0 * p, 16.5 + 1.0 * p, 120.0], fov: 36 };
  };
  return {
    name: 's15-creatures', from: P.from, to: P.to,
    frag: PLAIN_GLSL + 'vec3 shade(vec2 fc) { return plainScene(fc); }',
    uniforms: { ...PLAIN_UNIFORMS, uFocus: 75, uAper: 0.0035 },
    camera: cam,
    update(t, u) { u.uLeave.value = ease.inOut3(clamp01((t - 83.1) / (P.to - 83.1 + 0.4))); },
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.1, threshold: 1.0, saturation: 0.95, vignette: 0.5, contrast: 1.05, lift: [0.006, 0.005, 0.008] }); },
    finish() { return { grade: { shadows: [0.01, 0.0, 0.03], highlights: [1.0, 0.92, 0.84], amount: 0.35 } }; },
  };
};
