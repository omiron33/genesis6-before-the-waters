// s45-obey: "Noe did everything / the Lord God commanded him."
// The finished ark seen whole from a distance, small and complete on its hill among the cedars,
// through the first steady rain of the night: the window strip under the ridge glowing gold, the
// door a warm square, the storm heavy above. A slow, reverent push toward it.
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { ARK_GLSL, ARK_UNIFORMS, moonFor } from '/song/lib/x-flood-ark.js';
import { flashAt, toward } from '/song/lib/x-flood-sky.js';

export const kind = 'shader';

export default (P) => {
  const strikes = [{ t: P.from + 2.4, k: 0.35 }, { t: P.from + 6.9, k: 0.28 }];
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.08);
    return {
      pos: [44 - 8 * p + d[0], 19 - 3 * p + d[1], 110 - 22 * p],
      target: [-2 - 1 * p, 2.0 + 0.5 * p, 0],
      fov: 36 - 3 * p,
    };
  };
  return {
    name: 's45-obey', from: P.from, to: P.to,
    frag: ARK_GLSL + 'vec3 shade(vec2 fc) { return arkScene(fc); }',
    uniforms: { ...ARK_UNIFORMS, uRain: 0.75, uWet: 0.8, uWind: 0.18, uSway: 0.8, uGold: 1.4, uRainTint: [1.6, 1.6, 1.75], uAper: 0.0 },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      const f = flashAt(t, strikes);
      u.uFlash.value = f.flash;
      u.uLightDir.value.set(...toward(c.pos, 300, 280, -500));
      // the moon glows behind the cloud beyond the ark: the roof and the wet ground mirror it
      { const dx = -c.pos[0], dz = -c.pos[2], l = Math.hypot(dx, dz); u.uMoonDir.value.set(dx / l, 0.2, dz / l); }
      u.uMirror.value.set(...moonFor(c.pos, 0.25));
      // the rain begins: first drops, then steady
      u.uRain.value = 0.25 + 0.55 * ease.inOut3(clamp01((t - P.from) / 3.0));
    },
    post(t) { return grade(t, { exposure: 1.85, bloom: 0.14, threshold: 0.9, saturation: 1.02, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.045], highlights: [1.0, 0.92, 0.78], amount: 0.45 } }; },
  };
};
