// The words of s01: high on the left over the dark upper sky, the two lines stacked, the second
// stepping in under the first as the valley lights spread.
import { lyricModule, setLine, keep } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  // both lines stay together until the cut (the first one clears just before it)
  if (l0) setLine(ctx, l0, t, { x: 300, y: 330, px: 170, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }) });
  if (l1) setLine(ctx, l1, t, { x: 520, y: 540, px: 170, align: 'left', alpha: keep(t, l1, P, { fade: 0.25 }) });
}, { shade: 0.5 });
