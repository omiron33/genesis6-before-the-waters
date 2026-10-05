// s24-all-flesh: "all flesh had corrupted its way."
// The road out of the city at night, after the street: cracked, heaved paving winding away into
// smoke; the chain from the street lying across it; a cart tipped on its side, a wheel broken off,
// jars smashed and grain spilled; the bones of a beast; a boundary stone toppled; a roadside shrine
// overturned; a torch dropped on the road, still burning. No one. The camera travels low along the
// road, following it on into the smoke.
import { grade, ease, drift, clamp01 } from '/song/lib/look.js';
import { CITY_GLSL, CITY_UNIFORMS } from '/song/lib/x-city.js';
import { ROAD_GLSL } from '/song/lib/x-city-road.js';

export const kind = 'shader';

const roadX = (z) => 2.5 * Math.sin(z * 0.045) + 1.2 * Math.sin(z * 0.11 + 1.0);

export default (P) => {
  const dur = P.to - P.from;
  const cam = (t) => {
    const x = clamp01((t - P.from) / dur);
    const z = 3.0 + 5.0 * (0.4 * x + 0.6 * ease.inOut3(x));
    const d = drift(t, 0.02);
    const zt = z + 11.0;
    const pos = [roadX(z) - 0.5 + d[0], 1.25 + 0.15 * x + d[1], z];
    const target = [roadX(zt) + 0.1, 0.35 + 0.45 * x, zt];
    return { pos, target, fov: 48 };
  };
  return {
    name: 's24-all-flesh', from: P.from, to: P.to,
    frag: CITY_GLSL + ROAD_GLSL + 'vec3 shade(vec2 fc) { return cityRoad(fc); }',
    uniforms: { ...CITY_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFocus.value = 9.0;
      u.uAper.value = 0.02;
    },
    post(t) { return grade(t, { exposure: 1.6, bloom: 0.1, threshold: 1.0, saturation: 1.02, vignette: 0.55, contrast: 1.06 }); },
    finish(t) { return { grade: { shadows: [0.01, 0.0, 0.01], highlights: [1.0, 0.9, 0.8], amount: 0.35 } }; },
  };
};
