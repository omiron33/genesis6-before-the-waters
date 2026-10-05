// A JavaScript twin of ground() in lib/x-mount.js, so cameras and lights can ride the land (km).
// Keep it in step with the GLSL.
const fract = (x) => x - Math.floor(x);
const f32 = Math.fround;
function hash12(x, y) {
  let a = fract(f32(x * 0.1031)), b = fract(f32(y * 0.1031)), c = fract(f32(x * 0.1031));
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d; b += d; c += d;
  return fract((a + b) * c);
}
function vnoised(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const dux = 30 * fx * fx * (fx * (fx - 2) + 1), duy = 30 * fy * fy * (fy * (fy - 2) + 1);
  const a = hash12(ix, iy), b = hash12(ix + 1, iy), c = hash12(ix, iy + 1), d = hash12(ix + 1, iy + 1);
  const k1 = b - a, k2 = c - a, k4 = a - b - c + d;
  return [a + k1 * ux + k2 * uy + k4 * ux * uy, dux * (k1 + k4 * uy), duy * (k2 + k4 * ux)];
}
const vnoise = (x, y) => vnoised(x, y)[0];
const m2 = (x, y) => [0.8 * x + 0.6 * y, -0.6 * x + 0.8 * y];
function fbm(x, y, oct) { let s = 0, a = 0.5; for (let i = 0; i < oct; i++) { s += a * vnoise(x, y); [x, y] = m2(x, y); x *= 2.03; y *= 2.03; a *= 0.5; } return s; }
function erodedN(x, y, oct) {
  x *= 0.9; y *= 0.9;
  let a = 0, b = 1, dx = 0, dy = 0;
  for (let i = 0; i < oct; i++) {
    const n = vnoised(x, y);
    dx += n[1]; dy += n[2];
    a += (b * n[0]) / (1 + dx * dx + dy * dy);
    b *= 0.5; [x, y] = m2(x, y); x *= 2; y *= 2;
  }
  return a;
}
const sat = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const crestZ = (x) => 0.08 * Math.sin(x * 0.35) + 0.05 * Math.sin(x * 0.9 + 1.0);
export function massif(x, z) {
  const dz = z - crestZ(x);
  let hc = 1.2 + 0.22 * Math.sin(x * 0.45 + 0.8) + 0.12 * Math.sin(x * 1.3 + 2.0);
  hc = 0.35 + (hc - 0.35) * smooth(16, 7, Math.abs(x));
  const m = dz > 0 ? Math.pow(sat(1 - dz / 2.75), 1.65) : Math.exp(-dz * dz / 7);
  return [hc * m, m];
}
export const riverZ = (x) => 13.0 + 2.5 * Math.sin(x * 0.13) + 1.2 * Math.sin(x * 0.37 + 1.3);
export function ground(x, z, oct = 7) {
  const [h0, m] = massif(x, z);
  let h = h0;
  const n = erodedN(x, z, oct);
  h += (n - 0.45) * (0.04 + 0.32 * m);
  const rb = fbm(x * 5.5 + n * 0.8, z * 1.4 + n * 0.8, 3);
  h += (0.5 - Math.abs(2 * rb - 1)) * 0.11 * m * (1 - m) * 2;
  h += 0.006 * (fbm(x * 0.35, z * 0.35, 3) - 0.5);
  const dr0 = Math.abs(z - riverZ(x));
  h += 0.045 * smooth(0.45, 0.8, fbm(x * 0.28 + 7, z * 0.28 + 7, 3)) * (1 - m) * smooth(0.6, 2.0, dr0) * smooth(2.0, 4.0, z);
  h += smooth(30, 56, z) * (0.55 + 0.35 * n);
  const dr = Math.abs(z - riverZ(x));
  h -= 0.006 * smooth(0.5, 0.25, dr) * (1 - m);
  return h;
}
// the gate of a city (twin of cityR/cityGate in the GLSL); cities as in lib/x-mount.js
export function cityGate(c, ci) {
  const a = -1.5708, cx = Math.cos(a), cy = Math.sin(a);
  const R = c[2] * (1 + 0.3 * (vnoise(cx * 1.7 + ci * 5.3, cy * 1.7 + ci * 5.3) - 0.5) + 0.08 * (vnoise(cx * 5 + ci * 2.1, cy * 5 + ci * 2.1) - 0.5));
  return [c[0], c[1] - R];
}
