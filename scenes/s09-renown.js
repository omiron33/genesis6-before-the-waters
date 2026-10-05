// s09-renown: "their children were the giants of old, / men of renown."
// Inside the giants' hall at dusk: a colossal bronze sword driven point-first into a cracked basalt
// floor, taller than a tower, fire-bowls burning round it, a basalt throne of impossible size beyond,
// and far behind in the smoke one of the Nephilim, a colossal, perfectly still dark shape. The
// camera rises slowly up the blade as embers drift; on "renown" the fire-bowls surge and a glint
// runs down the edge; the camera reaches the guard and grip in the smoke and settles as the music
// drops away (the last second calms to a near stop, still drifting).
import { grade, ease, drift, clamp01, linesAt, wordIn } from '/song/lib/look.js';
import { CITY_GLSL, CITY_UNIFORMS } from '/song/lib/x-city.js';
import { HALL_GLSL, HALL_UNIFORMS } from '/song/lib/x-city-hall.js';

export const kind = 'shader';

export default (P) => {
  const dur = P.to - P.from;
  const [, l2] = linesAt(P.from - 0.6, 'their children', 'men of renown');
  const tR = wordIn(l2, 'renown').start;
  const cam = (t) => {
    const x = clamp01((t - P.from) / dur);
    // a long rise up the blade that eases into stillness in the last second (the drop)
    const r = 1 - Math.pow(1 - x, 1.7);
    const d = drift(t, 0.05 * (1 - 0.6 * x));
    const y = 2.4 + 60 * r;
    const orbit = 0.62 - 0.36 * r;
    const R = 26 - 11 * r;
    const pos = [R * Math.sin(orbit) + d[0], y + d[1], -R * Math.cos(orbit)];
    const target = [7.0 - 6.0 * r, y + 13.0 - 13.5 * r, 30.0 - 26.0 * r];
    return { pos, target, fov: 44 };
  };
  const flash = (t) => (t < tR - 0.05 ? 0 : Math.exp(-(t - tR + 0.05) * 2.2) * Math.min(1, (t - tR + 0.05) / 0.06));
  return {
    name: 's09-renown', from: P.from, to: P.to,
    frag: CITY_GLSL + HALL_GLSL + 'vec3 shade(vec2 fc) { return cityHall(fc); }',
    uniforms: { ...CITY_UNIFORMS, ...HALL_UNIFORMS },
    camera: cam,
    update(t, u) {
      const c = cam(t);
      u.uFlash.value = flash(t);
      u.uGlint.value = t > tR - 0.05 ? 58 - (t - tR) * 60 : -1;
      // focus on the blade, a thin depth of field so the hall and the throne fall soft
      u.uFocus.value = Math.hypot(c.pos[0], c.pos[2]);
      u.uAper.value = 0.08;
    },
    post(t) { return grade(t, { exposure: 1.5, bloom: 0.12, threshold: 1.0, saturation: 1.02, vignette: 0.55, contrast: 1.06 }); },
    finish(t) { return { flare: { amount: 0.05 + 0.2 * flash(t), threshold: 0.85, tint: [1.0, 0.65, 0.4], length: 0.35 }, grade: { shadows: [0.0, 0.01, 0.025], highlights: [1.0, 0.92, 0.8], amount: 0.4 } }; },
  };
};
