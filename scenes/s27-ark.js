// s27-ark: "Make yourself an ark / of square timber," (the words of God).
// Out of the white flash and the black: one clay lamp burning in the darkness on Noe's hill (the lamp
// survives). The camera follows its light down onto a squared cedar beam on trestles, dressed with the
// adze, curls of shaving on it, the adze and the mallet resting where they were set down; then glides
// along the beam toward the keel and the first frames of the ark standing up into the storm sky, their
// lamps waking one by one.
import { grade } from '/song/lib/look.js';
import { BEAM_FRAG, BEAM_UNIFORMS, LAMP } from '/song/lib/x-yard-beam.js';
import { path, warp, dist, sstep } from '/song/lib/x-ark-cams.js';

export const kind = 'shader';

export const s27cam = (P) => {
  const T0 = P.from, T1 = P.to;
  const keys = [
    { t: T0, pos: [-0.62, 1.6, 1.32], target: [-0.02, 1.58, 0.5], fov: 34 },
    { t: T0 + 1.1, pos: [-0.95, 1.6, 1.3], target: [-0.1, 1.45, 0.4], fov: 36 },
    { t: T0 + 2.3, pos: [-1.85, 1.42, 0.98], target: [0.5, 1.02, 0.0], fov: 40 },
    { t: T1, pos: [-0.2, 1.42, 0.5], target: [5.0, 1.05, -0.3], fov: 42 },
  ];
  return (t) => path(keys, warp(t, T0, T1, 0.3, 0.5));
};

export default (P) => {
  const cam = s27cam(P);
  const adze = [0.62, 1.02, 0.02];
  return {
    name: 's27-ark', from: P.from, to: P.to,
    frag: BEAM_FRAG,
    uniforms: { ...BEAM_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      // focus: the flame, then the adze on the beam, then a little beyond as the glide runs on
      const k1 = sstep(P.from + 0.8, P.from + 2.2, t), k2 = sstep(P.from + 2.6, P.to, t);
      const fl = dist(c.pos, LAMP), fa = dist(c.pos, adze);
      u.uFocus.value = fl + (fa - fl) * k1 + 0.9 * k2;
      u.uAper.value = 0.007;
      u.uFar.value = sstep(P.from + 0.9, P.from + 2.6, t);
    },
    post(t) {
      // out of black: the flame first, the world around it after
      const up = sstep(P.from, P.from + 0.35, t);
      const dark = 0.55 + 0.45 * sstep(P.from + 0.6, P.from + 2.0, t);
      return grade(t, { exposure: 1.9 * (0.15 + 0.85 * up) * dark, bloom: 0.09, threshold: 1.1, vignette: 0.55, saturation: 1.0, contrast: 1.04, lift: [0.004, 0.004, 0.006] });
    },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.92, 0.78], amount: 0.35 } }; },
  };
};
