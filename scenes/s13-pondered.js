// s13-pondered: "God took it to heart / that He had made mankind; / He pondered it deeply."
// A vast storm cloud stands over the plain at night, seen from far off across the dark land, its
// interior lit by slow silent lightning; below it the tiny fires of the world. A long, slow, reverent
// push; nothing hard. The biggest swell of light lands on "pondered".
import { grade, ease, clamp01, drift } from '/song/lib/look.js';
import { CLOUD_GLSL, SWELLS_S13 } from '/song/lib/x-storm-cloud.js';
import { STORM_UNIFORMS } from '/song/lib/x-storm.js';

export const kind = 'shader';

export default (P) => {
  const cam = (t) => {
    const p = ease.inOut3(clamp01((t - P.from) / (P.to - P.from)));
    const d = drift(t, 0.0004);
    return { pos: [0.0 + d[0], 0.012 + 0.006 * p + d[1], 2.0 + 2.5 * p], target: [-3.4, 2.6 + 0.15 * p, 17.0], fov: 68 - 3 * p };
  };
  return {
    name: 's13-pondered', from: P.from, to: P.to,
    frag: CLOUD_GLSL + 'vec3 shade(vec2 fc) { return stormScene(fc); }',
    uniforms: { ...STORM_UNIFORMS, uSw: SWELLS_S13.flatMap((s) => s.slice(0, 4)), uSwSrc: SWELLS_S13.map((s) => s[4]), uPush: 0 },
    camera: cam,
    update(t, u) { u.uPush.value = clamp01((t - P.from) / (P.to - P.from)); },
    post(t) { return grade(t, { exposure: 2.2, bloom: 0.12, threshold: 0.9, saturation: 1.0, vignette: 0.5, contrast: 1.04, lift: [0.004, 0.004, 0.007] }); },
    finish() { return { grade: { shadows: [0.0, 0.01, 0.03], highlights: [0.92, 0.95, 1.0], amount: 0.4 } }; },
  };
};
