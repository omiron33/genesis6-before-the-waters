// s44-store: "store it for yourself / and for them." (the words of God; the long held line)
// The held line sits large on the left over the dark of the stalls and stays while the camera rises;
// "and for them" comes in beneath it, right, as the decks of stored food and sleeping creatures pass.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s43-food.lyric.js';
// "eat;" is still being read at the cut: the previous scene's line is carried across it

export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 260, y: 1500, px: 176, align: 'left', alpha: keep(t, l0, P, { until: P.to - 0.12 }), speaker: 'god' });
  if (l1) setLine(ctx, l1, t, { x: 1500, y: 1740, px: 176, align: 'left', alpha: keep(t, l1, P), speaker: 'god' });
}, { shade: 0.85 }));
