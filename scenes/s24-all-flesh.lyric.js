// The words of s24-all-flesh: one line high over the dark smoke above the road,
// "all FLESH had CORRUPTED its way", FLESH in ash and CORRUPTED in forge red.
import { lyricModule, keep, carry } from '/song/lib/type.js';
import { heavyLine } from '/song/lib/x-city-type.js';
import prev from '/song/scenes/s23-looked.lyric.js';
// "corruption;" is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l] = lines;
  if (!l) return;
  const a = keep(t, l, P, { fade: 0.2 });
  if (a > 0) heavyLine(ctx, l.words, t, { x: 260, y: 430, small: 140, big: 280, align: 'left', alpha: a });
}, { shade: 0.55 }));
