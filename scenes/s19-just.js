// s19-just: "He was a just man, perfect in his generation". One great straight cedar in the gold
// light, its furrowed red-grey bark in sharp detail; beside it a plumb line of cord with a stone bob
// hangs perfectly still and true, a hand's breadth off the trunk. The camera rises along the line,
// the trunk and the cord running straight and parallel, up toward the first tiers of the canopy.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { groveScene } from '/song/lib/x-grove-scene.js';
import { CEDAR_AT, PLUMB_TOP, PLUMB_BOB, PLUMB_DIR } from '/song/lib/x-grove.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  const T = CEDAR_AT[0];
  const side = [-PLUMB_DIR[1], PLUMB_DIR[0]];
  // a low gold light from the camera's side rakes across the bark; the break in the cloud stands
  // high behind the tree, seen through the canopy as the camera looks up
  const L = (() => { const v = [PLUMB_DIR[0] * 0.55 + side[0] * 0.5, 0.36, PLUMB_DIR[1] * 0.55 + side[1] * 0.5]; const l = Math.hypot(...v); return v.map((x) => x / l); })();
  const brk = [T[0] - PLUMB_DIR[0] * 160, T[2] - PLUMB_DIR[1] * 160];
  const gapC = [brk[0] - L[0] / L[1] * 240, brk[1] - L[2] / L[1] * 240];
  const camera = (t) => {
    const p = clamp01((t - P.from) / span);
    const e = ease.inOut3(p);
    const d = drift(t, 0.006);
    const y = PLUMB_BOB[1] + 0.25 + 3.4 * e;
    const dist = 1.75 + 0.35 * e;
    const pos = [PLUMB_TOP[0] + PLUMB_DIR[0] * dist + side[0] * 0.75 + d[0], y + d[1], PLUMB_TOP[2] + PLUMB_DIR[1] * dist + side[1] * 0.75];
    const look = y + 0.25 + 0.9 * ease.inOut3(clamp01((p - 0.5) / 0.5));
    return { pos, target: [PLUMB_TOP[0] - side[0] * 0.05, look, PLUMB_TOP[2] - side[1] * 0.05], fov: 40 };
  };
  return groveScene(P, {
    name: 's19-just',
    camera,
    uniforms: {
      uSunDir: L, uSunCol: [6.5, 5.0, 3.0], uSunVis: 0.0,
      uSkyZen: [0.012, 0.012, 0.022], uSkyHor: [0.08, 0.06, 0.08], uCloudAmb: [0.13, 0.1, 0.16], uAmbCol: [0.03, 0.027, 0.04],
      uCloud: 0.95, uGate: 0.0, uGrace: 1.0, uGapR: 70, uGapC: gapC, uKeyK: 1.0, uHaze: 0.003, uFogCol: [0.04, 0.032, 0.035], uLampH: 1.0, uRays: 0.0, uShadowR: 1000.0,
    },
    set(t, u, c) {
      // focus on the cord
      u.uFocus = Math.hypot(c.pos[0] - PLUMB_TOP[0], c.pos[2] - PLUMB_TOP[2]);
      u.uAper = 0.014;
    },
    post: (t) => grade(t, { exposure: 1.2, bloom: 0.1, threshold: 1.0 }),
    finish: () => ({ grade: { shadows: [0.01, 0.0, 0.03], highlights: [1.0, 0.93, 0.78], amount: 0.4 } }),
  });
};
