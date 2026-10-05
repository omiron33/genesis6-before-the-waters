// s33-perish: "All flesh that breathes beneath heaven / will perish;" (God's foretelling)
// The flood as God foretells it, a vision in cold ash: the empty valley city of Cain at night in rain
// falling in sheets. Water pours off the parapet of the colossal cyclopean wall and its towers in
// falls; the street before the great gate is a river running toward us; the bronze braziers before
// the wall hiss out one by one under steam, then the fire in the gate; the last goes out at the end.
import { grade, ease, clamp01, drift, keys } from '/song/lib/look.js';
import { DEEP_GLSL, DEEP_UNIFORMS, FORETOLD } from '/song/lib/x-flood-deep.js';
import { flashAt, toward } from '/song/lib/x-flood-sky.js';

export const kind = 'shader';

export default (P) => {
  // the fires drown: brazier, brazier, the gate on "perish", the last brazier at the end
  const outs = [178.55, 179.45, 181.0, 180.35];
  const strikes = [{ t: 177.6, k: 0.6 }, { t: 179.37, k: 0.8, bolt: true }, { t: 180.62, k: 0.5 }];
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.04);
    return {
      pos: [4 - 3 * p + d[0], 1.5 + 0.9 * p + d[1], 36 - 9 * p],
      target: [1 + 3 * p, 13.5 + 1.0 * p, 0],
      fov: 60 - 4 * p,
    };
  };
  return {
    name: 's33-perish', from: P.from, to: P.to,
    frag: DEEP_GLSL + 'vec3 shade(vec2 fc) { return cityScene(fc); }',
    uniforms: { ...DEEP_UNIFORMS, uRain: 1.0, uWind: 0.3, uLevel: 0.5, uFlow: 3.0, uAper: 0.0, uOut: outs, uBolt: [-120, 7.3, -300] },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      // each fire sputters and drowns in a few tenths of a second
      const k = (o) => 1 - ease.inOut3(clamp01((t - o + 0.35) / 0.45));
      u.uFire.value = [k(outs[0]), k(outs[1]), k(outs[2]), k(outs[3])];
      u.uLevel.value = 0.4 + 0.5 * clamp01((t - P.from) / (P.to - P.from));
      const f = flashAt(t, strikes);
      u.uFlash.value = f.flash; u.uBoltOn.value = f.bolt;
      u.uLightDir.value.set(...toward(c.pos, -120, 300, -300));
    },
    post(t) { return grade(t, { exposure: 1.45, ...FORETOLD }); },
    finish(t) { return { grade: { shadows: [0.01, 0.012, 0.016], highlights: [0.94, 0.95, 0.97], amount: 0.5 } }; },
  };
};
