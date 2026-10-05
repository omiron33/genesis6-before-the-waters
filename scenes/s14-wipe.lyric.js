// The words of s14-wipe: low on the left over the lane's dark, moon-shadowed side. "God said," in the
// narration; from "I will" the words are God's (gold italic), and "wipe" takes its ash capitals.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s13-pondered.lyric.js';
// "deeply." is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [a, b] = lines;
  // God's words begin after "said,"
  const k = a.words.findIndex((w) => /^said/i.test(w.w));
  const aw = a.words.map((w, i) => (i > k ? { ...w, voice: 'god' } : w));
  const bw = b.words.map((w) => ({ ...w, voice: 'god' }));
  const ka = keep(t, a, P, { until: P.to - 0.12 }), kb = keep(t, b, P);
  if (ka > 0) setLine(ctx, aw, t, { x: 260, y: 1500, px: 170, align: 'left', alpha: ka });
  if (kb > 0) setLine(ctx, bw, t, { x: 260, y: 1730, px: 170, align: 'left', alpha: kb });
}));
