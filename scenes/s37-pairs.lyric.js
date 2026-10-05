// s37-pairs: "Bring pairs of every living kind / into the ark with you:" (the words of God)
// Gold italic, high and right-aligned over the dark pitch of the hull, clear of the gold door on the
// left of frame, the tracks running in beneath.
import { lyricModule, setLine, keep } from '/song/lib/type.js';

export default lyricModule((ctx, t, P, lines) => {
  const [l0, l1] = lines;
  if (l0) setLine(ctx, l0, t, { x: 3600, y: 470, px: 160, align: 'right', alpha: keep(t, l0, P, { until: P.to - 0.12 }), speaker: 'god' });
  if (l1) setLine(ctx, l1, t, { x: 3600, y: 690, px: 160, align: 'right', alpha: keep(t, l1, P), speaker: 'god' });
}, { shade: 0.55 });
