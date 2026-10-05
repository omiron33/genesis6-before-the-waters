// The words of s22-corrupt, high in the black smoke over the street while the camera runs:
// "The EARTH was CORRUPT before GOD;" then, beneath it, "it was filled with WRONG." with WRONG
// slamming in forge red as the push brakes into the hold on the furnace.
import { lyricModule, keep, carry } from '/song/lib/type.js';
import { heavyLine } from '/song/lib/x-city-type.js';
import prev from '/song/scenes/s21-sons.lyric.js';

// "Japheth." is still being read at the cut: the previous scene's names are carried across it. The
// second line takes its own row under the first (it begins the moment "God;" ends, so it cannot land
// in the first line's place while that is still being read); the first then crosses out.
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l1, l2] = lines;
  if (l1) {
    const a = keep(t, l1, P, { fade: 0.15 });
    if (a > 0) heavyLine(ctx, l1.words, t, { x: 1920, y: 420, small: 125, big: 240, align: 'center', alpha: a });
  }
  if (l2) {
    const a = keep(t, l2, P, { lead: 0.12 });
    if (a > 0) heavyLine(ctx, l2.words, t, { x: 1920, y: 800, small: 135, big: 330, align: 'center', alpha: a });
  }
}, { shade: 0.7 }));
