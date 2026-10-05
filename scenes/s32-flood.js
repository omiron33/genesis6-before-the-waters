// s32-flood: "I will bring a flood of water / upon the earth." (the words of God)
// God's foretelling, seen as a vision: the scene opens out of a full-frame white lightning flash and
// falls into a cold ash, near-monochrome world. A towering storm front of black cloud and rain rolls
// across the plain toward the camera, the grass flattened in streaks by its wind, lightning inside it
// and bolts to the ground on the heaviest hits. The camera drives low and fast into it; the front
// arrives and swallows the frame. The crescendo starts here: heavy and fast.
import { grade, ease, clamp01, keys } from '/song/lib/look.js';
import { WALL_GLSL, WALL_UNIFORMS } from '/song/lib/x-storm-wall.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  // the hits: the opening flash, then the heaviest beats ("bring", "flood", "water", "earth")
  const hits = [173.12, 174.31, 175.62, 176.87];
  const flash = (t, t0, k = 1) => {
    const x = t - t0;
    if (x < 0) return 0;
    // a stroke and a restrike, then a fall
    return k * (Math.exp(-x / 0.05) + 0.7 * Math.exp(-Math.pow((x - 0.12) / 0.03, 2)) + 0.25 * Math.exp(-x / 0.35));
  };
  const shake = (t) => {
    // a short hit of camera on each strike, damped (the crescendo's weight), never a constant shake
    let s = 0;
    for (const h of hits) { const x = t - h; if (x > 0 && x < 0.5) s += Math.exp(-x * 9) * Math.sin(x * 60); }
    return s;
  };
  const cam = (t) => {
    const p = clamp01((t - P.from) / span);
    const e = ease.inOut3(p);
    const s = shake(t);
    return { pos: [0.0, 1.4 + 0.6 * e + 0.05 * s, 70 * e * e], target: [-40.0, 420.0 + 300.0 * e + 6 * s, 1600.0], fov: 60 - 8 * e, roll: 0.01 * s };
  };
  return {
    name: 's32-flood', from: P.from, to: P.to,
    frag: WALL_GLSL + 'vec3 shade(vec2 fc) { return wallScene(fc); }',
    uniforms: { ...WALL_UNIFORMS, uBoltX: [-380, 260, -120, 420] },
    camera: cam,
    update(t, u) {
      // the front comes on fast and accelerating: from 2.6 km to over the camera
      u.uFront.value = keys(t, [[P.from, 2200], [P.to - 0.3, 60], [P.to, -60]], ease.in2);
      // full white for the first frames, falling into the vision
      const x = t - P.from;
      u.uWhite.value = x < 0.1 ? 1 : Math.max(0, 1 - ease.out3((x - 0.1) / 0.4));
      const f = hits.map((h, i) => flash(t, h, i === 1 ? 1.4 : 1));
      u.uFlash.value = [f[0] + flash(t, P.from, 0.8), f[1], f[2], f[3]];
      u.uBolt.value = hits.map((h, i) => { const y = t - h; return y < 0 ? 0 : (y < 0.09 ? 1 : 0) + 0.8 * Math.exp(-Math.pow((y - 0.13) / 0.03, 2)) + 0.3 * Math.exp(-y / 0.15); });
      u.uRainNear.value = ease.inOut3(clamp01((t - (P.to - 1.6)) / 1.6));
    },
    // the vision's grade: cold ash, near-monochrome, a heavier vignette
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.16, threshold: 0.9, saturation: 0.22, vignette: 0.68, contrast: 1.1, lift: [0.008, 0.009, 0.011], gain: [0.97, 1.0, 1.04] }); },
    finish() { return { grade: { shadows: [0.0, 0.008, 0.018], highlights: [0.94, 0.96, 1.0], amount: 0.5 } }; },
  };
};
