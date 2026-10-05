// s36-enter: "Enter the ark with your sons, / your wife, and your sons' wives." (the words of God)
// The open door in the ark's side, full of gold light, the timber ramp leading up to it, the storm
// sky and the wind, still dry. Four pairs of carried lamps (eight souls, the bearers never seen) climb
// the ramp one pair after another and pass into the gold; the last pair goes in as the line ends.
// The camera stands low beside the foot of the ramp and drifts in after them.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { ARK_GLSL, ARK_UNIFORMS, ARK, lampsAt, LAMP_PATH } from '/song/lib/x-flood-ark.js';
import { flashAt, toward } from '/song/lib/x-flood-sky.js';

export const kind = 'shader';

export default (P) => {
  // the procession: each pair 1.43 s behind the one before, walking 1.6 m/s; the last pair crosses
  // the threshold at 201.9
  const speed = 1.6, gap = 1.43;
  const start = 201.9 - 3 * gap - LAMP_PATH / speed;
  const strikes = [{ t: P.from + 3.0, k: 0.3 }, { t: P.from + 6.1, k: 0.22 }];
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.05);
    return {
      pos: [ARK.DX + 24 - 5 * p + d[0], 1.6 + 1.0 * p + d[1], ARK.W + ARK.RL + 6 - 4 * p],
      target: [ARK.DX - 3.0, 3.6 + 0.6 * p, ARK.W + 6.0],
      fov: 38 - 4 * p,
    };
  };
  return {
    name: 's36-enter', from: P.from, to: P.to,
    frag: ARK_GLSL + 'vec3 shade(vec2 fc) { return arkScene(fc); }',
    uniforms: { ...ARK_UNIFORMS, uRain: 0.0, uWet: 0.1, uSway: 1.1, uPart: 0.0, uGold: 1.05, uAper: 0.18 },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      // focus on the procession on the ramp
      u.uFocus.value = Math.hypot(c.pos[0] - ARK.DX, c.pos[1] - 2.5, c.pos[2] - (ARK.W + ARK.RL * 0.45));
      u.uLampP.value = lampsAt(t, start, gap, speed);
      const f = flashAt(t, strikes);
      u.uFlash.value = f.flash;
      u.uLightDir.value.set(...toward(c.pos, 200, 300, -380));
    },
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.12, threshold: 1.0, saturation: 1.05, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.04], highlights: [1.0, 0.92, 0.78], amount: 0.45 } }; },
  };
};
