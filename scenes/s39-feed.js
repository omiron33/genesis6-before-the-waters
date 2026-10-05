// s39-feed: "Feed them there with you, male and female."
// The ramp and the open door from the foot of the hill: pairs pass up the timber into the gold,
// dark silhouettes against the lamplit hold where stalls, mangers and hay wait for them; their long
// shadows run back down the ramp toward us. The camera eases in, low and a little to the side.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { GATHER_GLSL, GATHER_UNIFORMS, DOORX, RAMPZ1, walker, packAnimals } from '/song/lib/x-gather.js';

export const kind = 'shader';

const PATH = (dx) => [[DOORX - 14 + dx, 50], [DOORX - 1.5 + dx * 0.3, 30], [DOORX + dx * 0.1, RAMPZ1 + 1], [DOORX, 9], [DOORX - 1.0, -2]];
// pairs: kind, delay (s), speed, side spacing, stride
const PAIRS = [
  [0, -23.5, 1.5, 0.75, 1.7],    // cattle, already on the ramp at the start
  [6, -19.5, 1.4, 0.5, 1.1],     // sheep at the foot of the ramp
  [3, -14.0, 1.6, 0.6, 1.6],     // deer coming up behind
];
export default (P) => {
  const cam = (t) => {
    const k = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.02);
    return { pos: [DOORX + 10 - 1.5 * k + d[0], 1.4 + 0.2 * k + d[1], 42 - 5 * k], target: [DOORX - 0.6, 3.2, 11], fov: 32 };
  };
  const animals = (t) => {
    const out = [];
    PAIRS.forEach(([kind, dl, v, sp, stride]) => {
      for (const side of [-1, 1]) {
        out.push(walker(PATH(side), P.from + dl - (side > 0 ? 0 : 0.5), v, t, { side: side * sp, kind, scale: side > 0 ? 1.05 : 0.95, stride }));
      }
    });
    return out.filter((a) => !a.done);
  };
  return {
    name: 's39-feed', from: P.from, to: P.to,
    frag: GATHER_GLSL + 'vec3 shade(vec2 fc) { return gather(fc); }',
    uniforms: { ...GATHER_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFocus.value = Math.hypot(c.pos[0] - DOORX, c.pos[2] - 18); u.uAper.value = 0.025;
      u.uFlicker.value = 1.0; u.uExpo.value = 6.0; u.uRimSky.value = 0.8; u.uScrub.value = 0;
      packAnimals(animals(t), u);
    },
    post(t) { return grade(t, { exposure: 1.5, bloom: 0.13, threshold: 1.0, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.93, 0.8], amount: 0.4 } }; },
  };
};
