// s43-food: "Gather every kind of food / that you eat;" (the words of God)
// Gold italic high on the left in the dark under the beams, above the jars.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s42-two.lyric.js';
// "fed." is still being read at the cut: the previous scene's line is carried across it

export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 260, y: 420, px: 160, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }), speaker: 'god' });
  if (l1) setLine(ctx, l1, t, { x: 260, y: 640, px: 160, align: 'left', alpha: keep(t, l1, P), speaker: 'god' });
}, { shade: 0.6 }));
