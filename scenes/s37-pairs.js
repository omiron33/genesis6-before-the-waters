// s37-pairs: "Bring pairs of every living kind / into the ark with you:" (God speaks).
// The trodden earth before the ark at night under the storm: paired tracks of every kind (cloven
// hooves, paws, birds' feet, the small hands and tail drags of crawling things) run in from the dark
// and converge on the ramp. The camera travels low along them toward the gold door.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { GATHER_GLSL, GATHER_UNIFORMS, DOORX } from '/song/lib/x-gather.js';

export const kind = 'shader';

export default (P) => {
  const cam = (t) => {
    const k = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.03);
    const z = 41 - 12 * k;
    return { pos: [DOORX + 2.2 - 1.0 * k + d[0], 0.8 + 0.25 * k + d[1], z], target: [DOORX + 6.0, 1.3 + 0.6 * k, z - 18], fov: 44 };
  };
  return {
    name: 's37-pairs', from: P.from, to: P.to,
    frag: GATHER_GLSL + 'vec3 shade(vec2 fc) { return gather(fc); }',
    uniforms: { ...GATHER_UNIFORMS, uFeatherC: [DOORX - 4, 0.4, 26] },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFocus.value = 6.5 + 1.5 * clamp01((t - P.from) / (P.to - P.from)); u.uAper.value = 0.04;
      u.uFlicker.value = 1.0; u.uExpo.value = 6.0; u.uScrub.value = 0; u.uMoon.value = 2.2;
    },
    post(t) { return grade(t, { exposure: 1.5, bloom: 0.12, threshold: 1.0, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.93, 0.8], amount: 0.4 } }; },
  };
};
