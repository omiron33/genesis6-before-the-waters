// The words of s03: the first line high on the left above the lights; the second low on the left over
// the dark rock of the mountain, as the focus falls to the city.
import { lyricModule, setLine, keep, outFade } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  // the first line steps back a little once it has been read and the second has begun
  const back = l1 ? Math.max(l0.end + 0.25, l1.start) : Infinity;
  if (l0) setLine(ctx, l0, t, { x: 280, y: 400, px: 160, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }) * (0.7 + 0.3 * outFade(t, back, back + 0.6)) });
  if (l1) setLine(ctx, l1, t, { x: 280, y: 1880, px: 150, align: 'left', alpha: keep(t, l1, P) });
}, { shade: 0.5 });
