// s34-die: "everything on earth will die." (the belted climax; God's foretelling)
// One long held line: "everything" alone high in the dark sky, "on EARTH will" gathering beneath it
// as the water rises, then DIE in huge ash capitals across the middle on the last hit; it is gone
// before the white flash that ends the vision.
import { lyricModule, setLine, paint, measure, arrive, keep, spring } from '/song/lib/type.js';

export default lyricModule((ctx, t, P, lines) => {
  const l = lines[0];
  if (!l) return;
  const w = l.words;
  // the whole sentence holds until "die." has been read (it is carried across the cut by the next scene)
  const out = keep(t, l, P);
  setLine(ctx, [w[0]], t, { x: 1920, y: 470, px: 170, align: 'center', alpha: out, speaker: 'god' });
  setLine(ctx, w.slice(1, 4), t, { x: 1920, y: 720, px: 150, align: 'center', alpha: out, speaker: 'god' });
  const die = w[4];
  const k = spring(t, die.start - 0.03, 0.45, 0.3);
  const b = arrive(die, t, 0.04, 0.1);
  if (b.a > 0.002) {
    const px = 620, sc = 1 + 0.08 * (1 - k);
    const ww = measure(ctx, die.w, px);
    ctx.save(); ctx.translate(1920, 1330); ctx.scale(sc, sc);
    paint(ctx, die.w, -ww / 2 + px * 0.05, 0, px, { alpha: b.a * out });
    ctx.restore();
  }
}, { shade: 0.65 });
