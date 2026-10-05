// s28-pitch: "with rooms inside; / coat it within and without / with pitch." (the words of God).
// Inside the ark's frame as it rises: ribs into the storm sky, the first rooms boarded off, and the wall
// coated within in long wet strokes of black pitch, drips still running. A pot of pitch steams on a
// brazier of coals, the brush resting across its rim. The camera moves in from the rooms to the wall
// and ends close on the wet pitch shining under the lamp.
import { grade } from '/song/lib/look.js';
import { PITCH_FRAG, PITCH_UNIFORMS } from '/song/lib/x-yard-pitch.js';
import { path, warp, dist, sstep } from '/song/lib/x-ark-cams.js';

export const kind = 'shader';

export const s28cam = (P) => {
  const T0 = P.from, T1 = P.to;
  const keys = [
    { t: T0, pos: [2.3, 1.4, 2.4], target: [-4.5, 0.95, 0.3], fov: 44 },
    { t: T0 + 2.6, pos: [1.25, 1.45, 1.9], target: [-3.0, 1.1, 0.1], fov: 42 },
    { t: T0 + 4.2, pos: [0.3, 1.38, 1.38], target: [-1.15, 1.18, 0.0], fov: 40 },
    { t: T1, pos: [-0.05, 1.22, 1.15], target: [-1.05, 0.95, 0.0], fov: 40 },
  ];
  return (t) => path(keys, warp(t, T0, T1, 0.2, 1.0));
};

export default (P) => {
  const cam = s28cam(P);
  return {
    name: 's28-pitch', from: P.from, to: P.to,
    frag: PITCH_FRAG,
    uniforms: { ...PITCH_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      // focus on the wall where the camera looks
      const fw = [c.target[0] - c.pos[0], c.target[1] - c.pos[1], c.target[2] - c.pos[2]];
      const L = Math.hypot(...fw);
      const tz = c.pos[2] / Math.max(1e-3, -fw[2] / L);   // distance along the view ray to the wall z = 0
      u.uFocus.value = Math.min(tz, 6) * (0.8 + 0.2 * sstep(P.to - 2.5, P.to - 1.0, t));
      u.uAper.value = 0.006 - 0.0045 * sstep(P.to - 2.5, P.to - 1.0, t);
    },
    post(t) { return grade(t, { exposure: 1.8, bloom: 0.09, threshold: 1.1, vignette: 0.5, contrast: 1.05, lift: [0.004, 0.004, 0.006] }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.92, 0.78], amount: 0.35 } }; },
  };
};
