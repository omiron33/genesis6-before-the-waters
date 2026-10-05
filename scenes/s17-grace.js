// s17-grace: "But Noe found grace before the Lord God." The hero moment, where the drop ends and the
// song opens into melodic light. The storm cloud hangs low and dark over Noe's hill at dusk; on "But"
// it begins to part, and through the widening gap a broad shaft of clean gold light falls on the
// grove, the cedars and the small stone house with its lamp in the door. The camera rises slowly
// toward the lit grove as the gold spreads over it.
import { grade, ease, clamp01, linesAt, wordIn, drift } from '/song/lib/look.js';
import { groveScene } from '/song/lib/x-grove-scene.js';
import { gh } from '/song/lib/x-grove.js';

export const kind = 'shader';

export default (P) => {
  const [l1] = linesAt(P.from - 0.6, 'But Noe found grace');
  const tBut = wordIn(l1, 'But').start, tGrace = wordIn(l1, 'grace').start;
  const span = P.to - P.from;
  // the gap opens from "But", reaching the grove by "grace", and keeps widening
  const open = (t) => ease.inOut3(clamp01((t - tBut + 0.3) / (tGrace - tBut + 1.2)));
  // low in the long grass below the hill, rising slowly toward the grove
  const camera = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / span));
    const d = drift(t, 0.05);
    const x = 22 - 6 * p, z = 108 - 14 * p;
    const g = gh(x, z);
    return { pos: [x + d[0], g + 0.8 + 6.0 * p + d[1], z], target: [-4, 30 + 4 * p, 0], fov: 46 };
  };
  return groveScene(P, {
    name: 's17-grace',
    camera,
    uniforms: {
      uSunDir: [-0.15, 0.52, -0.84], uSunCol: [10.0, 7.0, 3.4], uSunVis: 0.0, uGrassH: 0.45, uGrassD: 30.0,
      uSkyZen: [0.012, 0.012, 0.022], uSkyHor: [0.1, 0.07, 0.1], uCloudAmb: [0.15, 0.12, 0.19], uAmbCol: [0.022, 0.02, 0.032],
      uCloud: 0.95, uGate: 1.0, uHaze: 0.0012, uFogCol: [0.03, 0.026, 0.04], uLampH: 1.0, uRays: 1.0,
    },
    set(t, u) {
      const o = open(t);
      u.uGapR = 3 + 50 * o + 1.2 * (t - P.from);
      u.uGrace = o;
      u.uRays = 0.3 + 3.5 * o;
      u.uKeyK = 0.05 + 0.95 * o;
    },
    post: (t) => grade(t, { exposure: 1.3, bloom: 0.12, threshold: 1.0 }),
    finish: () => ({ grade: { shadows: [0.01, 0.0, 0.03], highlights: [1.0, 0.93, 0.78], amount: 0.4 } }),
  });
};
