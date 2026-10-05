// The words of s15-creatures: the rest of God's sentence, high on the left in the dark under the
// storm deck, above the herd and the flock; the living words ("cattle", "creatures", "birds") in
// their soft warm italic.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s14-wipe.lyric.js';
// "made," is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [a, b] = lines;
  const god = (l) => l.words.map((w) => ({ ...w, voice: 'god' }));
  const ka = keep(t, a, P, { until: P.to - 0.12 }), kb = b ? keep(t, b, P) : 0;
  if (ka > 0) setLine(ctx, god(a), t, { x: 260, y: 400, px: 160, align: 'left', alpha: ka });
  if (kb > 0) setLine(ctx, god(b), t, { x: 260, y: 620, px: 160, align: 'left', alpha: kb });
}));
