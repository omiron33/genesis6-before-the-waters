// s18-generations: "These are the generations of Noe." Within the grove in the gold light: tall
// straight cedars, the small stone house with its lamp-lit doorway, the well, the old olive tree,
// tools leaned by the door. The gold falls from behind the house through the cedars in long shafts;
// the camera glides between the trunks toward the door.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { groveScene } from '/song/lib/x-grove-scene.js';
import { HOUSE } from '/song/lib/x-grove.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  const camera = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / span));
    const d = drift(t, 0.02);
    const a = [-6.5, 0, 14.5], b = [-1.4, 0, 8.8];
    const x = a[0] + (b[0] - a[0]) * p, z = a[2] + (b[2] - a[2]) * p;
    return { pos: [x + d[0], HOUSE[1] + 1.35 - 0.2 * p + d[1] + 12.0 * Math.exp(-(x * x + z * z) / 4608) - 12.0 * Math.exp(-(0) / 4608), z], target: [HOUSE[0] + 0.6, HOUSE[1] + 1.4, HOUSE[2] + 2.3], fov: 42 };
  };
  return groveScene(P, {
    name: 's18-generations',
    camera,
    uniforms: {
      uSunDir: [-0.25, 0.9, -0.36], uSunCol: [9.0, 6.2, 2.9], uSunVis: 1.0,
      uSkyZen: [0.012, 0.012, 0.022], uSkyHor: [0.06, 0.045, 0.07], uCloudAmb: [0.06, 0.05, 0.08], uAmbCol: [0.016, 0.015, 0.024],
      uCloud: 0.95, uGate: 1.0, uGrace: 1.0, uGapR: 48, uKeyK: 1.0, uHaze: 0.003, uFogCol: [0.05, 0.04, 0.05], uLampH: 1.0, uRays: 3.0, uRayMax: 90.0,
    },
    set(t, u, cam) {
      u.uGapR = 48 + 1.2 * (t - P.from);
      const c = cam;
      u.uFocus = Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]);
      u.uAper = 0.035;
    },
    post: (t) => grade(t, { exposure: 1.45, bloom: 0.12, threshold: 1.0 }),
    finish: () => ({ grade: { shadows: [0.01, 0.0, 0.03], highlights: [1.0, 0.93, 0.78], amount: 0.4 } }),
  });
};
