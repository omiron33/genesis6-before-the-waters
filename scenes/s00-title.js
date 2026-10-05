// s00-title · the opening, 0:00-0:02.9. From the first frame the camera is already rushing low along
// the dark flank of the mountain (Hermon) at dusk, toward its peak; the land falls away on the left
// to the great valley, where the forge fires of the walled cities glow under a bruised violet sky.
// Low above the peak hang a few stars that are too bright and too cold: the fallen ones, waiting.
// BEFORE THE WATERS lands over the dark sky on the first guitar hit.
import { grade, ease, clamp01, mix } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS } from '/song/lib/x-mount.js';
import { ground } from '/song/lib/x-mount-ground.js';
import { packWatchers, SUMMIT } from '/song/lib/x-mount-watch.js';

export const kind = 'shader';

const STARS = [[-0.1, 0.42, 0.1, 1.0], [0.35, 0.62, -0.25, 0.75], [-0.55, 0.7, -0.35, 0.6], [0.05, 0.95, -0.6, 0.45]];

export default (P) => {
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    // already moving fast at frame 1: a steady rush with a slight lift at the end
    const x = 5.3 - 0.75 * p;
    const z = 4.9 - 0.3 * p;
    const y = 0.72 - 0.05 * p;
    const target = [1.3 - 0.1 * p, 1.0, 1.4];
    return { pos: [x, y, z], target, fov: mix(42, 39, p), roll: 0.03 - 0.025 * p };
  };
  return {
    name: 's00-title', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uKindle: 0.55, uWatN: STARS.length, uWatSize: 3.0 },
    camera: cam,
    update(t, u) {
      u.uWindT.value = t;
      u.uKindle.value = 0.45 + 0.12 * clamp01((t - P.from) / 2.8);
      u.uWat.value = packWatchers(STARS.map(([dx, dy, dz, k], i) => ({
        p: [SUMMIT[0] + dx + 0.004 * Math.sin(t * 0.7 + i), SUMMIT[1] + dy + 0.003 * Math.sin(t * 0.9 + i * 2), SUMMIT[2] + dz],
        k: k * (0.92 + 0.08 * Math.sin(t * 3.1 + i * 1.7)),
      })));
    },
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.16, threshold: 0.85, vignette: 0.5 }); },
    finish(t) { return { flare: { amount: 0.12, threshold: 1.0, tint: [0.6, 0.75, 1.0], length: 0.3 }, grade: { shadows: [0.01, 0.015, 0.035], highlights: [0.96, 0.95, 1.0], amount: 0.45 } }; },
  };
};
