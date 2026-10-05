// The words of s06-years: "they are flesh." and "Their days will be" sit small at the top left over
// the dark grove behind the stump; then "one hundred twenty years" is set as a builder's measure
// across the top, silver capitals between two thin rules with ticks, like a rod laid across time.
import { lyricModule, setLine, paint, measure, arrive, keep, carry, clamp01, ease } from '/song/lib/type.js';
import prev from '/song/scenes/s05-spirit.lyric.js';

// "forever;" is still being read at the cut: the previous scene's last line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l1, l2, l3] = lines;
  // the first two lines, upper left; they give way to the measure once it has begun
  const a1 = keep(t, l1, P, { until: l3.start, fade: 0.1 }), a2 = keep(t, l2, P, { fade: 0.1 });
  if (a1 > 0) setLine(ctx, l1, t, { x: 260, y: 360, px: 150, align: 'left', alpha: a1 });
  if (a2 > 0) setLine(ctx, l2, t, { x: 260, y: 560, px: 150, align: 'left', alpha: a2 });
  if (t < l3.start - 0.1) return;
  const aOut = keep(t, l3, P);
  if (aOut <= 0) return;
  const px = 230, words = l3.words;
  let w = 0; for (const x of words) w += measure(ctx, x.w, px);
  let x = 1920 - w / 2;
  const y = 470;
  // the rod: two rules drawn out from the centre as "one" lands, ticks at each word (only the words
  // are carried past the cut)
  const rod = t < P.to;
  const k = ease.out3(clamp01((t - words[0].start + 0.1) / 0.6));
  const half = (w / 2 + 90) * k;
  ctx.strokeStyle = `rgba(214, 224, 240, ${(0.75 * aOut).toFixed(3)})`;
  ctx.lineWidth = 3;
  if (rod) for (const ry of [y - px * 1.02, y + px * 0.2]) {
    ctx.beginPath(); ctx.moveTo(1920 - half, ry); ctx.lineTo(1920 + half, ry); ctx.stroke();
    // end ticks
    if (k > 0.98) for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(1920 + sx * half, ry - 26); ctx.lineTo(1920 + sx * half, ry + 26); ctx.stroke(); }
  }
  // fine graduations along the lower rule, one for each of the hundred and twenty years
  const n = 120;
  if (rod) for (let i = 0; i <= n; i++) {
    const gx = 1920 - half + (2 * half * i) / n;
    const big = i % 10 === 0;
    const ga = clamp01((t - words[0].start - (i / n) * 1.6) / 0.15) * aOut;
    if (ga <= 0) continue;
    ctx.strokeStyle = `rgba(214, 224, 240, ${(0.6 * ga).toFixed(3)})`;
    ctx.lineWidth = big ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(gx, y + px * 0.2); ctx.lineTo(gx, y + px * 0.2 + (big ? 34 : 16)); ctx.stroke();
  }
  for (const wd of words) {
    const st = arrive(wd, t);
    paint(ctx, wd.w, x, y + (1 - st.k) * 14, px, { alpha: st.a * aOut });
    x += measure(ctx, wd.w, px);
  }
}));
