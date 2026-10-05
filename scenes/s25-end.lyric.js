// The words of s25-end: "The Lord God said to Noe," quiet in the narrator's voice over the dark of
// the hill; then God's sentence beneath it in gold italic as one unit: "The end of all men" arrives
// together on "end", and "is before Me." follows word by word on a second line. No word of it ever
// stands alone, and "end" keeps the line's own voice rather than a huge capital.
import { lyricModule, setLine, keep, carry } from '/song/lib/type.js';
import prev from '/song/scenes/s24-all-flesh.lyric.js';

// "way." is still being read at the cut: the previous scene's line is carried across it
export default carry(prev, lyricModule((ctx, t, P, lines) => {
  const [l1, l2] = lines;
  setLine(ctx, l1, t, { x: 1920, y: 1400, px: 130, align: 'center', alpha: keep(t, l1, P, { until: P.to - 0.12 }) * 0.95 });
  if (t < l2.start - 0.15) return;
  const a = keep(t, l2, P);
  const words = l2.words;
  const iEnd = words.findIndex((w) => /^end/i.test(w.w));
  const iMen = words.findIndex((w) => /^men/i.test(w.w));
  const tEnd = words[iEnd].start;
  // "The end of all men" lands as one phrase on "end"
  const first = words.slice(0, iMen + 1).map((w) => ({ ...w, start: tEnd }));
  const second = words.slice(iMen + 1);
  setLine(ctx, first, t, { x: 1920, y: 1660, px: 190, align: 'center', alpha: a, speaker: 'god', voice: 'god' });
  setLine(ctx, second, t, { x: 1920, y: 1880, px: 190, align: 'center', alpha: a, speaker: 'god', voice: 'god' });
}));
