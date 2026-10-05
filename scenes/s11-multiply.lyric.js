// The words of s11: one line high in the black sky, centred, over the burning land.
import { lyricModule, setLine, keep } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  if (lines[0]) setLine(ctx, lines[0], t, { x: 1920, y: 420, px: 190, align: 'center', alpha: keep(t, lines[0], P, { fade: 0.23 }), glow: false });
}, { shade: 0.5 });
