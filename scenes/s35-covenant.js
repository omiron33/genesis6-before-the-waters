// s35-covenant: "But I will establish / My covenant with you." (the words of God)
// Out of the white flash that ends the vision of the flood: the real ark, whole and dry on its hill
// under a heavy storm sky, seen from below on the slope. Gold glows from the window strip under the
// ridge and from the open door; the cloud parts a little above it; the camera rises toward the light.
import { grade, ease, keys, clamp01, drift } from '/song/lib/look.js';
import { ARK_GLSL, ARK_UNIFORMS } from '/song/lib/x-flood-ark.js';
import { flashAt, toward } from '/song/lib/x-flood-sky.js';
import { moonFor } from '/song/lib/x-flood-ark.js';

export const kind = 'shader';

export default (P) => {
  const T = (x) => P.from + x;
  const strikes = [{ t: T(2.25), k: 0.5 }, { t: T(4.5), k: 0.35 }];
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.12);
    return {
      pos: [-92 + 56 * p + d[0], -6 + 22.0 * p + d[1], 94 - 42 * p],
      target: [-6 + 12 * p, 8.0 - 2.0 * p, 4 * p],
      fov: 42 - 6 * p,
    };
  };
  return {
    name: 's35-covenant', from: P.from, to: P.to,
    frag: ARK_GLSL + 'vec3 shade(vec2 fc) { return arkScene(fc); }',
    uniforms: { ...ARK_UNIFORMS, uRain: 0.0, uWet: 0.1, uSway: 0.8, uPart: 1.0, uPartDir: [0.05, 0.75, -0.66], uGold: 1.0, uAper: 0.12 },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFocus.value = Math.hypot(c.pos[0] - 6, c.pos[1] - 6, c.pos[2] - 11);
      const f = flashAt(t, strikes);
      u.uFlash.value = f.flash;
      u.uLightDir.value.set(...toward(c.pos, -160, 260, -420));
      u.uPartDir.value.set(...toward(c.pos, 15, 75, -170));
      // the moon glows low behind the camera, where the wet pitch mirrors it
      u.uMoonDir.value.set(...moonFor(c.pos));
      u.uMirror.value.set(...moonFor(c.pos, 0.3));
      // the cloud parts a little above the ark as God speaks
      u.uPart.value = 0.25 + 0.75 * ease.inOut3(clamp01((t - T(0.5)) / 5.5));
      u.uGold.value = 0.85 + 0.25 * ease.inOut3(clamp01((t - T(1.0)) / 4.0));
      // out of the white flash
      u.uWhite.value = Math.max(0, 1 - (t - P.from) / 0.1) ** 6;   // ~6 frames out of the flash
    },
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.12, threshold: 1.0, saturation: 1.05, vignette: 0.5 }); },
    finish(t) { return { flare: { amount: 0.06, threshold: 0.85, tint: [1.0, 0.8, 0.55], length: 0.3 }, grade: { shadows: [0.0, 0.015, 0.04], highlights: [1.0, 0.92, 0.78], amount: 0.45 } }; },
  };
};
