// The words of s28-pitch (God speaking): on the right over the black wet wall, right-aligned (high, clear
// of the lamp's reflection in the pitch below). "rooms
// inside" first alone; then "coat it within and without" with "with pitch." beneath it, PITCH large in
// the cedar capitals as the camera closes on the shining pitch.
import { lyricModule, setLine, keep } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const [a, b, c] = lines;
  const o = { align: 'right', speaker: 'god' };
  const ka = keep(t, a, P, { fade: 0.12 });
  if (ka > 0) setLine(ctx, a, t, { ...o, x: 3600, y: 1180, px: 190, alpha: ka });
  if (b && t >= b.start - 0.1) {
    setLine(ctx, b, t, { ...o, x: 3600, y: 520, px: 180, alpha: keep(t, b, P, { until: P.to - 0.12 }) });
    if (c) setLine(ctx, c, t, { ...o, x: 3600, y: 850, px: 250, alpha: keep(t, c, P) });
  }
}, { shade: 0.55 });
