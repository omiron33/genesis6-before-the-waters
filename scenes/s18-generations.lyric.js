// The words of s18-generations: one long line, sung slowly, set high and centred over the dark of
// the cedar canopy, above the lit doorway the camera is gliding toward.
import { lyricModule, single } from '/song/lib/type.js';

export default lyricModule((ctx, t, P, lines) => {
  single(ctx, t, P, lines, { x: 1920, y: 470, px: 190, align: 'center' });
});
