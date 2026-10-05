// s29-cubits: "Make the ark three hundred cubits long, / fifty cubits wide, / and thirty cubits high."
// The hull on its slipway at night, vast, pitch-black and glossy with its window strip glowing; lines of
// light draw its measure over it as each is sung: three hundred along its length, fifty across the bow,
// thirty up the bow corner, ticked every ten cubits like a builder's rod. A measuring rod and cord lie on a
// trestle in the foreground; the camera pulls back and rises until the whole ark is seen.
import { grade } from '/song/lib/look.js';
import { ARK_FRAG, ARK_UNIFORMS } from '/song/lib/x-ark.js';
import { s29cam, sstep, dist } from '/song/lib/x-ark-cams.js';
import lyrics from '/timing.js';

export const kind = 'shader';

const wordAt = (from, re) => lyrics.words.find((w) => w.start >= from - 0.05 && re.test(w.w));

export default (P) => {
  const cam = s29cam(P);
  const three = wordAt(P.from, /^three/i), fifty = wordAt(P.from, /^fifty/i), thirty = wordAt(P.from, /^thirty/i);
  const draw = (t, w, dur) => sstep(w.start - 0.1, w.start - 0.1 + dur, t);
  return {
    name: 's29-cubits', from: P.from, to: P.to,
    frag: ARK_FRAG,
    uniforms: { ...ARK_UNIFORMS, uFocus: 70, uAper: 0.0 },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uLine.value.set(draw(t, three, 1.5), draw(t, fifty, 0.9), draw(t, thirty, 1.1));
      // the rod first, then rack out to the hull as the measure begins
      const k = sstep(three.start - 0.5, three.start + 0.4, t);
      const fr = dist(c.pos, [90, 1.0, 32]), fh = dist(c.pos, [45, 6, 8]);
      u.uFocus.value = fr + (fh - fr) * k;
      u.uMoonI.value = 1.0;
      u.uMoon.value.set(0.55, 0.42, 0.7);   // behind the camera's shoulder: a soft cool light on the bow and the ground
      u.uAper.value = 0.06 * (1 - 0.5 * sstep(P.from + 3, P.to, t));
    },
    post(t) { return grade(t, { exposure: 2.1, bloom: 0.12, threshold: 1.0, vignette: 0.5, contrast: 1.05, lift: [0.004, 0.004, 0.007] }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.04], highlights: [1.0, 0.93, 0.8], amount: 0.35 } }; },
  };
};
