// s07-giants: "Giants lived upon the earth / in those days and afterward."
// A heavy hit: at the foot of the giants' wall in the valley at dusk. Cyclopean blocks each taller
// than a house, the bronze gate a hand ajar with forge light pouring out of the gap, a colossal
// bronze ring on the leaf, torches in iron baskets. The camera starts low on the gate and, on the
// hit, tilts up the wall, which is vast beyond scale, then cranes up and back until, beyond the city in
// its smoke, one of the Nephilim stands revealed: colossal, distant, perfectly still.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { CITY_GLSL, CITY_UNIFORMS } from '/song/lib/x-city.js';
import { WALL_GLSL } from '/song/lib/x-city-wall.js';

export const kind = 'shader';

export default (P) => {
  const dur = P.to - P.from;
  const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const cam = (t) => {
    const x = clamp01((t - P.from) / dur);
    const d = drift(t, 0.03);
    // 1) on the hit, tilt up the wall from the gate; 2) crane up and back over the plain until the
    // wall's crest drops and what stands beyond the city, in its smoke, is revealed
    const up = 0.3 * ease.out3(clamp01((t - P.from) / 0.9)) + 0.7 * ease.inOut3(clamp01(x / 0.6));
    const back = ease.inOut3(clamp01((x - 0.35) / 0.65));
    const pos = lerp([-10.0, 1.6, -58.0], [-4.0, 62.0, -215.0], back).map((v, i) => v + d[i]);
    const tUp = lerp([0.0, 10.0, 0.0], [4.0, 120.0, 12.0], up);
    const target = lerp(tUp, [-120.0, 205.0, 900.0], back);
    return { pos, target, fov: 52, roll: -0.025 + 0.035 * x };
  };
  return {
    name: 's07-giants', from: P.from, to: P.to,
    frag: CITY_GLSL + WALL_GLSL + 'vec3 shade(vec2 fc) { return cityWall(fc); }',
    uniforms: { ...CITY_UNIFORMS },
    camera: cam,
    post(t) { return grade(t, { exposure: 1.9, bloom: 0.1, threshold: 1.0, saturation: 1.05, vignette: 0.5, contrast: 1.06 }); },
    finish(t) { return { flare: { amount: 0.12, threshold: 0.85, tint: [1.0, 0.6, 0.35], length: 0.3 }, grade: { shadows: [0.0, 0.01, 0.03], highlights: [1.0, 0.92, 0.82], amount: 0.4 } }; },
  };
};
