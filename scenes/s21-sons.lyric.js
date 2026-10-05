// The words of s21-sons: "Noe fathered three sons:" low and centred over the dark grass; then each
// name is set in spaced capitals beneath its own young cedar, arriving as its lamp catches.
import { lyricModule, setLine, paint, measure, arrive, keep, carry, project } from '/song/lib/type.js';
import scene from '/song/scenes/s21-sons.js';
import { LAMP_S } from '/song/lib/x-grove.js';
import prev from '/song/scenes/s20-pleasing.lyric.js';

// "God." is still being read at the cut: the previous scene's line is carried across it. The shade
// is deeper here (the first line sits over lamp-lit grass) and "and" is set at a readable size.
export default (P) => {
  const sc = scene(P);
  return carry(prev, lyricModule((ctx, t, P2, lines) => {
    const [l1, l2] = lines;
    const a1 = keep(t, l1, P, { fade: 0.1 });
    if (a1 > 0) setLine(ctx, l1, t, { x: 1920, y: 1950, px: 170, align: 'center', alpha: a1 });
    if (t < l2.start - 0.15) return;
    const aOut = keep(t, l2, P);
    if (aOut <= 0) return;
    const cam = sc.camera(t);
    // names, left to right: Shem stands at the leftmost lamp
    const order = [...LAMP_S].map((p) => project(cam, p)).sort((a, b) => a.x - b.x);
    const names = l2.words.filter((w) => /^(shem|ham|japheth)/i.test(w.w));
    const andW = l2.words.find((w) => /^and/i.test(w.w));
    names.forEach((w, i) => {
      const st = arrive(w, t);
      const px = 150;
      const ww = measure(ctx, w.w, px);
      const x = Math.min(3640 - ww, Math.max(200, order[i].x - ww / 2));
      paint(ctx, w.w, x, Math.min(1950, order[i].y + 260) + (1 - st.k) * 16, px, { alpha: st.a * aOut });
    });
    if (andW) {
      const st = arrive(andW, t);
      const px = 120;
      const x = (order[1].x + order[2].x) / 2;
      paint(ctx, andW.w, x - measure(ctx, andW.w, px) / 2, Math.min(1940, (order[1].y + order[2].y) / 2 + 250), px, { alpha: st.a * aOut });
    }
  }, { shade: 0.75 }))(P);
};
