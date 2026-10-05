// s44-store: "store it for yourself and for them." (God speaks; the long held line)
// The hold full and ready. The camera rises slowly up the open well through the middle of the ark:
// from the lowest deck, where animals lie asleep in their stalls as dim shapes in the shadow beyond
// the lamps, past the storeroom's jars and sheaves, past the roosts where birds sleep in rows, up
// under the rafters to the window strip, and out between two mullions into the storm above the roof.
import { grade, drift, clamp01, ease } from '/song/lib/look.js';
import { HOLD_GLSL, HOLD_UNIFORMS, DECKS } from '/song/lib/x-hold.js';

export const kind = 'shader';

// Catmull-Rom through points, at u in 0..1 (uniform in segments)
function cr(pts, u) {
  const n = pts.length - 1;
  const x = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(x), f = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  return p1.map((_, k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f * f + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f * f * f));
}
const X = 1.2;          // between the rafters and between two mullions of the window
// keys: [time fraction, camera, target]
const KEYS = [
  [0.0, [X, DECKS[0] + 2.3, -0.8], [10, DECKS[0] + 0.2, -6.0]],
  [0.27, [X, DECKS[1] + 1.6, -0.5], [9, DECKS[1] + 0.5, -5.5]],
  [0.5, [X, DECKS[2] + 1.2, -0.3], [9, DECKS[2] + 0.9, -5.0]],
  [0.76, [X, 12.1, 0.3], [X + 1.5, 12.9, 8.0]],
  [0.91, [X, 13.05, 2.1], [X + 1.5, 13.1, 12.0]],
  [1.0, [X + 1.5, 13.8, 4.8], [X + 22.0, 12.9, 3.2]],
];
const POS = KEYS.map((k) => k[1]), TGT = KEYS.map((k) => k[2]);
// time fraction -> spline parameter, piecewise linear through the keys
function param(x) {
  for (let i = 1; i < KEYS.length; i++) if (x <= KEYS[i][0]) return (i - 1 + (x - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0])) / (KEYS.length - 1);
  return 1;
}
export default (P) => {
  const u = (t) => {
    const x = clamp01((t - P.from) / (P.to - P.from));
    return param(0.8 * x + 0.2 * ease.inOut3(x));
  };
  const cam = (t) => {
    const d = drift(t, 0.006);
    const p = cr(POS, u(t)), g = cr(TGT, u(t));
    return { pos: [p[0] + d[0], p[1] + d[1], p[2]], target: g, fov: 52 };
  };
  return {
    name: 's44-store', from: P.from, to: P.to,
    frag: HOLD_GLSL + 'vec3 shade(vec2 fc) { return hold(fc); }',
    uniforms: { ...HOLD_UNIFORMS },
    camera: cam,
    update(t, uu) {
      uu.uFocus.value = 6.0; uu.uAper.value = 0.015;
      uu.uExpo.value = 6.0 + 3.0 * (1 - clamp01((t - P.from - 1.5) / 2.0));     // the lowest deck is darkest
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.12, threshold: 1.0, vignette: 0.5 }); },
    finish(t) { return { leak: { amount: 0.04, warm: [1.0, 0.55, 0.25], cool: [0.6, 0.3, 0.3], speed: 0.05 }, grade: { shadows: [0.0, 0.0, 0.0], highlights: [1.0, 0.93, 0.8], amount: 0.35 } }; },
  };
};
