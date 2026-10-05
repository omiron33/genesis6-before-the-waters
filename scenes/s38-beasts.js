// s38-beasts: "cattle, creatures that crawl, and wild beasts."
// Across the wide plain at night under the storm, pairs of animals walk unhurried toward the lit ark
// on its hill: elephants, giraffes, cattle, lions, horses, deer, camels, each a dark silhouette
// against the pale band low in the sky; the ark far off, its door gold, the window strip a thin line
// of light under the ridge. The camera, low in the grass, pans slowly with them toward the ark.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { GATHER_GLSL, GATHER_UNIFORMS, DOORX, RAMPZ1, hMacro, walker, packAnimals } from '/song/lib/x-gather.js';

export const kind = 'shader';

const F = [DOORX, RAMPZ1 + 2];
const C0 = [-40, 0, 104];
// pairs: kind, path, start delay (s), speed. A procession coming in along the hill toward the ramp,
// crossing the frame left to right in front of the lit ark.
const PAIRS = [
  [4, [[-26, 36], F], 0.0, 1.45],
  [2, [[-35, 41], F], 0.0, 1.15],
  [5, [[-43, 44], F], 0.0, 1.3],
  [0, [[-50, 47], F], 0.0, 1.2],
  [7, [[-57, 50], F], 0.0, 1.2],
  [1, [[-63, 52], F], 0.0, 1.25],
  [3, [[-69, 54], F], 0.0, 1.35],
];
export default (P) => {
  const camY = hMacro(C0[0], C0[2]) + 3.2;
  const cam = (t) => {
    const k = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.03);
    // a long lens, panning slowly with the procession toward the lit door
    const tx = -46 + 22 * k, tz = 44 - 10 * k;
    return { pos: [C0[0] + 5 * k + d[0], camY + d[1], C0[2] - 3 * k], target: [tx, hMacro(tx, tz) + 3.5, tz], fov: 24 };
  };
  const animals = (t) => {
    const out = [];
    PAIRS.forEach(([kind, path, dl, v], i) => {
      for (const side of [-1, 1]) {
        const sc = side > 0 ? 1.06 : 0.94;
        const w = walker(path, P.from - 2 + dl - (side > 0 ? 0.0 : 0.45), v, t, { side: side * (kind === 2 ? 2.4 : kind === 5 ? 1.7 : 1.2), kind, scale: sc, stride: kind === 2 ? 2.6 : kind === 5 ? 3.2 : 1.7 });
        out.push(w);
      }
    });
    return out;
  };
  return {
    name: 's38-beasts', from: P.from, to: P.to,
    frag: GATHER_GLSL + 'vec3 shade(vec2 fc) { return gather(fc); }',
    uniforms: { ...GATHER_UNIFORMS },
    camera: cam,
    update(t, u) {
      u.uFocus.value = 65; u.uAper.value = 0.0;
      u.uFlicker.value = 1.0; u.uExpo.value = 6.0; u.uTracks.value = 0; u.uScrub.value = 1;
      u.uDusk.value = 1.4; u.uDuskDir.value.set(0.35, 0, -1); u.uRimSky.value = 1.1; u.uMoon.value = 2.2; u.uMoonY.value = 0.2; u.uTreeOff.value = (1 << 11) | (1 << 6);
      packAnimals(animals(t), u);
    },
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.14, threshold: 0.9, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.93, 0.8], amount: 0.4 } }; },
  };
};
