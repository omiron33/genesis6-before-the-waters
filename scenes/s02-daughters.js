// s02-daughters: "daughters were born to them."
// Close in a window of the valley city at dusk; no one there. On the sill a polished bronze mirror,
// gold earrings and a bone comb, a clay lamp burning; in the room close to the lens a loom with
// half-woven crimson cloth. Outside, the city's fires and smoke, and high in the violet sky a cold
// star-white light that catches the bronze and the gold as if the gifts came from it. The camera
// drifts in; the focus racks from the loom's threads to the mirror's glint.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { CITY_GLSL, CITY_UNIFORMS } from '/song/lib/x-city.js';
import { SILL_GLSL } from '/song/lib/x-city-sill.js';

export const kind = 'shader';

export default (P) => {
  const dur = P.to - P.from;
  const cam = (t) => {
    const x = clamp01((t - P.from) / dur);
    const e = ease.inOut3(x);
    const d = drift(t, 0.002);
    const pos = [-0.12 + 0.05 * e + d[0], 0.24 - 0.03 * e + d[1], -1.05 + 0.3 * e];
    const target = [0.1 + 0.02 * e, 0.12, 0.3];
    return { pos, target, fov: 38 };
  };
  return {
    name: 's02-daughters', from: P.from, to: P.to,
    frag: CITY_GLSL + SILL_GLSL + 'vec3 shade(vec2 fc) { return citySill(fc); }',
    uniforms: { ...CITY_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      // rack focus: the loom's threads, then (on "born") across to the mirror
      const k = ease.inOut3(clamp01((t - (P.from + 1.0)) / 1.4));
      const loom = Math.abs(-0.45 - c.pos[2]) + 0.03;
      const mir = Math.hypot(0.3 - c.pos[0], 0.13 - c.pos[1], 0.3 - c.pos[2]);
      u.uFocus.value = loom + (mir - loom) * k;
      u.uAper.value = 0.012;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.1, threshold: 1.0, saturation: 1.04, vignette: 0.5, contrast: 1.04 }); },
    finish(t) { return { leak: { amount: 0.04, warm: [1.0, 0.55, 0.25], cool: [0.6, 0.65, 0.9], speed: 0.06 }, grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.93, 0.82], amount: 0.35 } }; },
  };
};
