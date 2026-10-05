// The words of s32-flood: God foretells the flood. Low over the dark plain beneath the coming wall,
// left; "FLOOD" takes its tall ash capitals, landing on the drum; "upon the earth." below it.
import { lyricModule, setLine, keep } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  const [a, b] = lines;
  const god = (l) => l.words.map((w) => ({ ...w, voice: 'god' }));
  const ka = keep(t, a, P, { until: P.to - 0.08, fade: 0.07 }), kb = b ? keep(t, b, P) : 0;
  if (ka > 0) setLine(ctx, god(a), t, { x: 260, y: 1720, px: 180, align: 'left', alpha: ka });
  if (kb > 0) setLine(ctx, god(b), t, { x: 260, y: 1950, px: 180, align: 'left', alpha: kb });
});
