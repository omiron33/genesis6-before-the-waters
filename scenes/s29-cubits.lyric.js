// The words of s29-cubits (God speaking): one line at a time (alternating two rows) high on the left over the dark sky; the
// numbers take the silver measure capitals. Each measure also gets a builder's mark beside its line of
// light on the hull: 300, 50, 30 in small tracked silver, placed by projecting the line's midpoint
// through the scene's own camera.
import { lyricModule, setLine, keep, carry, note, project } from '/song/lib/type.js';
import { s29cam } from '/song/lib/x-ark-cams.js';
import { LINES } from '/song/lib/x-ark.js';
import lyrics from '/timing.js';
import prev from '/song/scenes/s28-pitch.lyric.js';
const mid = (s) => s[0].map((v, i) => (v + s[1][i]) / 2);
// "pitch." is still being read at the cut: the previous scene's line is carried across it. The three
// measures follow each other closely, so they alternate between two rows: each stays until it has been
// read and the next has begun, and the next never lands on it.
export default (P) => {
  const cam = s29cam(P);
  const w = (re) => lyrics.words.find((x) => x.start >= P.from - 0.05 && re.test(x.w));
  const marks = [
    { at: w(/^three/i), seg: LINES.len, text: '300 CUBITS', dy: 90 },
    { at: w(/^fifty/i), seg: LINES.wid, text: '50 CUBITS', dy: 90 },
    { at: w(/^thirty/i), seg: LINES.hei, text: '30 CUBITS', dx: 70, dy: 0, align: 'left' },
  ];
  return carry(prev, lyricModule((ctx, t, Pp, lines) => {
    lines.forEach((l, i) => {
      const a = keep(t, l, Pp, { fade: 0.12 });
      if (a > 0) setLine(ctx, l, t, { x: 250, y: i % 2 ? 620 : 400, px: 170, align: 'left', alpha: a, speaker: 'god' });
    });
    const c = cam(t);
    const fade = Math.min(1, Math.max(0, (P.to - 0.05 - t) / 0.25));
    for (const m of marks) {
      const k = Math.min(1, Math.max(0, (t - m.at.start - 0.5) / 0.4));
      if (k <= 0) continue;
      const p = project(c, mid(m.seg));
      if (p.z <= 0) continue;
      const x = Math.min(3600, Math.max(240, p.x + (m.dx ?? 0))), y = Math.min(1960, Math.max(240, p.y + (m.dy ?? 0)));
      note(ctx, m.text, x, y, { px: 52, alpha: 0.92 * k * fade, color: '214, 224, 240', align: m.align ?? 'center', track: 0.3 });
    }
  }, { shade: 0.55 }))(P);
};
