// s46-end: "He did it all." Then the end title.
// "And the Lord shut him in" (Genesis 7:16): the great door in the ark's side swings slowly shut in
// heavy rain, the gold of the hold narrowing to a single upright line that thins and goes out; then
// darkness and rain, and BEFORE THE WATERS · GENESIS 6 in pale capitals over the dark (the title is
// drawn by the lyric layer). The camera stands at the foot of the wet ramp and barely moves in.
import { grade, ease, clamp01, drift, keys } from '/song/lib/look.js';
import { ARK_GLSL, ARK_UNIFORMS, ARK } from '/song/lib/x-flood-ark.js';
import { flashAt, toward } from '/song/lib/x-flood-sky.js';

export const kind = 'shader';

export default (P) => {
  const t0 = 249.45, t1 = 252.55;          // the door's swing, from "He" to "all"
  const door = (t) => {
    // slow to start (a great weight), steady, then a long last inch: the light held in a line
    return keys(t, [[t0, 180], [251.65, 16, ease.inOut3], [252.45, 2.2, ease.out3], [253.4, 0.0, ease.inOut3]]);
  };
  const strikes = [{ t: P.from + 0.5, k: 0.25 }];
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.03);
    return {
      pos: [ARK.DX + 8.5 - 2.5 * p + d[0], 1.6 + 0.4 * p + d[1], ARK.W + ARK.RL + 9 - 3 * p],
      target: [ARK.DX - 0.6, ARK.DY0 + 2.6, ARK.W],
      fov: 36 - 3 * p,
    };
  };
  return {
    name: 's46-end', from: P.from, to: P.to,
    frag: ARK_GLSL + 'vec3 shade(vec2 fc) { return arkScene(fc); }',
    uniforms: { ...ARK_UNIFORMS, uRain: 1.0, uWet: 1.0, uWind: 0.22, uSway: 1.0, uGold: 1.0, uAper: 0.14, uRainTint: [2.4, 2.4, 2.6] },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFocus.value = Math.hypot(c.pos[0] - ARK.DX, c.pos[1] - ARK.DY0 - 2.6, c.pos[2] - ARK.W);
      u.uDoor.value = door(t);
      // once shut, the light in the seam thins and goes out
      u.uGold.value = 1.0 - 0.9 * ease.inOut3(clamp01((t - 252.7) / 0.9));
      const f = flashAt(t, strikes);
      u.uFlash.value = f.flash;
      u.uLightDir.value.set(...toward(c.pos, 250, 300, -400));
    },
    post(t) { return grade(t, { exposure: 1.75, bloom: 0.15, threshold: 0.85, saturation: 1.0, vignette: 0.55 }); },
    // darkness under the title, and to black with the last note
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.045], highlights: [1.0, 0.92, 0.78], amount: 0.45 }, fade: keys(t, [[252.9, 0], [253.6, 0.55], [P.to - 0.5, 0.7], [P.to, 1]]) }; },
  };
};
