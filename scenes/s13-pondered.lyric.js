// The words of s13-pondered: low on the left over the dark plain beneath the storm, the first two
// lines together, then "He pondered it deeply." alone, larger, as the great swell of light comes.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s12-brooding.lyric.js';
// "end." is still being read at the cut: the previous scene's line is carried across it. The pair
// sits a little higher and "He pondered it deeply." takes its own row beneath it, so the third line
// never lands on the second; the first line clears just before the third begins (two lines at most).
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [a, b, c] = lines;
  const ka = keep(t, a, P, { until: c ? c.start - 0.25 : undefined, fade: 0.15 });
  const kb = keep(t, b, P, { first: a, hold: 0.17, fade: 0.05 });
  if (ka > 0) setLine(ctx, a, t, { x: 260, y: 1560, px: 160, align: 'left', alpha: ka });
  if (kb > 0) setLine(ctx, b, t, { x: 260, y: 1760, px: 160, align: 'left', alpha: kb });
  if (c && t >= c.start - 0.1) setLine(ctx, c, t, { x: 260, y: 1960, px: 175, align: 'left', alpha: keep(t, c, P) });
}));
