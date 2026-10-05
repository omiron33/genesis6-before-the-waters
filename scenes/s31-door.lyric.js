// The words of s31-door (God speaking): one line at a time (alternating two rows), centred high (over the dark hull at the
// door, over the sky as the decks are revealed); "door" in cedar, "lower", "second" and "third" in the
// silver measure capitals, landing as each deck lights.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s30-narrow.lyric.js';
// "above." is still being read at the cut: the previous scene's line is carried across it. The three
// lines follow each other closely, so they alternate between two rows (one never lands on the last).
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  lines.forEach((l, i) => {
    const a = keep(t, l, P, { fade: 0.12 });
    if (a > 0) setLine(ctx, l, t, { x: 1920, y: i % 2 ? 560 : 330, px: 175, align: 'center', alpha: a, speaker: 'god', rise: 20 });
  });
}, { shade: 0.55 }));
