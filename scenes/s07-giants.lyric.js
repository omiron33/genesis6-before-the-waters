// The words of s07-giants. GIANTS lands huge in forge red on the hit, high on the left over the dark
// shoulder of the tower, "lived upon the earth" set small under it; as the camera climbs, "in those
// days and afterward." settles low on the right over the shadowed foot of the wall.
import { lyricModule, setLine, paint, arrive, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s06-years.lyric.js';

// "years." is still being read at the cut: the previous scene's measure is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l1, l2] = lines;
  if (l1) {
    const a = keep(t, l1, P);
    if (a > 0) {
      const [g, ...rest] = l1.words;
      const st = arrive(g, t, 0.04, 0.12);
      const big = 560, sc = 1 + 0.07 * (1 - st.k);
      ctx.save(); ctx.translate(260, 1250); ctx.scale(sc, sc);
      paint(ctx, g.w, 0, 0, big, { alpha: st.a * a, glow: false });
      ctx.restore();
      setLine(ctx, rest, t, { x: 272, y: 1450, px: 150, align: 'left', alpha: a });
    }
  }
  if (l2) {
    const a = keep(t, l2, P);
    if (a > 0) setLine(ctx, l2, t, { x: 3580, y: 1840, px: 170, align: 'right', alpha: a });
  }
}, { shade: 0.55 }));
