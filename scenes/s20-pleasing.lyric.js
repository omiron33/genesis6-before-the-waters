// The words of s20-pleasing: a short line on the left in the dark beside the rising smoke,
// "pleasing" and "God" in gold, lifting gently as the smoke climbs.
import { lyricModule, setLine, keep, carry, clamp01 } from '/song/lib/type.js';
import prev from '/song/scenes/s19-just.lyric.js';
// "generation," is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l] = lines;
  const lift = 60 * clamp01((t - P.from) / (P.to - P.from));
  setLine(ctx, l, t, { x: 260, y: 1500 - lift, px: 200, align: 'left', alpha: keep(t, l, P, { fade: 0.2 }) });
}));
