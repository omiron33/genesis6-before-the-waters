// The words of s04: top left over the dusk sky above the ridge, the second line answering on the right
// as the stream of light goes down.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s03-sons-saw.lyric.js';
// "beautiful;" is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 300, y: 360, px: 170, align: 'left', alpha: keep(t, l0, P, { until: l1 ? l1.start + 0.6 : undefined, fade: 0.6 }) });
  if (l1) setLine(ctx, l1, t, { x: 3560, y: 360, px: 170, align: 'right', alpha: keep(t, l1, P) });
}, { shade: 0.5 }));
