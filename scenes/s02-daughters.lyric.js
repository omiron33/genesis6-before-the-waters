// The words of s02-daughters: one line, low on the left over the dark wall under the sill, away from
// the window's light, "daughters" in its soft warm italic.
import { lyricModule, single } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  single(ctx, t, P, lines, { x: 250, y: 1880, px: 180, align: 'left' });
}, { shade: 0.55 });
