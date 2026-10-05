// The words of s23: the first line high on the left over the dark cloud, the second answering lower
// on the right as the lightning breaks on "corruption".
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s22-corrupt.lyric.js';
// "wrong." is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 280, y: 360, px: 160, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }), glow: false });
  if (l1) setLine(ctx, l1, t, { x: 3560, y: 1900, px: 175, align: 'right', alpha: keep(t, l1, P), glow: false });
}, { shade: 0.5 }));
