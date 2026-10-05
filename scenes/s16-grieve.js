// s16-grieve: "I grieve that I have made them." (the words of God)
// Close and low over a dried waterhole at night in ash-grey light: the mud dried into curled plates
// with deep cracks, an abandoned clay jar lying on its side at the bottom, a broken shard beside it.
// A faint wind lifts thin veils of dust off the cracks and lets them fall. Still, quiet grief: a very
// slow push toward the jar, the focus settling on its mouth.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { DUST_GLSL, DUST_UNIFORMS } from '/song/lib/x-storm-dust.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / span));
    const d = drift(t, 0.002);
    return { pos: [0.55 - 0.15 * p + d[0], 0.07 - 0.015 * p + d[1], 0.25 + 0.35 * p], target: [0.12, -0.2 + 0.03 * p, 1.55], fov: 40 };
  };
  return {
    name: 's16-grieve', from: P.from, to: P.to,
    frag: DUST_GLSL + 'vec3 shade(vec2 fc) { return dryHole(fc); }',
    uniforms: { ...DUST_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFocus.value = Math.hypot(0.15 - c.pos[0], -0.25 - c.pos[1], 1.5 - c.pos[2]);
    },
    post(t) { return grade(t, { exposure: 1.7, bloom: 0.08, threshold: 1.0, saturation: 0.7, vignette: 0.55, contrast: 1.04, lift: [0.008, 0.008, 0.009] }); },
    finish() { return { grade: { shadows: [0.0, 0.01, 0.02], highlights: [0.95, 0.96, 1.0], amount: 0.35 } }; },
  };
};
