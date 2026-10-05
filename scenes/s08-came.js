// s08-came · "The sons of God came / to the daughters of men;" (36.42-41.32). The foot of the mountain
// path at dusk, the great walls of the first city of the valley ahead, its bronze gate standing open
// with red light pouring out. The cold burning lights come down the last of the path past the camera
// one after another and pass in through the gate; as each goes in, the gateway flares with their pale,
// unwarming light. The camera pushes toward the gate.
import { grade, ease, clamp01, mix, linesAt } from '/song/lib/look.js';
import { MOUNT_GLSL, MOUNT_UNIFORMS, PATH_LEN, pathXZ, CITIES } from '/song/lib/x-mount.js';
import { ground, cityGate } from '/song/lib/x-mount-ground.js';
import { packWatchers } from '/song/lib/x-mount-watch.js';

export const kind = 'shader';
const N = 6;

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'The sons of God came', 'to the daughters');
  const G = cityGate(CITIES[0], 0);
  const gy = ground(G[0], G[1], 5);
  const gate = [G[0], gy + 0.006, G[1]];
  const inside = [G[0] + 0.01, gy + 0.008, G[1] + 0.12];
  const s0 = PATH_LEN - 0.62;                    // where the lights come from (behind the camera)
  // when light i reaches the gate
  const at = Array.from({ length: N }, (_, i) => mix(L1.start + 1.2, L2.end - 0.2, i / (N - 1)));
  const pathPt = (s) => { const [x, z] = pathXZ(s); return [x, ground(x, z, 8) + 0.007, z]; };
  // the last segment of the path ends at the vertex before the gate; then straight in
  const lastS = PATH_LEN - Math.hypot(0.27 - 0.08, 2.97 - 2.6);
  const posAt = (i, t) => {
    const u = (t - at[i]) / 2.8;                  // -1 .. 0 coming down the path, 0 .. 1 through the gate
    if (u < -1) return null;
    if (u < -0.6) return pathPt(mix(s0, lastS, (u + 1) / 0.4));
    if (u < 0) { const a = pathPt(lastS); const k = (u + 0.6) / 0.6; return a.map((v, j) => v + (gate[j] - v) * k); }
    return gate.map((v, j) => v + (inside[j] - v) * Math.min(1, u));
  };
  const lights = (t) => Array.from({ length: N }, (_, i) => {
    const p = posAt(i, t);
    if (!p) return { p: [0, -5, 0], k: 0 };
    const q = posAt(i, t - 0.12) ?? p;
    const u = (t - at[i]) / 2.8;
    const fade = u > 0.12 ? Math.max(0, 1 - (u - 0.12) / 0.3) : 1;
    return { p, k: 1.1 * fade, trail: q.map((v, j) => (v - p[j]) * 2.5), wing: 0.35 };
  });
  const cam = (t) => {
    const p = clamp01((t - P.from) / (P.to - P.from));
    const e = 0.25 * p + 0.75 * ease.inOut3(p);
    const x = mix(0.09, 0.2, e), z = mix(2.71, 2.83, e);
    const y = Math.max(ground(x, z, 8), ground(x + 0.02, z + 0.02, 8)) + mix(0.012, 0.008, e);
    return { pos: [x, y, z], target: [gate[0] - 0.01, gate[1] + 0.014, gate[2] + 0.02], fov: mix(44, 38, e), roll: 0.01 };
  };
  return {
    name: 's08-came', from: P.from, to: P.to,
    frag: MOUNT_GLSL + 'vec3 shade(vec2 fc) { return mountShade(fc); }',
    uniforms: { ...MOUNT_UNIFORMS, uKindle: 1.0, uGateOn: 1, uDoorOpen: 1.15, uWatN: N, uWatSize: 1.3, uNight: 0.35, uHaze: 0.25, uKeyDir: [-0.75, 0.3, -0.3], uKeyCol: [0.7, 0.78, 0.95] },
    camera: cam,
    update(t, u) {
      u.uWindT.value = t;
      const L = lights(t);
      u.uWat.value = packWatchers(L);
      let f = 0;
      for (const l of L) if (l.k > 0) { const d = Math.hypot(...l.p.map((v, j) => v - gate[j])); f += l.k * Math.exp(-d / 0.025); }
      u.uGateFlare.value = Math.min(1.5, f);
    },
    post(t) { return grade(t, { exposure: 1.7, bloom: 0.2, threshold: 0.85, vignette: 0.5 }); },
    finish(t) { return { grade: { shadows: [0.01, 0.012, 0.035], highlights: [0.96, 0.95, 0.98], amount: 0.45 } }; },
  };
};
