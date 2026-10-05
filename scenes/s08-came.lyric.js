// The words of s08: high in the dusk sky above the wall, the second line under the first, both
// clear of the gateway's light.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s07-giants.lyric.js';
// "afterward." is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 1920, y: 400, px: 170, align: 'center', alpha: keep(t, l0, P, { until: P.to - 0.12 }) });
  if (l1) setLine(ctx, l1, t, { x: 1920, y: 620, px: 170, align: 'center', alpha: keep(t, l1, P) });
}, { shade: 0.5 }));
