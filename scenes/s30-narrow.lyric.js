// The words of s30-narrow (God speaking): the two lines together high in the dark sky above the ridge,
// left-aligned so they run the way the roof runs; "cubit" in the silver measure capitals.
import { lyricModule, verse } from '/song/lib/type.js';
export default lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 260, y: 380, px: 175, align: 'left', group: 2, gap: 1.3, speaker: 'god' });
}, { shade: 0.55 });
