// s45-obey: "Noe did everything / the Lord God commanded him."
// The narration, quiet and whole: the first line high on the left in the storm dark, the second low
// on the right over the dark ground, the ark between them.
import { lyricModule, setLine, keep } from '/song/lib/type.js';

export default lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 260, y: 470, px: 150, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }) });
  if (l1) setLine(ctx, l1, t, { x: 3580, y: 1820, px: 150, align: 'right', alpha: keep(t, l1, P) });
}, { shade: 0.55 });
