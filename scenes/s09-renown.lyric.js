// The words of s09-renown, on the dark left of the hall while the blade stands on the right:
// "their children were the GIANTS of old," high, GIANTS the heavy forge-red hit; then "men of
// RENOWN" lower, RENOWN landing as the blade flashes. The held line clears gently into the drop.
import { lyricModule, keep, carry } from '/song/lib/type.js';
import { heavyLine } from '/song/lib/x-city-type.js';
import prev from '/song/scenes/s08-came.lyric.js';

// "men;" is still being read at the cut: the previous scene's line is carried across it. The shade is
// deeper here: "of old" sits beside the lit smoke at the pillar's edge.
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l1, l2] = lines;
  if (l1) {
    const a = keep(t, l1, P, { lead: 0.15 });
    if (a > 0) heavyLine(ctx, l1.words, t, { x: 260, y: 640, small: 132, big: 330, alpha: a });
  }
  if (l2) {
    const a = keep(t, l2, P, { lead: 0.15, fade: 0.4 });
    if (a > 0) heavyLine(ctx, l2.words, t, { x: 260, y: 1960, small: 140, big: 360, alpha: a });
  }
}, { shade: 0.8 }));
