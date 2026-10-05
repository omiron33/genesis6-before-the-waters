// The words of s12-brooding: high in the dark above the coal bed, left, one line under the other; the
// heavy words ("evil", "end") take their voices in the smoke above the glow.
import { lyricModule, setLine, keep } from '/song/lib/type.js';
// The second line sits just under the first (both inside the dark band above the coals), so the
// first can stay until "brooding" has been read and then cross out as the second is sung.
export default lyricModule((ctx, t, P, lines) => {
  const [l1, l2] = lines;
  if (l1) setLine(ctx, l1, t, { x: 300, y: 420, px: 190, align: 'left', alpha: keep(t, l1, P, { fade: 0.15 }) });
  if (l2) setLine(ctx, l2, t, { x: 300, y: 660, px: 190, align: 'left', alpha: keep(t, l2, P) });
});
