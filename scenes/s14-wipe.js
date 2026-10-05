// s14-wipe: "God said, I will wipe away / the people I have made," (God speaks from "I will").
// A hard wind across an empty village of mud-brick at night: dust and ash in sheets down the lane,
// backlit by a cold moon breaking through the storm; doors standing open on dark rooms; a cold hearth
// in the foreground; the footprints in the lane filling and vanishing. The camera moves low up the
// lane against the wind. At the end the dust sheet closes over the frame.
import { grade, ease, clamp01, drift, keys } from '/song/lib/look.js';
import { VILLAGE_GLSL, VILLAGE_UNIFORMS } from '/song/lib/x-storm-village.js';

export const kind = 'shader';

export default (P) => {
  const span = P.to - P.from;
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / span));
    const d = drift(t, 0.012);
    return { pos: [0.3 + 0.2 * p + d[0], 0.6 + 0.1 * p + d[1], -1.0 + 3.0 * p], target: [-0.6, 1.3 + 0.15 * p, 22.0], fov: 46, roll: -0.01 };
  };
  return {
    name: 's14-wipe', from: P.from, to: P.to,
    frag: VILLAGE_GLSL + 'vec3 shade(vec2 fc) { return village(fc); }',
    uniforms: { ...VILLAGE_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      // the wind rises through the line and gusts on "wipe away"
      u.uGust.value = keys(t, [[P.from, 0.55], [P.from + 2.4, 0.8], [77.3, 1.2], [78.0, 0.95], [P.to - 0.6, 1.3], [P.to, 1.5]], ease.inOut3);
      // the prints vanish from the near end up the lane, fastest on "wipe away"
      u.uErase.value = keys(t, [[P.from, -1.0], [76.4, 2.0], [78.2, 9.0], [P.to, 14.0]], ease.inOut3);
      u.uVeil.value = ease.in2(clamp01((t - (P.to - 0.7)) / 0.7));
      u.uFocus.value = 4.0 + 3.0 * clamp01((t - P.from) / span);
    },
    post(t) { return grade(t, { exposure: 1.7, bloom: 0.12, threshold: 0.9, saturation: 0.85, vignette: 0.5, contrast: 1.05, lift: [0.006, 0.007, 0.009] }); },
    finish() { return { grade: { shadows: [0.0, 0.01, 0.025], highlights: [0.94, 0.96, 1.0], amount: 0.45 } }; },
  };
};
