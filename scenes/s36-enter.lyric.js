// s36-enter: "Enter the ark with your sons, / your wife, and your sons' wives." (the words of God)
// Gold italic, stepped down the dark left of the frame like the procession on the ramp: the first
// line high on the left, the second lower and further in.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s35-covenant.lyric.js';
// "with you." is still being read at the cut: the previous scene's line is carried across it

export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 240, y: 1560, px: 138, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }), speaker: 'god' });
  if (l1) setLine(ctx, l1, t, { x: 420, y: 1800, px: 138, align: 'left', alpha: keep(t, l1, P), speaker: 'god' });
}, { shade: 0.55 }));
