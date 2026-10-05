// The words of s27-ark (God speaking, gold italic): set low on the right over the dark ground of the
// yard, away from the lamp, right-aligned so they lead the eye back along the beam. "ark" and
// "timber" take the honey-cedar capitals.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 3620, y: 1640, px: 190, align: 'right', group: 2, gap: 1.32, speaker: 'god' });
}, { shade: 0.55 });
