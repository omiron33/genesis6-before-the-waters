// s03-sons-saw · "The sons of God saw / the daughters of men were beautiful;" (12.23-17.22).
// High above the peak of the mountain at blue dusk, a few cold burning lights hang in the air like
// stars come too near, faint fans of light about them, all turned toward the valley: far below, out
// of focus, the walled city at the mountain's foot glitters gold and red. A slow push past the lights;
// on "beautiful" the focus pulls from the lights to the city.
import { grade, ease, clamp01, mix, keys, linesAt, wordIn } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS } from '/song/lib/x-mount.js';
import { packWatchers, camPoint } from '/song/lib/x-mount-watch.js';

export const kind = 'shader';

// dist ahead, right, up (km), brightness, wing
const LIGHTS = [[0.16, -0.03, -0.012, 1.0, 0.8], [0.21, 0.04, 0.006, 0.85, 0.6], [0.27, -0.075, 0.022, 0.7, 0.5], [0.33, 0.09, -0.006, 0.6, 0.4], [0.4, 0.0, 0.04, 0.5, 0.3]];

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'The sons of God', 'the daughters');
  const pull = wordIn(L2, 'beautiful').start;
  const base = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const e = ease.inOut3(p);
    return { pos: [mix(1.95, 1.9, e), mix(2.2, 2.17, e), mix(-0.45, -0.39, e)], target: [0.3, 0.2, 3.4], fov: mix(38, 34, e), roll: 0.015 };
  };
  const L0 = base(P.from);   // the lights keep their places in the world while the camera pushes past
  const lights = (t) => LIGHTS.map(([d, r, u, k, w], i) => ({
    p: camPoint(L0, d, r + 0.002 * Math.sin(t * 0.6 + i * 1.3), u + 0.0015 * Math.sin(t * 0.8 + i)),
    k: k * 1.4, wing: w, trail: [0.0, 0.0015 + 0.0005 * i, -0.002],
  }));
  return {
    name: 's03-sons-saw', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uKindle: 0.75, uWatN: LIGHTS.length, uWatSize: 1.8, uAper: 0.003, uFocus: 0.08, uNight: 0.15 },
    camera: base,
    update(t, u) {
      u.uWindT.value = t;
      u.uWat.value = packWatchers(lights(t));
      const c = base(t);
      const near = Math.hypot(...c.pos.map((v, i) => v - camPoint(L0, 0.2, 0, 0)[i]));
      const far = Math.hypot(c.pos[0] - 0.3, c.pos[1], c.pos[2] - 3.4);
      const k = ease.inOut3(clamp01((t - pull + 0.25) / 1.1));
      u.uFocus.value = near * Math.pow(far / near, k);
    },
    post(t) { return grade(t, { exposure: 1.7, bloom: 0.2, threshold: 0.8, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.045], highlights: [0.94, 0.96, 1.0], amount: 0.5 } }; },
  };
};
