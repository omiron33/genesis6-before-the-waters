// s04-took · "they took as wives / whomever they chose." (17.22-22.25). Over the dark front of the
// mountain at dusk: the cold lights fall out of the sky one after another like slow meteors, trailing
// pale fire, onto the ridge-top where the path begins; then their glow streams down the switchbacks
// of the path toward the red light of the walled city at the mountain's foot. The camera rides down
// with the head of the stream.
import { grade, ease, clamp01, mix, linesAt } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS, pathXZ, PATH_LEN } from '/song/lib/x-mount.js';
import { ground } from '/song/lib/x-mount-ground.js';
import { packWatchers } from '/song/lib/x-mount-watch.js';

export const kind = 'shader';
const N = 6;

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'they took', 'whomever');
  // landing times: across the first line; the stream sets off on "whomever"
  const land = Array.from({ length: N }, (_, i) => mix(P.from + 0.45, L1.end + 0.05, i / (N - 1)));
  const go = L2.start - 0.1;
  const top = pathXZ(0);
  const topP = [top[0], ground(top[0], top[1], 8) + 0.01, top[1]];
  const onPath = (s, lift) => { const [x, z] = pathXZ(s); return [x, ground(x, z, 8) + lift, z]; };
  // the stream's head (km along the path): accelerating, then steady
  const head = (t) => { const x = Math.max(0, t - go); return Math.min(PATH_LEN, 0.25 * x * x + 0.3 * x); };
  const light = (i, t) => {
    const from = [topP[0] - 0.45 + 0.18 * i, topP[1] + 0.75 + 0.08 * (i % 3), topP[2] + 0.9 + 0.15 * (i % 2)];
    const t0 = land[i] - 1.1;
    if (t < t0) return null;
    if (t < land[i]) {
      const k = ease.inOut3((t - t0) / 1.1) * 0.6 + 0.4 * ((t - t0) / 1.1);
      const p = from.map((v, j) => v + (topP[j] - v) * k);
      const back = from.map((v, j) => (v - p[j]) * 0.35);
      return { p, k: 0.9, trail: back, wing: 0.25 };
    }
    // landed: wait at the top, then stream down the path in a line
    const s = Math.max(0, head(t) - i * 0.07);
    const lift = 0.008 + 0.003 * Math.sin(t * 2 + i);
    const p = s > 0 ? onPath(s, lift) : topP.map((v, j) => v + [0.01 * (i - 2.5), 0.002, -0.006 * i][j]);
    const q = s > 0 ? onPath(Math.max(0, s - 0.14), lift) : p;
    const flare = Math.exp(-(t - land[i]) * 5);
    return { p, k: 0.8 + 0.7 * flare, trail: q.map((v, j) => v - p[j]), wing: 0.15 };
  };
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const e = ease.inOut3(clamp01((t - go + 0.6) / (P.to - go + 0.6)));
    const h = onPath(head(t), 0);
    const gate = [0.3, 0.0, 3.0];
    const hh = h.map((v, j) => v + (gate[j] - v) * 0.55);
    const look0 = [topP[0] - 0.05, topP[1] + 0.12, topP[2] + 0.5];
    const look = look0.map((v, j) => v + (hh[j] - v) * e);
    return { pos: [mix(0.32, 0.26, e), mix(1.62, 1.5, e), mix(-0.32, 0.25, e)], target: look, fov: mix(48, 44, e), roll: 0.02 };
  };
  return {
    name: 's04-took', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uKindle: 0.85, uWatN: N, uWatSize: 3.0, uNight: 0.2 },
    camera: cam,
    update(t, u) {
      u.uWindT.value = t;
      const L = []; for (let i = 0; i < N; i++) { const l = light(i, t); L.push(l ?? { p: [0, -5, 0], k: 0 }); }
      u.uWat.value = packWatchers(L);
    },
    post(t) { return grade(t, { exposure: 1.7, bloom: 0.18, threshold: 0.85, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.0, 0.015, 0.04], highlights: [0.94, 0.96, 1.0], amount: 0.5 } }; },
  };
};
