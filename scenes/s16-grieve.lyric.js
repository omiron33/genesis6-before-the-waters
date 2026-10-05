// The words of s16-grieve: God's grief, one line high on the left in the quiet dark above the dry
// ground; "grieve" in its ash capitals inside the gold italic of His voice.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s15-creatures.lyric.js';
// "sky." is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [a] = lines;
  const alpha = keep(t, a, P, { fade: 0.38 });
  if (alpha <= 0) return;
  setLine(ctx, a.words.map((w) => ({ ...w, voice: 'god' })), t, { x: 330, y: 330, px: 175, align: 'left', alpha });
}));
