// s41-crawl: "all that crawl after their kind:"
// One line, small and low-slung like the creatures, high on the left over the dark hull.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s40-birds.lyric.js';
// "kind," is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  if (lines[0]) setLine(ctx, lines[0], t, { x: 240, y: 430, px: 140, align: 'left', alpha: keep(t, lines[0], P) });
}, { shade: 0.6 }));
