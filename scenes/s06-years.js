// s06-years: "they are flesh. Their days will be one hundred twenty years." A felled cedar's cut
// stump in Noe's grove at dusk, the cross-section fresh and wet; the last warm light of the low sun
// rakes across the growth rings and the saw marks; sawdust drifts in the light. The camera glides
// in over the rings, counting time, and settles on their centre.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { groveScene } from '/song/lib/x-grove-scene.js';
import { STUMP } from '/song/lib/x-grove.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  const top = [STUMP[0] + 0.05, STUMP[1] + 0.55, STUMP[2] + 0.035];
  const camera = (t) => {
    const p = clamp01((t - P.from) / span);
    const e = 1 - Math.pow(1 - p, 2.2);
    const d = drift(t, 0.003);
    const a = [0.35, 0.55, 1.55], b = [0.1, 0.78, 1.1];
    const pos = a.map((v, i) => top[i] + v + (b[i] - v) * e + (d[i] ?? 0));
    const tg = [top[0] - 0.05, top[1] + 0.05 * (1 - e) + 0.2 * e, top[2] - 0.35 * (1 - e) - 0.25 * e];
    return { pos, target: tg, fov: 38 };
  };
  return groveScene(P, {
    name: 's06-years',
    camera,
    uniforms: {
      uSunDir: [-0.95, 0.12, 0.28], uSunCol: [7.5, 4.2, 2.0], uSunVis: 1.0,
      uSkyZen: [0.03, 0.03, 0.05], uSkyHor: [0.2, 0.12, 0.13], uCloudAmb: [0.09, 0.07, 0.11], uAmbCol: [0.03, 0.03, 0.045],
      uCloud: 0.6, uGate: 0.0, uGrace: 0.0, uGapR: 0, uKeyK: 1.0, uShadowR: 1000.0,
      uHaze: 0.004, uFogCol: [0.06, 0.045, 0.06], uLampH: 1.0, uRays: 0.0, uDust: 1.0,
    },
    set(t, u, c) {
      u.uFocus = Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]);
      u.uAper = 0.012;
    },
    post: (t) => grade(t, { exposure: 1.15, bloom: 0.1, threshold: 1.0 }),
    finish: () => ({ grade: { shadows: [0.01, 0.0, 0.03], highlights: [1.0, 0.92, 0.78], amount: 0.35 } }),
  });
};
