// s42-two: "pairs of each will come to you, / male and female, to be fed."
// Across the top of the doorway over the storm, centred above the last pair coming in, two lines
// that the dark sky and the soft shade under them keep readable.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s41-crawl.lyric.js';
// "kind:" is still being read at the cut: the previous scene's line is carried across it

export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 1840, y: 330, px: 140, align: 'center', alpha: keep(t, l0, P, { until: P.to - 0.12 }) });
  if (l1) setLine(ctx, l1, t, { x: 1840, y: 520, px: 140, align: 'center', alpha: keep(t, l1, P) });
}, { shade: 0.9 }));
