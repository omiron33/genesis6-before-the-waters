// The title: BEFORE THE WATERS in tall pale capitals over the dark sky left of the peak, slamming in
// on the first hit (0.37 s), GENESIS 6 small beneath on the next beat; both clear before the verse.
import { lyricModule, note, outFade, spring, clamp01, ease } from '/song/lib/type.js';

const HIT = 0.37, SUB = 1.01;
export default lyricModule((ctx, t, P) => {
  const out = outFade(t, P.to - 0.4, P.to - 0.04);
  const k = spring(t, HIT - 0.04, 0.45, 0.25);
  const a = clamp01((t - HIT + 0.05) / 0.08) * out;
  if (a > 0.002) {
    const px = 230;
    ctx.save();
    ctx.font = `400 ${px}px "Bebas Neue"`;
    ctx.letterSpacing = `${px * (0.12 + 0.05 * (1 - k))}px`;
    const s = 'BEFORE THE WATERS';
    const w = ctx.measureText(s).width;
    const cx = 1400, cy = 800;
    const sc = 1 + 0.07 * (1 - k);
    ctx.translate(cx, cy); ctx.scale(sc, sc);
    ctx.shadowColor = `rgba(150, 175, 220, ${(0.35 * a).toFixed(3)})`; ctx.shadowBlur = 40;
    ctx.fillStyle = `rgba(238, 236, 230, ${a.toFixed(3)})`;
    ctx.fillText(s, -w / 2, 0);
    ctx.restore();
    ctx.letterSpacing = '0px';
    // thin rules either side of the reference
    const b = ease.out3(clamp01((t - SUB + 0.06) / 0.35)) * out;
    if (b > 0.002) {
      const y = cy + 150;
      const tw = note(ctx, 'GENESIS 6', -9999, y, { px: 64, alpha: 0, track: 0.5 });
      note(ctx, 'GENESIS 6', cx, y, { px: 64, alpha: 0.88 * b, color: '214, 222, 236', align: 'center', track: 0.5 });
      ctx.fillStyle = `rgba(214, 222, 236, ${(0.5 * b).toFixed(3)})`;
      const L = 260 * b;
      ctx.fillRect(cx - tw / 2 - 60 - L, y - 22, L, 3);
      ctx.fillRect(cx + tw / 2 + 60, y - 22, L, 3);
    }
  }
}, { shade: 0.45 });
