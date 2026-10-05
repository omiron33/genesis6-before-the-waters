// s31-door: "Put its door in the side, / and make lower, second / and third stories." (the words of God).
// The great door in the ark's side stands open, its cedar leaf swung back, lamplight pouring down the
// cleated ramp. Then the camera glides left and up along the hull where its side is cut away like a
// builder's section, and the three decks of the hold light up one after another as they are named:
// lower (hay in the stalls), second (grain jars), third, each with its lamps.
import { grade } from '/song/lib/look.js';
import { ARK_FRAG, ARK_UNIFORMS } from '/song/lib/x-ark.js';
import { s31cam, sstep, dist } from '/song/lib/x-ark-cams.js';
import lyrics from '/timing.js';

export const kind = 'shader';

export default (P) => {
  const cam = s31cam(P);
  const w = (re) => lyrics.words.find((x) => x.start >= P.from && re.test(x.w));
  const lower = w(/^lower/i), second = w(/^second/i), third = w(/^third/i);
  return {
    name: 's31-door', from: P.from, to: P.to,
    frag: ARK_FRAG,
    uniforms: { ...ARK_UNIFORMS, uFocus: 14, uAper: 0.0, uInside: 1, uCut: -6.0 },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      const on = (x) => sstep(x.start - 0.12, x.start + 0.35, t);
      u.uDeck.value.set(on(lower), on(second), on(third));
      u.uCut.value = -6.0;
      u.uMoonI.value = 0.6;
      u.uMoon.value.set(-0.3, 0.45, 0.85);   // over the camera's shoulder: a cool sheen on the pitch side
      const door = [6.0, 3.3, 11.43], decks = [c.target[0] + 2, c.target[1], 4];
      const k = sstep(P.from + 2.0, P.from + 3.4, t);
      u.uFocus.value = dist(c.pos, door) * (1 - k) + dist(c.pos, decks) * k;
      u.uAper.value = 0.03;
    },
    post(t) { return grade(t, { exposure: 1.75, bloom: 0.12, threshold: 1.0, vignette: 0.5, contrast: 1.05, lift: [0.004, 0.004, 0.007] }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.04], highlights: [1.0, 0.93, 0.8], amount: 0.35 } }; },
  };
};
