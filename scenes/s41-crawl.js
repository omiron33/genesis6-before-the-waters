// s41-crawl: "all that crawl after their kind:"
// Down in the dry grass at the foot of the ramp: the small hands and tail drags of crawling things in
// the dust, their trails winding up onto the timber, where tortoises and lizards labour up toward the
// light as dark small shapes. The camera starts in the grass and tilts up the ramp to the gold door.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { GATHER_GLSL, GATHER_UNIFORMS, DOORX, RAMPZ1 } from '/song/lib/x-gather.js';

export const kind = 'shader';

export default (P) => {
  const cam = (t) => {
    const k = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.006);
    return { pos: [DOORX + 2.6 - 0.6 * k + d[0], 0.42 + 0.3 * k + d[1], RAMPZ1 + 3.2 - 0.6 * k], target: [DOORX + 0.2, 0.45 + 3.0 * k, RAMPZ1 - 4.0 - 5.5 * k], fov: 40 };
  };
  return {
    name: 's41-crawl', from: P.from, to: P.to,
    frag: GATHER_GLSL + 'vec3 shade(vec2 fc) { return gather(fc); }',
    uniforms: { ...GATHER_UNIFORMS },
    camera: cam,
    update(t, u) {
      const k = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
      u.uFocus.value = 5.0 + 3.5 * k; u.uAper.value = 0.035;
      u.uFlicker.value = 1.0; u.uExpo.value = 6.0; u.uScrub.value = 0; u.uTrees.value = 0;
      u.uGrass.value = 1; u.uCrawl.value = 1; u.uNA.value = 0;
    },
    post(t) { return grade(t, { exposure: 1.5, bloom: 0.13, threshold: 1.0, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.93, 0.8], amount: 0.4 } }; },
  };
};
