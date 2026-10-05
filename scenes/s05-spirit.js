// s05-spirit · "The Lord God said, / My Spirit will not stay / with these men forever;" (22.25-26.88).
// The rough stone altar on a lower ridge of the empty mountain at dusk, its thin smoke rising straight
// into the bruised sky above glowing coals. As God speaks a wind comes: the smoke bends, frays and is
// torn away into the darkening sky; the coals dim. A low, slow push.
import { grade, ease, clamp01, mix, keys, linesAt } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS } from '/song/lib/x-mount.js';
import { ground } from '/song/lib/x-mount-ground.js';

export const kind = 'shader';
const GY = ground(0, 0.042, 5);   // the altar's level place (km), as the GLSL sets it

export default (P) => {
  const [L0, L1, L2] = linesAt(P.from - 0.6, 'The Lord God said', 'My Spirit', 'with these men');
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const e = 0.3 * p + 0.7 * ease.inOut3(p);
    const pos = [mix(0.003, 0.0022, e), GY + mix(0.0016, 0.0015, e), 0.042 + mix(0.0078, 0.0056, e)];
    const target = [mix(0.0006, 0.0012, e), GY + mix(0.0019, 0.0022, e), 0.039];
    return { pos, target, fov: mix(44, 42, e), roll: -0.01 };
  };
  return {
    name: 's05-spirit', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uAltar: [1, 1, 1], uSmokeBend: 0, uKindle: 0.9, uAper: 0.00004, uFocus: 0.008 },
    camera: cam,
    update(t, u) {
      u.uWindT.value = t * (1 + 3 * clamp01((t - L1.start) / 2));
      const bend = keys(t, [[P.from, 0.0], [L1.start - 0.2, 0.02], [L1.end, 0.65], [L2.end, 1.0]]);
      u.uSmokeBend.value = bend;
      u.uAltar.value.set(1, keys(t, [[P.from, 1.1], [L1.start, 1.0], [P.to, 0.5]]), keys(t, [[P.from, 1.0], [L2.start, 0.9], [P.to, 0.45]]));
      const c = cam(t);
      u.uFocus.value = Math.hypot(c.pos[0], c.pos[1] - GY - 0.001, c.pos[2] - 0.042);
    },
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.14, threshold: 0.9, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.04], highlights: [0.98, 0.95, 0.94], amount: 0.45 } }; },
  };
};
