// s33-perish: "All flesh that breathes beneath heaven / will perish;" (God's foretelling)
// The long line runs small across the dark top-left, above the falls; then "will" quietly and
// PERISH in tall ash capitals low on the left, landing on the hit, over the dark water.
import { lyricModule, setLine, paint, arrive, keep, carry, spring } from '/song/lib/type.js';
import prev from '/song/scenes/s32-flood.lyric.js';

// "earth." is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l1, l2] = lines;
  if (l1) setLine(ctx, l1, t, { x: 250, y: 420, px: 128, align: 'left', alpha: keep(t, l1, P, { until: P.to - 0.2, fade: 0.2 }), speaker: 'god' });
  if (l2) {
    const out = keep(t, l2, P, { fade: 0.2 });
    const [will, perish] = l2.words;
    const a = arrive(will, t);
    paint(ctx, will.w, 262, 1590, 120, { alpha: a.a * out, voice: 'quiet', speaker: 'god' });
    const k = spring(t, perish.start - 0.03, 0.4, 0.25);
    const b = arrive(perish, t, 0.04, 0.1);
    const px = 430, sc = 1 + 0.06 * (1 - k);
    ctx.save(); ctx.translate(250, 1950); ctx.scale(sc, sc);
    paint(ctx, perish.w, 0, 0, px, { alpha: b.a * out });
    ctx.restore();
  }
}, { shade: 0.6 }));
