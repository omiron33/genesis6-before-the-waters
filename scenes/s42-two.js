// s42-two: "pairs of each will come to you, male and female, to be fed."
// From inside the hold, looking out through the great door: the frame of lamplit cedar, the ramp in
// its gold, the dark empty plain and the storm beyond. The last pair, a lion and a lioness, cross the
// ramp and come up into the light, dark shapes rimmed in gold; the camera gives way before them.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { GATHER_GLSL, GATHER_UNIFORMS, DOORX, RAMPZ1, SILL, walker, packAnimals } from '/song/lib/x-gather.js';

export const kind = 'shader';

const PATH = (dx) => [[DOORX + 6 + dx, 40], [DOORX + 1.0 + dx * 0.4, RAMPZ1 + 2], [DOORX + dx * 0.2, RAMPZ1 - 1], [DOORX, 9], [DOORX - 1.5, 0]];
export default (P) => {
  const cam = (t) => {
    const k = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.012);
    return { pos: [DOORX - 0.9 + 0.3 * k + d[0], SILL + 2.1 + d[1], 3.6 - 1.2 * k], target: [DOORX + 0.2, SILL - 0.6 - 0.2 * k, 26], fov: 46 };
  };
  const animals = (t) => [-1, 1].map((side) => walker(PATH(side), P.from - 15.0 - (side > 0 ? 0 : 0.7), 1.45, t, { side: side * 0.6, kind: 1, scale: side > 0 ? 1.06 : 0.94, stride: 1.5 }));
  return {
    name: 's42-two', from: P.from, to: P.to,
    frag: GATHER_GLSL + 'vec3 shade(vec2 fc) { return gather(fc); }',
    uniforms: { ...GATHER_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      const a = animals(t);
      u.uFocus.value = Math.max(3, Math.hypot(a[1].x - c.pos[0], a[1].z - c.pos[2])); u.uAper.value = 0.02;
      u.uFlicker.value = 1.0; u.uExpo.value = 6.0; u.uRimSky.value = 0.0; u.uScrub.value = 1;
      packAnimals(a, u);
    },
    post(t) { return grade(t, { exposure: 1.5, bloom: 0.13, threshold: 1.0, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.93, 0.8], amount: 0.4 } }; },
  };
};
