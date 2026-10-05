// s43-food: "Gather every kind of food that you eat;" (God speaks)
// The storeroom on the middle deck by lamplight: tall clay jars of grain in rows, baskets heaped with
// figs and dates, standing sheaves of wheat, glazed jars of oil, strings of dried fruit hanging from
// the beams. The camera glides along the aisle past them, the near jars soft, the light warm.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { HOLD_GLSL, HOLD_UNIFORMS, DECKS } from '/song/lib/x-hold.js';

export const kind = 'shader';

export default (P) => {
  const cam = (t) => {
    const k = ease.inOut2 ? ease.inOut2(clamp01((t - P.from) / (P.to - P.from))) : clamp01((t - P.from) / (P.to - P.from));
    const d = drift(t, 0.008);
    const x = 6.0 + 3.6 * k;
    return { pos: [x + d[0], DECKS[1] + 1.7 + d[1], 0.4], target: [x + 4.5, DECKS[1] + 0.8, -4.2], fov: 50 };
  };
  return {
    name: 's43-food', from: P.from, to: P.to,
    frag: HOLD_GLSL + 'vec3 shade(vec2 fc) { return hold(fc); }',
    uniforms: { ...HOLD_UNIFORMS },
    camera: cam,
    update(t, u) {
      u.uFocus.value = 5.5; u.uAper.value = 0.03; u.uExpo.value = 6.0;
    },
    post(t) { return grade(t, { exposure: 1.4, bloom: 0.12, threshold: 1.0, vignette: 0.5 }); },
    finish(t) { return { leak: { amount: 0.04, warm: [1.0, 0.55, 0.25], cool: [0.6, 0.3, 0.3], speed: 0.05 }, grade: { shadows: [0.0, 0.0, 0.0], highlights: [1.0, 0.93, 0.8], amount: 0.35 } }; },
  };
};
