// The words of s17-grace: "But Noe found grace" low on the left over the dark storm cloud and the
// shadowed slope, "grace" in lit gold; then "before the Lord God." takes its place, a little lower
// and further in, as the gold settles on the grove.
import { lyricModule, setLine, keep } from '/song/lib/type.js';

export default lyricModule((ctx, t, P, lines) => {
  const [l1, l2] = lines;
  // the first line holds until the second begins in its place, then crosses out quickly
  const a1 = keep(t, l1, P, { fade: 0.08 });
  if (a1 > 0) setLine(ctx, l1, t, { x: 260, y: 1880, px: 200, align: 'left', alpha: a1 });
  if (l2 && t > l2.start - 0.2) setLine(ctx, l2, t, { x: 260, y: 1880, px: 200, align: 'left', alpha: keep(t, l2, P, { fade: 0.22 }) });
});
