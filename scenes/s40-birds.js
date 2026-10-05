// s40-birds: "Birds after their kind, cattle after their kind,"
// High beside the ark: along the roof ridge, pairs of birds come in out of the storm dark and settle,
// one pair after another (doves, ravens, small dark birds), wings flaring as they land; loose feathers
// drift on the wind. Below, in the gold of the open door, a pair of cattle walks up the ramp and in.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { GATHER_GLSL, GATHER_UNIFORMS, DOORX, RAMPZ1, walker, packAnimals, packBirds } from '/song/lib/x-gather.js';

export const kind = 'shader';

const RIDGE = 14.52 + 0.105;
// birds: [x on the ridge, kind, size, land time offset from scene start (s), approach from (dx, dy, dz)]
const BIRDS = [
  [DOORX - 4.0, 1, 1.1, -5, [0, 0, 0]], [DOORX - 3.3, 1, 1.05, -5, [0, 0, 0]],
  [DOORX + 7.0, 0, 0.8, -5, [0, 0, 0]], [DOORX + 7.45, 0, 0.78, -5, [0, 0, 0]],
  [DOORX + 2.0, 0, 0.82, 0.6, [-9, 5, 10]], [DOORX + 2.55, 0, 0.8, 0.95, [-10, 6, 12]],
  [DOORX + 12.0, 2, 0.62, 1.8, [6, 4, 12]], [DOORX + 12.4, 2, 0.6, 2.05, [7, 5, 11]],
  [DOORX - 9.0, 1, 1.1, 2.9, [-6, 6, 14]], [DOORX - 8.2, 1, 1.07, 3.25, [-8, 5, 13]],
];
const PATH = (dx) => [[DOORX - 10 + dx, 45], [DOORX + dx * 0.3, 28], [DOORX + dx * 0.1, RAMPZ1 + 1], [DOORX, 9], [DOORX - 1.0, -2]];

export default (P) => {
  const cam = (t) => {
    const k = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.03);
    return { pos: [DOORX + 12 - 2 * k + d[0], 7.0 + 0.6 * k + d[1], 41 - 2 * k], target: [DOORX + 2.5, 8.4 + 0.3 * k, 5], fov: 28 };
  };
  const birds = (t) => BIRDS.map(([x, kind, size, tl, from], i) => {
    const T = P.from + tl, dur = 2.2;
    const perch = [x, RIDGE + (size - 1) * 0.1, 0.05 * Math.sin(i * 7.0)];
    const k = clamp01(1 - (T - t) / dur);           // 0 .. 1 over the approach
    const e = 1 - Math.pow(1 - k, 2.2);
    const pos = [perch[0] + from[0] * (1 - e), perch[1] + from[1] * (1 - e) * (1 - e) + 0.6 * Math.sin(Math.PI * e) * (1 - e), perch[2] + from[2] * (1 - e)];
    const flying = t < T;
    const settle = clamp01((t - T) / 0.45);
    const fly = flying ? 1 : (1 - ease.inOut3(settle)) * 0.8;
    const heading = flying ? Math.atan2(-from[2], -from[0]) : (i % 2 ? 0.35 : -0.25) + 0.15 * Math.sin(t * 0.7 + i) + (Math.sin(i * 3.1) > 0 ? Math.PI : 0) * 0.0 + Math.PI * 0.5 * (i % 3 === 0 ? 1 : -1) * 0.2;
    const hop = !flying && settle >= 1 ? 0.02 * Math.max(0, Math.sin(t * 3 + i * 2)) : 0;
    return { x: pos[0], y: pos[1] + hop + (size * 2.5 - size) * 0.1, z: pos[2], heading, kind, fly, ph: t * (kind === 2 ? 30 : 18) + i, size: size * 2.5 };
  });
  const animals = (t) => [-1, 1].map((side) => walker(PATH(side), P.from - 21.0 - (side > 0 ? 0 : 0.5), 1.45, t, { side: side * 0.75, kind: 0, scale: side > 0 ? 1.05 : 0.95, stride: 1.7 })).filter((a) => !a.done);
  return {
    name: 's40-birds', from: P.from, to: P.to,
    frag: GATHER_GLSL + 'vec3 shade(vec2 fc) { return gather(fc); }',
    uniforms: { ...GATHER_UNIFORMS, uFeatherC: [DOORX + 4, 14.2, 3] },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFocus.value = 40; u.uAper.value = 0.02;
      u.uFlicker.value = 1.0; u.uExpo.value = 6.0; u.uRimSky.value = 0.8; u.uScrub.value = 0; u.uFeathers.value = 1;
      packAnimals(animals(t), u);
      packBirds(birds(t), u);
    },
    post(t) { return grade(t, { exposure: 1.5, bloom: 0.13, threshold: 1.0, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.93, 0.8], amount: 0.4 } }; },
  };
};
