// s21-sons: "Noe fathered three sons: Shem, Ham and Japheth." Three young cedars planted side by
// side at the grove's edge, each with a small clay lamp at its foot. The lamps catch one after
// another on "Shem", "Ham" and "Japheth", flaring and settling, and then burn together. The great
// cedars stand dark behind them under the gold; the camera eases in low over the grass.
import { grade, ease, clamp01, drift, linesAt, wordIn, project } from '/song/lib/look.js';
import { groveScene } from '/song/lib/x-grove-scene.js';
import { CEDAR_AT, YOUNG, LAMP_S } from '/song/lib/x-grove.js';

export const kind = 'shader';

export default (P) => {
  const [l2] = linesAt(P.from + 1.5, 'Shem, Ham and Japheth');
  const ign = [wordIn(l2, 'Shem').start, wordIn(l2, 'Ham').start, wordIn(l2, 'Japheth').start];
  const span = P.to - P.from;
  const C = CEDAR_AT[YOUNG[1]];
  const nrm = [0.5, 0.87];
  // a lamp catches: a quick flare that settles
  const lit = (t, t0) => { const x = t - t0 + 0.04; if (x <= 0) return 0; return Math.min(1.25, 1 - Math.exp(-x * 10) * Math.cos(x * 16) * 0.9 + 0.8 * Math.exp(-x * 5) * Math.min(1, x / 0.04)); };
  const camera = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / span));
    const d = drift(t, 0.012);
    const dist = 10.5 - 1.6 * e;
    return { pos: [C[0] + nrm[0] * dist - 0.5 * e + d[0], C[1] + 1.0 + 0.1 * e + d[1], C[2] + nrm[1] * dist], target: [C[0] - 0.3, C[1] + 1.25, C[2] - 0.4], fov: 38 };
  };
  return groveScene(P, {
    name: 's21-sons',
    camera,
    uniforms: {
      uSunDir: [-0.25, 0.9, -0.36], uSunCol: [7.0, 5.0, 2.6], uSunVis: 1.0,
      uSkyZen: [0.012, 0.012, 0.022], uSkyHor: [0.14, 0.1, 0.13], uCloudAmb: [0.15, 0.115, 0.17], uAmbCol: [0.018, 0.016, 0.026],
      uCloud: 0.95, uGate: 1.0, uGrace: 1.0, uGapR: 45, uGapC: [C[0] * 0.4, C[2] * 0.4], uKeyK: 1.0, uShadowR: 1000.0, uHaze: 0.004, uFogCol: [0.04, 0.032, 0.04], uLampH: 1.0, uRays: 5.0,
    },
    set(t, u, c) {
      // Shem's lamp is the leftmost in the frame, Japheth's the rightmost
      const xs = LAMP_S.map((p, i) => [project(c, p).x, i]).sort((a, b) => a[0] - b[0]);
      const k = [0, 0, 0]; xs.forEach(([, i], j) => { k[i] = lit(t, ign[j]); });
      u.uLampS = k;
      u.uFocus = Math.hypot(c.pos[0] - C[0], c.pos[2] - C[2]);
      u.uAper = 0.025;
    },
    post: (t) => grade(t, { exposure: 1.25, bloom: 0.14, threshold: 0.9 }),
    finish: () => ({ grade: { shadows: [0.01, 0.0, 0.03], highlights: [1.0, 0.93, 0.78], amount: 0.4 } }),
  });
};
