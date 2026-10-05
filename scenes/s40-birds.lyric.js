// s40-birds: "Birds after their kind, / cattle after their kind,"
// Two parallel lines on the dark hull to the right of the door: birds up near the ridge, cattle lower,
// near the door the cattle are walking through.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s39-feed.lyric.js';
// "female." is still being read at the cut: the previous scene's line is carried across it

export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 3600, y: 1000, px: 150, align: 'right', alpha: keep(t, l0, P, { until: P.to - 0.12 }) });
  if (l1) setLine(ctx, l1, t, { x: 3600, y: 1560, px: 150, align: 'right', alpha: keep(t, l1, P) });
}, { shade: 0.6 }));
