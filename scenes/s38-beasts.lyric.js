// s38-beasts: "cattle, creatures that crawl, / and wild beasts."
// Low over the dark plain under the procession, the first line left; "and wild beasts" lands larger,
// right, under the beasts walking toward the ark.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s37-pairs.lyric.js';
// "you:" is still being read at the cut: the previous scene's line is carried across it

export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 260, y: 1720, px: 150, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }) });
  if (l1) setLine(ctx, l1, t, { x: 3580, y: 1950, px: 190, align: 'right', alpha: keep(t, l1, P) });
}, { shade: 0.65 }));
