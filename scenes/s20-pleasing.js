// s20-pleasing: "and pleasing to God." Noe's small stone altar at the grove's edge, its coals
// breathing; the smoke rises straight and unbroken, up into the gold that pours through the parted
// cloud: the answer to the torn smoke on the mountain in s05. The camera, low by the altar, tilts up
// with the smoke as it climbs.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { groveScene } from '/song/lib/x-grove-scene.js';
import { ALTAR } from '/song/lib/x-grove.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  const L = [0.1, 0.85, 0.52];
  const camera = (t) => {
    const p = clamp01((t - P.from) / span);
    const e = ease.inOut3(p);
    const d = drift(t, 0.01);
    const pos = [ALTAR[0] - 1.4 + d[0], ALTAR[1] + 0.5 + 0.2 * e + d[1], ALTAR[2] - 4.6 + 0.3 * e];
    return { pos, target: [ALTAR[0] - 0.3, ALTAR[1] + 1.4 + 4.5 * e, ALTAR[2] + 1.0], fov: 50 };
  };
  return groveScene(P, {
    name: 's20-pleasing',
    camera,
    uniforms: {
      uSunDir: L, uSunCol: [9.0, 6.4, 3.2], uSunVis: 0.0,
      uSkyZen: [0.012, 0.012, 0.022], uSkyHor: [0.07, 0.05, 0.08], uCloudAmb: [0.11, 0.085, 0.14], uAmbCol: [0.035, 0.03, 0.045],
      uCloud: 0.95, uGate: 1.0, uGrace: 1.0, uGapR: 34, uGapC: [ALTAR[0], ALTAR[2]], uKeyK: 1.0,
      uHaze: 0.0015, uFogCol: [0.04, 0.032, 0.04], uLampH: 1.0, uRays: 1.0, uRayMax: 150.0, uSmoke: 1.0, uCoal: 2.0, uBend: 0.0,
    },
    set(t, u, c) {
      u.uFocus = Math.hypot(c.pos[0] - ALTAR[0], c.pos[1] - ALTAR[1] - 1.0, c.pos[2] - ALTAR[2]);
      u.uAper = 0.006;
    },
    post: (t) => grade(t, { exposure: 1.2, bloom: 0.12, threshold: 1.0 }),
    finish: () => ({ grade: { shadows: [0.01, 0.0, 0.03], highlights: [1.0, 0.93, 0.78], amount: 0.4 } }),
  });
};
