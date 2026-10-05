// s23-looked · "The Lord God looked on the earth / and saw its corruption;" (121.89-126.76). Again from
// far above, now at full night: through a wide break in the black cloud the whole valley is a sore of
// red light under smoke, fires to the horizon; the cloud is lit from within by slow lightning. A slow,
// heavy descent toward the break.
import { grade, ease, clamp01, mix, linesAt, wordIn } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS } from '/song/lib/x-mount.js';

export const kind = 'shader';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'The Lord God looked', 'and saw');
  const hit = wordIn(L2, 'corruption').start;
  // lightning strokes inside the cloud: [time, x, z, strength]
  const strokes = [[P.from + 0.5, 4.0, 16.0, 0.6], [L1.end - 0.2, -5.0, 22.0, 0.8], [hit - 0.03, 1.5, 19.0, 1.4], [hit + 0.22, 1.0, 18.5, 0.8], [P.to - 0.6, -2.0, 12.0, 0.5]];
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const e = 0.35 * p + 0.65 * ease.inOut3(p);
    return { pos: [mix(1.8, 1.2, e), mix(10.5, 8.0, e), mix(5.5, 7.5, e)], target: [mix(-0.6, -0.8, e), 0.0, mix(17.5, 18.0, e)], fov: 42, roll: mix(0.03, -0.02, e) };
  };
  return {
    name: 's23-looked', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uDeck: 1, uCloudY: 3.4, uHole: [-0.6, 17.0, 2.8], uNight: 1.0, uKindle: 1.0, uSpread: [-4.0, 11.0, 40.0], uHaze: 1.8, uKeyDir: [0.2, 1.0, -0.1], uKeyCol: [1.1, 1.2, 1.55] },
    camera: cam,
    update(t, u) {
      u.uWindT.value = t * 0.7;
      let best = [0, 0, 0];
      for (const [t0, x, z, k] of strokes) {
        const dt = t - t0;
        if (dt < 0 || dt > 0.6) continue;
        const f = k * Math.exp(-dt * 9) * (0.6 + 0.4 * Math.cos(dt * 70)) + k * 0.3 * Math.exp(-Math.abs(dt - 0.12) * 30);
        if (f > best[2]) best = [x, z, f];
      }
      u.uFlash.value.set(...best);
    },
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.22, threshold: 0.8, vignette: 0.55 }); },
    finish(t) { return { grade: { shadows: [0.02, 0.004, 0.01], highlights: [1.0, 0.92, 0.9], amount: 0.4 } }; },
  };
};
