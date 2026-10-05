// The words of s10, in the near silence: one slow line low on the left over the dark cloud, each word
// set as it is sung across seven seconds; WICKEDNESS lands last in forge red.
import { lyricModule, setLine, keep } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  if (lines[0]) setLine(ctx, lines[0], t, { x: 300, y: 1880, px: 165, align: 'left', alpha: keep(t, lines[0], P, { fade: 0.55 }), rise: 10, glow: false });
}, { shade: 0.5 });
