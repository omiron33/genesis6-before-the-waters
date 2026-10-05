// s39-feed: "Feed them there with you, / male and female."
// Stacked on the dark hull left of the door, so the pairs climbing into the gold stay clear.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s38-beasts.lyric.js';
// "beasts." is still being read at the cut: the previous scene's line is carried across it

export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 240, y: 700, px: 150, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }) });
  if (l1) setLine(ctx, l1, t, { x: 240, y: 920, px: 150, align: 'left', alpha: keep(t, l1, P) });
}, { shade: 0.6 }));
