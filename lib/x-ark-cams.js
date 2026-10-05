// Camera paths for the ark-building scenes (s27..s31). Plain JS, shared by the scenes and their lyric
// modules (the lyrics project world points through the same camera). Pure functions of song time.

// Catmull-Rom through timed keys [{t, pos, target, fov?}], with the time itself eased per segment
// only at the ends (so the move starts and lands softly but never stops dead in the middle).
const cr = (p0, p1, p2, p3, u) => {
  const u2 = u * u, u3 = u2 * u;
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
};
export function path(keys, t) {
  const n = keys.length;
  if (t <= keys[0].t) t = keys[0].t;
  if (t >= keys[n - 1].t) t = keys[n - 1].t;
  let i = 0; while (i < n - 2 && t > keys[i + 1].t) i++;
  const a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[i + 1], d = keys[Math.min(n - 1, i + 2)];
  const u = (t - b.t) / (c.t - b.t);
  const f = (k) => [0, 1, 2].map((j) => cr(a[k][j], b[k][j], c[k][j], d[k][j], u));
  const fov = cr(a.fov ?? 40, b.fov ?? 40, c.fov ?? 40, d.fov ?? 40, u);
  return { pos: f('pos'), target: f('target'), fov };
}
// time warp: ease in over the first `a` seconds and out over the last `b`, linear between
export function warp(t, t0, t1, a = 0.6, b = 0.6) {
  const T = t1 - t0, x = Math.min(Math.max(t - t0, 0), T);
  // velocity profile: ramps up over a, constant, ramps down over b; normalised to cover T
  const v = 1 / (T - a / 2 - b / 2);
  if (x < a) return t0 + v * x * x / (2 * a) * T;
  if (x > T - b) { const y = T - x; return t0 + (1 - v * y * y / (2 * b)) * T; }
  return t0 + v * (x - a / 2) * T;
}
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const lerp = (a, b, k) => a + (b - a) * k;
export const sstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// s29-cubits: from low by the bow corner, a measuring rod and cord on a trestle in the foreground,
// pulling back and rising until the whole hull is seen
export const s29keys = (T0, T1) => [
  { t: T0, pos: [97.0, 2.3, 37.0], target: [30.0, 6.5, 3.0], fov: 40 },
  { t: T0 + 3.2, pos: [112.0, 6.0, 52.0], target: [22.0, 6.5, 2.0], fov: 40 },
  { t: T0 + 6.0, pos: [114.0, 9.0, 72.0], target: [6.0, 8.0, 0.0], fov: 40 },
  { t: T1, pos: [120.0, 12.0, 86.0], target: [0.0, 9.0, 0.0], fov: 40 },
];
export const s29cam = (P) => { const k = s29keys(P.from, P.to); return (t) => path(k, warp(t, P.from, P.to, 0.3, 1.2)); };

// s30-narrow: on the roof at the stern end, looking down the length along the glowing window strip,
// rising above the ridge
export const s30keys = (T0, T1) => [
  { t: T0, pos: [-66.0, 14.6, 8.2], target: [20.0, 14.4, 1.5], fov: 38 },
  { t: T0 + 2.8, pos: [-70.0, 15.6, 8.4], target: [14.0, 14.0, 1.0], fov: 38 },
  { t: T1, pos: [-79.0, 18.6, 8.6], target: [12.0, 13.4, 0.5], fov: 38 },
];
export const s30cam = (P) => { const k = s30keys(P.from, P.to); return (t) => path(k, warp(t, P.from, P.to, 0.3, 0.8)); };

// s31-door: the open door and its ramp; then a glide left and up along the cut-away side as the lower,
// second and third decks are named and lit
export const s31keys = (T0, T1) => [
  { t: T0, pos: [7.5, 2.4, 25.0], target: [6.0, 3.3, 11.4], fov: 40 },
  { t: T0 + 2.2, pos: [4.0, 2.6, 23.5], target: [3.0, 3.3, 11.4], fov: 40 },
  { t: T0 + 3.6, pos: [-11.0, 4.0, 26.0], target: [-16.0, 4.0, 0.0], fov: 42 },
  { t: T0 + 4.5, pos: [-15.0, 6.2, 28.0], target: [-20.0, 7.3, 0.0], fov: 42 },
  { t: T1, pos: [-19.0, 9.2, 30.0], target: [-24.0, 9.6, 0.0], fov: 42 },
];
export const s31cam = (P) => { const k = s31keys(P.from, P.to); return (t) => path(k, warp(t, P.from, P.to, 0.3, 0.6)); };
