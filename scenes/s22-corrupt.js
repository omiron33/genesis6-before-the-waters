// s22-corrupt: "The earth was corrupt before God; / it was filled with wrong."
// The valley city at full night, the music surging: a fast push down a torch-lit street between
// mud-brick houses on cyclopean footings, bronze idols on pillars, black smoke overhead, embers;
// past the evidence of what the city does, with no one in it (manacles and a chain on a post, a
// merchant's scales tipped by false weights, a bloodied blade on a threshold, a smashed altar),
// and the push slams to a hold on the crimson furnace at the end of the street.
import { grade, ease, clamp01, linesAt, beats } from '/song/lib/look.js';
import { CITY_GLSL, CITY_UNIFORMS } from '/song/lib/x-city.js';
import { STREET_GLSL } from '/song/lib/x-city-street.js';

export const kind = 'shader';

export default (P) => {
  // the hold lands on the strong beat just before the end of the scene
  const tHold = beats.filter((b) => b > P.to - 1.0 && b < P.to - 0.3).pop() ?? P.to - 0.6;
  const z0 = 1.0, z1 = 72.0;
  const zAt = (t) => {
    const x = clamp01((t - P.from) / (tHold - P.from));
    // a quick start, a long fast run, and a hard brake into the hold
    const s = x < 0.12 ? 0.5 * (x / 0.12) * (x / 0.12) * 0.12 : 0.06 + (x - 0.12) * (1 - 0.06 - 0.0) / 0.88;
    let z = z0 + (z1 - z0) * Math.min(1, s);
    if (t > tHold) {
      // the hold settles with a short damped overshoot (no dead stop)
      const u = t - tHold;
      z = z1 + 0.9 * Math.exp(-u * 6.0) * Math.sin(u * 14.0);
    }
    return z;
  };
  const cam = (t) => {
    const z = zAt(t);
    const x = clamp01((t - P.from) / (tHold - P.from));
    const sway = 0.35 * Math.sin((t - P.from) * 1.3) * (1 - x);
    const pos = [sway, 1.75 + 0.15 * Math.sin((t - P.from) * 2.1) * (1 - x), z];
    const target = [sway * 0.4, 1.2 + 1.2 * x, z + 12.0];
    return { pos, target, fov: 50 };
  };
  return {
    name: 's22-corrupt', from: P.from, to: P.to,
    frag: CITY_GLSL + STREET_GLSL + 'vec3 shade(vec2 fc) { return cityStreet(fc); }',
    uniforms: { ...CITY_UNIFORMS },
    camera: cam,
    post(t) { return grade(t, { exposure: 1.45, bloom: 0.12, threshold: 1.0, saturation: 1.06, vignette: 0.55, contrast: 1.07 }); },
    finish(t) { return { flare: { amount: 0.03, threshold: 0.85, tint: [1.0, 0.5, 0.35], length: 0.3 }, grade: { shadows: [0.01, 0.0, 0.01], highlights: [1.0, 0.9, 0.8], amount: 0.4 } }; },
  };
};
