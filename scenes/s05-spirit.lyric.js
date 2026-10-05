// The words of s05: "The Lord God said," small and upright in the dark sky on the left; then God's
// words in gold italic, two lines in the dark sky over the altar, staying as the smoke is torn away.
import { lyricModule, setLine, keep } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const [L0, L1, L2] = lines;
  // "The Lord God said," stays over God's first line and gives way as the second begins; God's two
  // lines sit lower so the three never touch
  if (L0) setLine(ctx, L0, t, { x: 300, y: 330, px: 120, align: 'left', alpha: keep(t, L0, P, { until: L2?.start, fade: 0.2 }) });
  if (L1) setLine(ctx, L1, t, { x: 300, y: 540, px: 175, align: 'left', alpha: keep(t, L1, P, { until: P.to - 0.12 }), speaker: 'god' });
  if (L2) setLine(ctx, L2, t, { x: 520, y: 760, px: 175, align: 'left', alpha: keep(t, L2, P), speaker: 'god' });
}, { shade: 0.5 });
