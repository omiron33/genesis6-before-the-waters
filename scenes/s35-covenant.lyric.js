// s35-covenant: "But I will establish / My covenant with you." (the words of God)
// God's gold italic, two lines centred low over the dark slope beneath the lit ark; "covenant"
// takes its gold capitals.
import { lyricModule, verse, carry, clamp01 } from '/song/lib/type.js';
import prev from '/song/scenes/s34-die.lyric.js';

// "die." is still being read at the cut: the previous scene's sentence is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  // the first word comes out of the white flash that opens the scene (no dark shade on white)
  ctx.globalAlpha = clamp01((t - P.from - 0.1) / 0.1);
  verse(ctx, t, P, lines, { x: 1920, y: 1640, px: 150, gap: 1.32, align: 'center', group: 2, speaker: 'god' });
  ctx.globalAlpha = 1;
}, { shade: 0.55 }));
