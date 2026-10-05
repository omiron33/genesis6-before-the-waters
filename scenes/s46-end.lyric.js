// s46-end: "He did it all." and the end title.
// The last line, word by word, on the dark pitch of the hull left of the closing door; then, as the
// light goes out, BEFORE THE WATERS in tall pale capitals with GENESIS 6 beneath between thin rules
// (the opening title's setting, quiet now), over the dark and the rain. No other line.
import { lyricModule, setLine, note, keep, clamp01, ease } from '/song/lib/type.js';

export default lyricModule((ctx, t, P, lines) => {
  // the last line holds until it has been read, then gives way to the end title
  if (lines[0]) setLine(ctx, lines[0], t, { x: 300, y: 1180, px: 170, align: 'left', alpha: keep(t, lines[0], P, { until: 252.85, fade: 0.3 }) });
  const fadeEnd = 1 - ease.inOut3(clamp01((t - (P.to - 0.45)) / 0.4));
  const a = ease.inOut3(clamp01((t - 253.2) / 0.55)) * fadeEnd;
  if (a > 0.002) {
    const px = 210, cx = 1920, cy = 1080;
    ctx.save();
    ctx.font = `400 ${px}px "Bebas Neue"`;
    ctx.letterSpacing = `${px * (0.16 - 0.03 * ease.out3(clamp01((t - 253.2) / 1.4)))}px`;
    const s = 'BEFORE THE WATERS';
    const w = ctx.measureText(s).width;
    ctx.shadowColor = `rgba(150, 175, 220, ${(0.3 * a).toFixed(3)})`; ctx.shadowBlur = 36;
    ctx.fillStyle = `rgba(232, 232, 228, ${a.toFixed(3)})`;
    ctx.fillText(s, cx - w / 2, cy);
    ctx.restore();
    ctx.letterSpacing = '0px';
    const b = ease.out3(clamp01((t - 253.55) / 0.5)) * fadeEnd;
    if (b > 0.002) {
      const y = cy + 150;
      const tw = note(ctx, 'GENESIS 6', -9999, y, { px: 62, alpha: 0, track: 0.5 });
      note(ctx, 'GENESIS 6', cx, y, { px: 62, alpha: 0.86 * b, color: '214, 222, 236', align: 'center', track: 0.5 });
      ctx.fillStyle = `rgba(214, 222, 236, ${(0.45 * b).toFixed(3)})`;
      const L = 240 * b;
      ctx.fillRect(cx - tw / 2 - 60 - L, y - 22, L, 3);
      ctx.fillRect(cx + tw / 2 + 60, y - 22, L, 3);
    }
  }
}, { shade: 0.5 });
