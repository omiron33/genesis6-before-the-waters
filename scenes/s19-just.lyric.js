// The words of s19-just: right-aligned in the dark beside the trunk, one line under the other as
// the camera rises along the plumb line; "just" and "perfect" in lit gold.
import { lyricModule, verse, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s18-generations.lyric.js';
// "Noe." is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  verse(ctx, t, P, lines, { x: 3580, y: 1500, px: 180, align: 'right', group: 2, gap: 1.35 });
}));
