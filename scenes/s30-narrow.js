// s30-narrow: "Narrow the ark as you build it; / finish it a cubit above." (the words of God).
// On the ark's roof at night: the pitched roof narrowing up to its ridge, and just under the ridge cap the
// window strip, one cubit high, running the whole length with lamplight glowing through it. The camera
// starts low over the roof at the stern and rises above the ridge as the line runs away to the bow; on
// "cubit" a short line of light marks the window's cubit at the near end.
import { grade } from '/song/lib/look.js';
import { ARK_FRAG, ARK_UNIFORMS } from '/song/lib/x-ark.js';
import { s30cam, sstep, dist } from '/song/lib/x-ark-cams.js';
import lyrics from '/timing.js';

export const kind = 'shader';

export default (P) => {
  const cam = s30cam(P);
  const cubit = lyrics.words.find((w) => w.start >= P.from && /^cubit/i.test(w.w));
  return {
    name: 's30-narrow', from: P.from, to: P.to,
    frag: ARK_FRAG,
    uniforms: { ...ARK_UNIFORMS, uFocus: 30, uAper: 0.0 },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uCubit.value = sstep(cubit.start - 0.08, cubit.start + 0.5, t);
      u.uLine.value.set(0, 0, 0);
      u.uMoonI.value = 0.45;
      u.uMoon.value.set(0.85, 0.3, 0.4);   // low ahead, beyond the bow: a path of moonlight down the wet roof
      u.uFocus.value = dist(c.pos, [-55, 14.2, 2.6]);
      u.uAper.value = 0.025;
    },
    post(t) { return grade(t, { exposure: 1.75, bloom: 0.12, threshold: 1.0, vignette: 0.5, contrast: 1.05, lift: [0.004, 0.004, 0.007] }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.04], highlights: [1.0, 0.93, 0.8], amount: 0.35 } }; },
  };
};
