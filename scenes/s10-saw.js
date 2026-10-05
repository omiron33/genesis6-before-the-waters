// s10-saw · "The Lord God saw wickedness" (50.56-59.36), the near-silent drop. From very high, looking
// down through a break in black cloud: the valley at nightfall, its cities pricked with red fires,
// smoke lying over everything. A single shaft of pale light falls through the break and moves slowly
// across the land. A long, still hold with a slow descent; the cloud drifts, the shaft travels.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS } from '/song/lib/x-mount.js';

export const kind = 'shader';

export default (P) => {
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const e = 0.4 * p + 0.6 * ease.inOut3(p);
    return { pos: [mix(-1.3, -1.0, e), mix(15.0, 12.0, e), mix(16.4, 17.0, e)], target: [mix(-1.25, -0.95, e), 0.0, mix(19.4, 19.6, e)], fov: 30, roll: mix(0.0, 0.05, e) };
  };
  return {
    name: 's10-saw', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uDeck: 1, uCloudY: 3.2, uHole: [-1.1, 19.2, 1.8], uNight: 0.85, uKindle: 1.0, uKeyDir: [0.15, 1.0, -0.12], uKeyCol: [1.4, 1.5, 1.8], uShaft: [-1.5, 12.0, 1.0], uHaze: 1.4 },
    camera: cam,
    update(t, u) {
      const p = clamp01((t - P.from) / (P.to - P.from));
      u.uWindT.value = t * 0.6;
      u.uShaft.value.set(mix(-3.0, 0.8, p), mix(18.0, 20.4, p), Math.min(1, (t - P.from) / 1.5) * (1 - 0.6 * clamp01((p - 0.85) / 0.15)));
      u.uHole.value.set(-1.1, 19.2, mix(1.9, 1.5, ease.inOut3(clamp01((p - 0.6) / 0.4))));
    },
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.18, threshold: 0.8, vignette: 0.55 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.94, 0.9], amount: 0.45 } }; },
  };
};
