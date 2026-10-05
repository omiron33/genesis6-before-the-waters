// Lyric layout helpers for the city scenes (s02, s07, s09, s22, s24, s26). Lyric modules only.
import { paint, measure, arrive, voiceOf, PLAIN } from '/song/lib/type.js';

// One line, left/right/centre aligned at x, its plain words at `small` and its voiced words (giants,
// renown, corrupt, wrong, destroy, earth...) at `big`, all on one baseline; each word settles on its
// onset (the big ones with a short slam). Words in `force` (lowercase keys) are set big too.
export function heavyLine(ctx, words, t, { x = 260, y = 1080, small = 140, big = 360, align = 'left', alpha = 1, glowBig = false, speaker, force = [] } = {}) {
  const isBig = (w) => voiceOf(w.w) !== PLAIN || force.includes(w.w.toLowerCase().replace(/[^a-z]/g, ''));
  const sz = (w) => (isBig(w) ? big : small);
  const opt = (w) => (isBig(w) ? {} : { speaker });
  const adv = words.map((w) => measure(ctx, w.w, sz(w), opt(w)) + (isBig(w) ? big * 0.04 : 0));
  let total = adv.reduce((s, v) => s + v, 0);
  // keep inside a 200 px margin
  const room = align === 'left' ? 3640 - x : align === 'right' ? x - 200 : 2 * Math.min(x - 200, 3640 - x);
  let k = total > room ? room / total : 1;
  let xx = align === 'left' ? x : align === 'right' ? x - total * k : x - total * k / 2;
  words.forEach((w, i) => {
    const b = isBig(w);
    const st = b ? arrive(w, t, 0.04, 0.12) : arrive(w, t);
    const s = sz(w) * k;
    const yy = y + (1 - st.k) * (b ? 0 : s * 0.1);
    const sc = b ? 1 + 0.07 * (1 - st.k) : 1;
    const ww = adv[i] * k;
    ctx.save(); ctx.translate(xx + ww / 2, yy); ctx.scale(sc, sc);
    paint(ctx, w.w, -ww / 2, 0, s, { ...opt(w), alpha: st.a * alpha, glow: b ? glowBig : true });
    ctx.restore();
    xx += ww;
  });
  return total * k;
}
