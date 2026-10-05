// The words of s26-destroy, God speaking (gold italic): low over the dark plain under the city,
// "They have filled the EARTH with WRONG;" alone, then "I will DESTROY them" over "and the EARTH."
// The heavy words land as hits in their own voices.
import { lyricModule, keep, carry } from '/song/lib/type.js';
import { heavyLine } from '/song/lib/x-city-type.js';
import prev from '/song/scenes/s25-end.lyric.js';

// "Me." is still being read at the cut: the previous scene's line is carried across it. "I will
// DESTROY them" begins the moment "wrong;" ends, so it takes the row above the first line instead of
// landing on it; the first line then crosses out and "and the EARTH." takes its row beneath.
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l1, l2, l3] = lines;
  if (l1) {
    const a = keep(t, l1, P, { fade: 0.15 });
    if (a > 0) heavyLine(ctx, l1.words, t, { x: 1920, y: 1940, small: 130, big: 230, align: 'center', alpha: a, speaker: 'god' });
  }
  const a2 = l2 ? keep(t, l3 ?? l2, P, { first: l2 }) : 0;
  if (l2 && a2 > 0) heavyLine(ctx, l2.words, t, { x: 1920, y: 1700, small: 140, big: 270, align: 'center', alpha: a2, speaker: 'god' });
  if (l3 && a2 > 0 && t > l3.start - 0.12) heavyLine(ctx, l3.words, t, { x: 1920, y: 1940, small: 130, big: 200, align: 'center', alpha: a2, speaker: 'god' });
}, { shade: 0.65 }));
