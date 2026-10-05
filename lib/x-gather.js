import { growCedars, cedarGLSL } from './x-cedar.js';
// The gathering: every living kind comes to the ark at night under a heavy storm sky (no rain yet;
// the ground dry; wind). Noe's hill: a broad flat top where the ark stands among cedars,
// falling away to a wide plain. The ark (300 : 50 : 30) is a pitch-black box hull, cedar at its ribs,
// wales, door frame and ramp, a low roof rising to a clerestory whose continuous window strip glows
// gold just under the ridge; one great door in the side, open, full of gold lamplight, with a timber
// ramp down to the mud. Before the ramp the mud is full of paired tracks of every kind converging.
// Animals are only dark silhouettes (driven by uniform arrays from JS); birds small; feathers drift.
// World: metres, y up, ark centred at the origin with its long axis along x, the door side facing +z.
// Everything is a pure function of uTime and the uniforms.

export const DOORX = -6.0;     // door centre along the hull
export const RAMPZ0 = 11.3;    // ramp top (door sill, outer face of the hull)
export const RAMPZ1 = 18.6;    // ramp foot (a run of about 7 m, as the ark of s29-s31)
export const SILL = 1.55;      // door sill height
export const DOORW = 2.3, DOORH = 4.15;   // door half width and height (as lib/x-ark.js)

// the large-scale ground (shared with JS so silhouettes stand on it)
export function hMacro(x, z) {
  const r = Math.hypot(x * 0.55, z);
  const ss = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  let h = -26 * ss(55, 230, r);
  h += 1.2 * Math.sin(x * 0.021 + 1.0) * Math.sin(z * 0.017 + 0.5) * ss(30, 80, r);
  h += 3.0 * Math.sin(x * 0.006 - 0.7) * Math.cos(z * 0.0045) * ss(150, 400, r);
  return h;
}
// height of the walking surface: the ramp where it is, else the ground
export function walkY(x, z) {
  if (Math.abs(x - DOORX) < 2.4 && z >= RAMPZ0 - 0.4 && z <= RAMPZ1) return SILL * (1 - (z - RAMPZ0) / (RAMPZ1 - RAMPZ0)) + 0.13;
  if (z < RAMPZ0 && Math.abs(x - DOORX) < 2.6) return SILL;
  return hMacro(x, z);
}

// An animal walking a polyline path [[x,z],...] starting at song time t0 at speed v (m/s).
// kind: 0 cattle, 1 lion, 2 elephant, 3 deer, 4 horse, 5 giraffe, 6 sheep, 7 camel
export function walker(path, t0, v, t, { side = 0, kind = 0, scale = 1, stride = 1.6 } = {}) {
  let s = Math.max(0, (t - t0) * v);
  const seg = [];
  let tot = 0;
  for (let i = 0; i < path.length - 1; i++) { const l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); seg.push(l); tot += l; }
  const done = s >= tot;
  s = Math.min(s, tot - 1e-3);
  let i = 0; while (i < seg.length - 1 && s > seg[i]) { s -= seg[i]; i++; }
  const a = path[i], b = path[i + 1], k = s / seg[i];
  const dx = (b[0] - a[0]) / seg[i], dz = (b[1] - a[1]) / seg[i];
  const x = a[0] + (b[0] - a[0]) * k - dz * side, z = a[1] + (b[1] - a[1]) * k + dx * side;
  const y = walkY(x, z);
  const y2 = walkY(x + dx * 0.8, z + dz * 0.8);
  const pitch = Math.atan2(y2 - y, 0.8);
  const ph = ((t - t0) * v / (stride * scale)) * Math.PI * 2;
  return { x, y, z, heading: Math.atan2(dz, dx), kind, scale, ph, pitch, done };
}
// pack up to 16 animals for the shader
export function packAnimals(list, u) {
  const A = new Array(64).fill(0), B = new Array(64).fill(0);
  list.slice(0, 16).forEach((a, i) => { A.splice(i * 4, 4, a.x, a.y, a.z, a.heading); B.splice(i * 4, 4, a.kind, a.scale, a.ph, a.pitch ?? 0); });
  u.uAnA.value = A; u.uAnB.value = B; u.uNA.value = Math.min(16, list.length);
}
// birds: { x,y,z, heading, kind (0 dove, 1 raven, 2 small dark, 3 pale), fly 0 perched..1 flying, ph, size }
export function packBirds(list, u) {
  const A = new Array(48).fill(0), B = new Array(48).fill(0);
  list.slice(0, 12).forEach((b, i) => { A.splice(i * 4, 4, b.x, b.y, b.z, b.heading); B.splice(i * 4, 4, b.kind, b.fly, b.ph, b.size ?? 1); });
  u.uBdA.value = A; u.uBdB.value = B; u.uNB.value = Math.min(12, list.length);
}
// carried lamps: [x, y, z, strength]
export function packLamps(list, u) {
  const A = new Array(32).fill(0);
  list.slice(0, 8).forEach((l, i) => A.splice(i * 4, 4, l[0], l[1], l[2], l[3]));
  u.uLmA.value = A; u.uNL.value = Math.min(8, list.length);
}

const h11 = (p) => { p = (p * 0.1031) % 1; if (p < 0) p += 1; p *= p + 33.33; p *= p + p; return p % 1; };
export const TREES = (() => {
  const out = [];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.399 + 0.6, r = 34 + 34 * h11(i * 3.7);
    let x = Math.cos(a) * r * 1.9, z = Math.sin(a) * r * 0.85;
    if (z > 8 && Math.abs(x - DOORX) < 30) x += Math.sign(x - DOORX + 0.01) * 34;
    out.push(x, hMacro(x, z), z, 26 + 10 * h11(i * 5.1));
  }
  return out;
})();
export const CEDARS = growCedars(Array.from({ length: 14 }, (_, i) => ({
  base: [TREES[i * 4], TREES[i * 4 + 1], TREES[i * 4 + 2]], h: TREES[i * 4 + 3], r0: 0.75 + 0.2 * h11(i * 2.2), spread: 9 + 3 * h11(i * 4.4), seed: i * 11 + 3,
})));
export const GATHER_UNIFORMS = {
  uTrA: TREES,
  uFocus: 20, uAper: 0.0,
  uNA: 0, uAnA: new Array(64).fill(0), uAnB: new Array(64).fill(0),
  uNB: 0, uBdA: new Array(48).fill(0), uBdB: new Array(48).fill(0),
  uNL: 0, uLmA: new Array(32).fill(0),
  uTracks: 1, uGrass: 0, uCrawl: 0, uFeathers: 0, uTrees: 1, uRoom: 1,
  uDoorI: 1, uExpo: 1, uDrizzle: 0, uFeatherC: [0, 14, 0], uFlicker: 0, uMoon: 1, uScrub: 1, uDusk: 0, uDuskDir: [-0.8, 0, -0.6], uRimSky: 0, uMoonY: 0.32, uTreeOff: 0,
};

export const GATHER_GLSL = /* glsl */ `
uniform float uFocus, uAper;
uniform float uNA; uniform float uAnA[64]; uniform float uAnB[64];
uniform float uNB; uniform float uBdA[48]; uniform float uBdB[48];
uniform float uNL; uniform float uLmA[32];
uniform float uTracks, uGrass, uCrawl, uFeathers, uTrees, uRoom, uDoorI, uExpo, uDrizzle, uFlicker;
uniform vec3 uFeatherC;
uniform float uMoon, uScrub;
uniform float uTrA[56];
uniform float uDusk, uRimSky, uMoonY, uTreeOff;
uniform vec3 uDuskDir;
bool gLite = false;
${cedarGLSL(CEDARS)}

const float DOORX = ${DOORX.toFixed(2)};
const float RZ0 = ${RAMPZ0.toFixed(2)}, RZ1 = ${RAMPZ1.toFixed(2)}, SILL = ${SILL.toFixed(2)};
const float DW = ${DOORW.toFixed(2)}, DH = ${DOORH.toFixed(2)};
const vec3 DOORL = vec3(DOORX, 3.9, 9.6);          // the gold light that fills the door
const vec3 GOLD = vec3(1.0, 0.66, 0.30);
const vec3 LAMPC = vec3(1.0, 0.55, 0.22);

float hMacro(vec2 q) {
  float r = length(q * vec2(0.55, 1.0));
  float h = -26.0 * smoothstep(55.0, 230.0, r);
  h += 1.2 * sin(q.x * 0.021 + 1.0) * sin(q.y * 0.017 + 0.5) * smoothstep(30.0, 80.0, r);
  h += 3.0 * sin(q.x * 0.006 - 0.7) * cos(q.y * 0.0045) * smoothstep(150.0, 400.0, r);
  return h;
}
float gH(vec2 q) { return hMacro(q) + 0.07 * (vnoise(q * 1.1) - 0.5) + 0.25 * (vnoise(q * 0.13) - 0.5); }

// ---------------- tracks in the mud ----------------
const vec2 FOOT = vec2(${DOORX.toFixed(2)}, ${(RAMPZ1 + 0.3).toFixed(2)});
float seg2(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * sat(dot(pa, ba) / dot(ba, ba))); }
// one print: u along (+ toward the ark), v across; returns depth 0..1
float printShape(int k, vec2 q, float sz) {
  q /= sz;
  if (k == 0) {          // cloven hoof
    vec2 a = vec2(q.x, abs(q.y) - 0.032);
    float e = length(a / vec2(0.06, 0.026));
    return smoothstep(1.0, 0.7, e);
  } else if (k == 1) {   // paw: a pad and four toes
    float pad = smoothstep(1.0, 0.75, length((q - vec2(-0.015, 0.0)) / vec2(0.035, 0.042)));
    float toes = 0.0;
    for (int i = 0; i < 4; i++) { float a = (float(i) - 1.5) * 0.42; vec2 c = vec2(0.045 + 0.012 * cos(a * 2.0), 0.0) ; c = vec2(c.x * cos(a), sin(a) * 0.05); toes = max(toes, smoothstep(0.017, 0.011, length(q - c))); }
    return max(pad, toes);
  } else if (k == 2) {   // bird: three toes forward, one back
    float d = seg2(q, vec2(0.0), vec2(0.075, 0.0));
    d = min(d, seg2(q, vec2(0.0), vec2(0.055, 0.045)));
    d = min(d, seg2(q, vec2(0.0), vec2(0.055, -0.045)));
    d = min(d, seg2(q, vec2(0.0), vec2(-0.035, 0.0)));
    return smoothstep(0.009, 0.004, d);
  }
  // crawling thing: a small splayed hand
  float d = 1.0;
  for (int i = 0; i < 5; i++) { float a = (float(i) - 2.0) * 0.55; d = min(d, seg2(q, vec2(0.0), vec2(cos(a), sin(a)) * 0.028)); }
  return smoothstep(0.006, 0.003, d);
}
// tracks: returns depth (m, negative) and mud mask in .y
vec2 tracks(vec2 xz) {
  vec2 q = xz - FOOT; float r = length(q);
  float mud = smoothstep(4.5, 2.0, r);
  if (r > 34.0 || q.y < -3.0) return vec2(0.0, mud);
  float phi = atan(q.x, q.y);
  const float DA = 0.19;
  float f0 = floor(phi / DA + 0.5);
  float dep = 0.0;
  for (int c = -1; c <= 1; c++) {
    float fi = f0 + float(c);
    if (abs(fi) > 6.0) continue;
    float wob = (0.16 * sin(r * 0.11 + fi * 2.1) + 0.05 * sin(r * 0.37 + fi)) * smoothstep(2.0, 10.0, r);
    float pa = fi * DA + wob;
    float lat = r * sin(phi - pa);
    if (abs(lat) > 1.6) continue;
    mud = max(mud, smoothstep(1.6, 0.7, abs(lat)) * smoothstep(34.0, 24.0, r));
    float hk = hash11(fi * 7.31 + 3.0);
    int k = int(floor(hk * 4.0));
    float sz = k == 0 ? (0.9 + 0.5 * hash11(fi * 3.3)) : k == 1 ? 1.0 + 0.4 * hash11(fi * 5.1) : k == 2 ? 0.8 + 0.4 * hash11(fi) : 0.9;
    float stride = k == 0 ? 0.75 * sz : k == 1 ? 0.62 * sz : k == 2 ? 0.16 * sz : 0.12;
    float gauge = k == 0 ? 0.13 * sz : k == 1 ? 0.12 * sz : k == 2 ? 0.035 : 0.05;
    float depth = k == 0 ? 0.035 : k == 1 ? 0.028 : k == 2 ? 0.014 : 0.012;
    float merge = smoothstep(1.0, 4.0, r);
    for (int a = -1; a <= 1; a += 2) {
      float lo = float(a) * (k == 2 || k == 3 ? 0.22 : 0.42) * merge;
      float v = lat - lo;
      if (abs(v) > 0.4) continue;
      for (int sd = -1; sd <= 1; sd += 2) {
        float u = r + (sd > 0 ? stride * 0.5 : 0.0) + float(a) * 0.37 * stride + 0.04 * sin(fi * 3.0);
        float cell = floor(u / stride);
        float uu = u - (cell + 0.5) * stride;
        float vv = v - float(sd) * gauge;
        // a little scatter per print; prints point toward the ark (-u)
        vec2 j = (hash22(vec2(cell, fi * 13.0 + float(a * 3 + sd))) - 0.5) * vec2(0.03, 0.02);
        float pr = printShape(k, vec2(-(uu - j.x), vv - j.y), sz * (k == 3 ? 1.0 : 1.0));
        dep = max(dep, pr * depth * (0.7 + 0.5 * hash11(cell + fi)));
      }
      // the tail drag of the crawling things
      if (k == 3) dep = max(dep, smoothstep(0.012, 0.004, abs(v - 0.02 * sin(r * 5.0 + fi))) * 0.006);
    }
  }
  dep *= smoothstep(0.3, 1.2, r);
  return vec2(-dep * uTracks, mud);
}

// straw: thin strands lying every which way
float hayTex(vec2 p) {
  float acc = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 q = rot(fi * 1.7 + 1.2 * vnoise(p * 0.8 + fi * 5.0)) * p + fi * 3.1;
    vec2 c = vec2(q.x * 5.0, q.y * 60.0);
    vec2 id = floor(c);
    float h = hash12(id + fi * 17.0);
    float line = pow(1.0 - abs(2.0 * fract(c.y) - 1.0), 2.5) * step(0.3, h) * smoothstep(0.0, 0.15, fract(c.x)) * smoothstep(1.0, 0.85, fract(c.x));
    acc = max(acc * 0.92, line * (0.55 + 0.45 * h));
  }
  return acc;
}
// ---------------- the ark ----------------
vec3 roomLamp(int i) {
  float fi = float(i);
  float sw = 0.04 * sin(uTime * 0.9 + fi * 1.7);
  return vec3(DOORX + (i % 2 == 0 ? -1.95 : 1.95) + sw, SILL + 3.55, 8.2 - 3.2 * fi + 0.35);
}
// two clay lamps on cedar brackets either side of the door, burning all night
vec3 wallLamp(int i) { return vec3(DOORX + (i == 0 ? -1.0 : 1.0) * (DW + 1.1), SILL + DH + 0.55, 11.95); }
bool inRoomP(vec3 p) { return p.z < 11.0 && p.z > -10.3 && abs(p.x - DOORX) < 9.25 && p.y < SILL + 6.4 && p.y > SILL - 0.6; }
float arkHull(vec3 p, out float mat) {
  mat = 2.0;
  float az = abs(p.z);
  // cheap bound: far from the hull, leaf, frame and room, step straight on
  float bnd = sdBox(p - vec3(0.0, 7.3, 0.0), vec3(68.2, 7.6, 11.95));
  if (bnd > 1.5) return bnd;
  float body = sdBox(p - vec3(0.0, 5.55, 0.0), vec3(67.5, 5.6, 11.25));
  float roofTop = 11.1 + (11.45 - az) * 0.19;
  float roof = max(max(p.y - roofTop, 10.9 - p.y), max(az - 11.45, abs(p.x) - 67.75)) * 0.92;
  float cl = sdBox(p - vec3(0.0, 13.05, 0.0), vec3(67.0, 0.62, 2.6));
  float capTop = 13.75 + (2.95 - az) * 0.26;
  float cap = max(max(p.y - capTop, 13.62 - p.y), max(az - 2.95, abs(p.x) - 67.25)) * 0.92;
  float d = min(min(body, roof), min(cl, cap));
  // a heavy pitched wale along each side, above the door head
  d = min(d, sdBox(vec3(p.x, p.y - 7.45, az - 11.3), vec3(67.55, 0.2, 0.1)) - 0.02);
  // the door opening and the lit room behind it
  float hole = sdBox(p - vec3(DOORX, SILL + DH * 0.5, 11.3), vec3(DW, DH * 0.5, 0.7));
  float room = sdBox(p - vec3(DOORX, SILL + 3.2, 0.35), vec3(9.2, 3.2, 10.65));
  d = max(d, -min(hole, room));
  // cedar: corner posts, the top rail, the door's heavy frame and the open leaf
  float cp = sdBox(vec3(abs(p.x) - 67.5, p.y - 5.5, az - 11.25), vec3(0.24, 5.5, 0.24));
  float rail = sdBox(vec3(p.x, p.y - 10.95, az - 11.33), vec3(67.6, 0.2, 0.12));
  vec3 fq = p - vec3(DOORX, SILL + DH * 0.5, 11.25);
  float frame = sdBox(fq - vec3(0.0, 0.12, 0.08), vec3(DW + 0.38, DH * 0.5 + 0.42, 0.2));
  frame = max(frame, -sdBox(fq, vec3(DW, DH * 0.5, 1.0)));
  // the lining of the opening, through the thickness of the wall
  float lining = max(sdBox(fq - vec3(0.0, 0.0, -0.3), vec3(DW + 0.05, DH * 0.5 + 0.05, 0.3)), -sdBox(fq, vec3(DW - 0.12, DH * 0.5 - 0.12, 1.0)));
  frame = min(frame, lining);
  // the leaf: hinged on its +x side, swung right round and resting flat against the hull on its pins
  vec3 lq = p - vec3(DOORX + DW + 0.38 + DW + 0.08, SILL + DH * 0.5, 11.25 + 0.3);
  float leaf = sdBox(lq, vec3(DW + 0.05, DH * 0.5 + 0.05, 0.11));
  float batten = sdBox(vec3(lq.x, abs(lq.y) - DH * 0.32, lq.z - 0.12), vec3(DW - 0.1, 0.13, 0.05));
  float hinge = sdBox(vec3(lq.x + DW * 0.45, abs(lq.y) - DH * 0.32, lq.z - 0.14), vec3(DW * 0.6, 0.06, 0.025));
  float pins = length(vec2(p.x - (DOORX + DW + 0.33), p.z - 11.5)) - 0.07;
  pins = max(pins, abs(abs(p.y - SILL - DH * 0.5) - DH * 0.32) - 0.16);
  leaf = min(min(leaf, batten), pins);
  float hg = min(hinge, pins);
  float ced = min(min(cp, rail), min(frame, leaf));
  if (hg < ced - 0.0 && hg < d) { mat = 15.0; return hg; }
  float wl = 1e9;
  for (int i = 0; i < 2; i++) {
    vec3 c = wallLamp(i);
    wl = min(wl, sdEllipsoid(p - c + vec3(0.0, 0.05, 0.0), vec3(0.13, 0.06, 0.1)));
    ced = min(ced, sdBox(p - c + vec3(0.0, 0.14, 0.35), vec3(0.05, 0.05, 0.4)));       // the bracket
    ced = min(ced, sdBox(p - vec3(c.x, c.y - 0.5, 11.3), vec3(0.08, 0.45, 0.06)));
  }
  if (wl < ced && wl < d) { mat = 14.0; return wl; }
  // the room: stall partitions, posts, a manger and the beams of the deck above
  float roomReg = max(max(p.z - 11.2, -10.5 - p.z), max(abs(p.x - DOORX) - 9.3, p.y - SILL - 6.5));
  if (uRoom > 0.5 && roomReg > 0.0) d = min(d, roomReg + 0.02);   // never step over into the room
  if (uRoom > 0.5 && roomReg <= 0.0) {
    float xs = p.x - DOORX, ax = abs(xs), y = p.y - SILL;
    float zk = clamp(floor((8.2 - p.z) / 3.2 + 0.5), 0.0, 5.0);
    float zz = p.z - (8.2 - 3.2 * zk);
    // stall partitions either side of the aisle, a top rail on each
    float part = sdBox(vec3(ax - 5.65, y - 0.62, zz), vec3(3.25, 0.62, 0.035));
    part = min(part, sdBox(vec3(ax - 5.65, y - 1.3, zz), vec3(3.25, 0.07, 0.08)));
    float posts = sdBox(vec3(ax - 2.4, y - 3.1, zz), vec3(0.13, 3.1, 0.13));
    float beams = sdBox(vec3(xs, y - 6.0, zz), vec3(9.2, 0.18, 0.15));
    float joist = sdBox(vec3(mod(xs + 0.6, 1.2) - 0.6, y - 6.25, p.z), vec3(0.08, 0.1, 10.6));
    // mangers on the aisle side of each stall, and a water trough
    float zm = p.z - (8.2 - 3.2 * clamp(floor((8.2 - 1.6 - p.z) / 3.2 + 0.5), 0.0, 5.0) - 1.6);
    float manger = max(sdBox(vec3(ax - 2.95, y - 0.75, zm), vec3(0.32, 0.22, 1.1)), -sdBox(vec3(ax - 2.95, y - 0.9, zm), vec3(0.24, 0.22, 1.02)));
    float back = sdBox(vec3(xs, y - 1.0, p.z + 9.6), vec3(1.6, 0.3, 0.3));
    back = max(back, -sdBox(vec3(xs, y - 1.15, p.z + 9.6), vec3(1.5, 0.3, 0.22)));
    float rm = min(min(part, posts), min(min(beams, joist), min(manger, back)));
    ced = min(ced, rm);
    // hanging clay lamps on their cords
    float lampd = 1e9;
    for (int i = 0; i < 6; i++) {
      vec3 lp = roomLamp(i);
      lampd = min(lampd, sdEllipsoid(p - lp + vec3(0.0, 0.06, 0.0), vec3(0.11, 0.05, 0.08)));
      lampd = min(lampd, sdCapsule(p, lp + vec3(0.0, 0.07, 0.0), vec3(DOORX + sign(lp.x - DOORX) * 2.3, lp.y + 0.3, lp.z), 0.025));
    }
    // hay: a thin litter in the aisle, heaped deep in the stalls and in the mangers
    float hay = y - 0.05 - 0.05 * vnoise(p.xz * 6.0) - smoothstep(2.6, 3.6, ax) * (0.35 + 0.35 * vnoise(p.xz * 0.8 + 3.0)) * smoothstep(0.1, 0.5, abs(zz));
    float mh = max(sdBox(vec3(ax - 2.95, y - 0.98 - 0.08 * vnoise(p.xz * 5.0), zm), vec3(0.24, 0.05, 1.0)), 0.0);
    hay = min(hay, mh);
    if (lampd < d && lampd < ced && lampd < hay) { mat = 14.0; return lampd; }
    if (hay < d && hay < ced) { mat = 4.0; return hay; }
  }
  if (ced < d) { mat = 3.0; return ced; }
  return d;
}
// the ramp: planks with cleats, two stringers under it
float rampSD(vec3 p) {
  float L = RZ1 - RZ0, len = length(vec2(L, SILL));
  vec2 nn = vec2(L, SILL) / len;                       // (y, z) normal of the top surface
  vec2 r = vec2(p.y - SILL, p.z - RZ0);
  float s = dot(r, nn);                                // height above the top plane
  float u = dot(r, vec2(-SILL, L) / len);              // distance down the slope
  float ax = abs(p.x - DOORX);
  float d = max(max(s, -s - 0.16), max(ax - 2.4, max(-u, u - len)));
  float cl = max(max(abs(s - 0.018) - 0.02, abs(mod(u, 0.55) - 0.275) - 0.03), max(ax - 2.3, max(0.2 - u, u - len + 0.2)));
  d = min(d, cl);
  float str = max(max(abs(s + 0.32) - 0.2, abs(ax - 2.1) - 0.12), max(-u, u - len));
  str = max(str, -p.y);
  return min(d, str);
}

// ---------------- cedars on the hill ----------------
vec3 treePos(int i) { return vec3(uTrA[i * 4], uTrA[i * 4 + 1], uTrA[i * 4 + 2]); }
// low scrub scattered over the hill and the plain
float scrubSD(vec3 p, float gy) {
  if (p.y - gy > 2.2) return p.y - gy - 2.0;
  const float C = 11.0;
  vec2 id = floor(p.xz / C);
  vec2 h = hash22(id * 1.7 + 3.0);
  if (h.x < 0.6) return 1e9;
  vec2 cxz = (id + 0.2 + 0.6 * hash22(id + 9.0)) * C;
  float r = 0.4 + 0.8 * h.y;
  vec3 q = p - vec3(cxz.x, gy - 0.2 * r, cxz.y);
  float d = sdEllipsoid(q, vec3(r * 1.4, r * 0.6, r * 1.1)) + 0.5 * r * (vnoise(q * 3.0 / r) - 0.5);
  return max(d * 0.8, -(C * 0.5 - max(abs(p.x - (id.x + 0.5) * C), abs(p.z - (id.y + 0.5) * C))) - 0.5);
}

// ---------------- the animals (dark silhouettes) ----------------
float uManeOK = 1.0;
int animMask = 0xffff;   // which animals the current ray can meet (march only)
float animR(int k) { return k == 5 ? 4.0 : k == 2 ? 3.4 : k == 1 ? 1.5 : k == 3 ? 1.7 : k == 6 ? 1.2 : k == 0 ? 1.9 : k == 4 ? 2.1 : 2.3; }
int animRayMask(vec3 ro, vec3 rd) {
  int m = 0;
  for (int i = 0; i < 16; i++) {
    if (float(i) >= uNA) break;
    float R = animR(int(uAnB[i * 4])) * uAnB[i * 4 + 1];
    vec3 c = vec3(uAnA[i * 4], uAnA[i * 4 + 1], uAnA[i * 4 + 2]) + vec3(0.0, R * 0.45, 0.0);
    vec3 oc = c - ro; float tc = max(dot(oc, rd), 0.0);
    if (dot(oc, oc) - tc * tc < (R + 0.3) * (R + 0.3) || length(oc) < R + 0.3) m |= 1 << i;
  }
  return m;
}
// a leg as a chain of tapered segments in the x-y plane, swung about its top by sw, the lower part
// folding back by fold (when the hoof is lifted)
float limb3(vec3 q, vec3 top, vec2 a, vec2 b, vec2 c, float r0, float r1, float r2, float sw, float fold) {
  mat2 R = rot(-sw);
  vec2 A = R * a, B = R * (a + rot(fold) * b), C = R * (a + rot(fold) * b + rot(fold * 1.6) * c);
  vec3 p1 = top + vec3(A, 0.0), p2 = top + vec3(B, 0.0), p3 = top + vec3(C, 0.0);
  return min(min(sdRoundCone(q, top, p1, r0, r1), sdRoundCone(q, p1, p2, r1, r2)), sdRoundCone(q, p2, p3, r2, r2 * 0.9));
}
float animalSD(vec3 q, int k, float ph) {
  // shoulder height, half body length, body depth and width radii, neck (angle, length, radii),
  // head (angle, length, radius), leg radii
  float sh = 1.4, bl = 1.05, bd = 0.42, bw = 0.34, na = 0.3, nl = 0.5, nr0 = 0.3, nr1 = 0.17, ha = -1.0, hl = 0.5, hr = 0.16, lr0 = 0.13, lr1 = 0.05;
  if (k == 1) { sh = 0.95; bl = 0.85; bd = 0.3; bw = 0.24; na = 0.55; nl = 0.32; nr0 = 0.25; nr1 = 0.2; ha = -0.5; hl = 0.32; hr = 0.17; lr0 = 0.11; lr1 = 0.06; }
  else if (k == 2) { sh = 2.8; bl = 1.6; bd = 0.95; bw = 0.85; na = 0.3; nl = 0.4; nr0 = 0.75; nr1 = 0.6; ha = -1.3; hl = 0.7; hr = 0.55; lr0 = 0.36; lr1 = 0.3; }
  else if (k == 3) { sh = 1.1; bl = 0.62; bd = 0.25; bw = 0.18; na = 1.0; nl = 0.6; nr0 = 0.15; nr1 = 0.08; ha = -0.45; hl = 0.3; hr = 0.08; lr0 = 0.07; lr1 = 0.025; }
  else if (k == 4) { sh = 1.55; bl = 0.95; bd = 0.36; bw = 0.28; na = 0.95; nl = 0.85; nr0 = 0.24; nr1 = 0.12; ha = -0.75; hl = 0.6; hr = 0.12; lr0 = 0.11; lr1 = 0.04; }
  else if (k == 5) { sh = 3.0; bl = 0.85; bd = 0.48; bw = 0.36; na = 1.12; nl = 2.3; nr0 = 0.24; nr1 = 0.09; ha = -0.35; hl = 0.5; hr = 0.1; lr0 = 0.1; lr1 = 0.045; }
  else if (k == 6) { sh = 0.78; bl = 0.55; bd = 0.32; bw = 0.3; na = 0.55; nl = 0.28; nr0 = 0.18; nr1 = 0.1; ha = -0.9; hl = 0.25; hr = 0.09; lr0 = 0.06; lr1 = 0.03; }
  else if (k == 7) { sh = 1.95; bl = 1.0; bd = 0.4; bw = 0.3; na = -0.15; nl = 0.8; nr0 = 0.18; nr1 = 0.12; ha = 0.1; hl = 0.5; hr = 0.12; lr0 = 0.1; lr1 = 0.045; }
  float bob = 0.02 * sh * sin(ph * 2.0);
  float yb = sh - bd * 0.55 + bob;
  // torso: a deep chest, the hindquarters, a little sag between
  float d = sdEllipsoid(q - vec3(bl * 0.38, yb, 0.0), vec3(bl * 0.62, bd, bw));
  d = smin(d, sdEllipsoid(q - vec3(-bl * 0.5, yb + (k == 5 ? -0.25 : 0.03) * bd, 0.0), vec3(bl * 0.55, bd * 0.9, bw * 0.95)), bd * 0.6);
  if (k == 7) d = smin(d, sdEllipsoid(q - vec3(-0.05, yb + bd * 0.95, 0.0), vec3(0.42, 0.42, 0.25)), 0.2);
  if (k == 6) d -= 0.03 * vnoise(q * 18.0);          // wool
  // neck and head, nodding with the walk
  float nod = 0.06 * sin(ph * 2.0 + 0.8);
  vec3 n0 = vec3(bl * 0.78, yb + bd * 0.3, 0.0);
  vec3 n1 = n0 + vec3(cos(na + nod), sin(na + nod), 0.0) * nl;
  if (k == 7) { vec3 m = n0 + vec3(0.55, -0.25, 0.0); d = smin(d, sdRoundCone(q, n0, m, nr0, nr1), 0.12); n0 = m; n1 = m + vec3(0.25, 0.75, 0.0); }
  d = smin(d, sdRoundCone(q, n0, n1, nr0, nr1), bd * 0.35);
  vec3 h1 = n1 + vec3(cos(ha + nod), sin(ha + nod), 0.0) * hl;
  d = smin(d, sdRoundCone(q, n1, h1, hr, hr * 0.62), 0.05);
  // ears, horns, mane, trunk: only near the head
  vec3 qe = vec3(q.x, q.y, abs(q.z));
  float rHd = k == 2 ? 2.4 : k == 1 ? 0.75 : k == 3 ? 0.8 : 0.6;
  float bH = length(q - n1) - rHd;
  if (bH > 0.05) d = min(d, bH); else {
  if (k != 2) d = min(d, sdRoundCone(qe, n1 + vec3(-0.02, hr * 0.6, hr * 0.5), n1 + vec3(-0.08, hr * 1.3, hr * 1.1), hr * 0.25, hr * 0.12));
  if (k == 0) d = min(d, sdRoundCone(qe, n1 + vec3(0.0, hr * 0.8, hr * 0.6), n1 + vec3(0.1, hr * 1.9, hr * 2.4), 0.04, 0.012));
  if (k == 1 && uManeOK > 0.5) d = smin(d, sdEllipsoid(q - n1 + vec3(0.12, 0.02, 0.0), vec3(0.3, 0.34, 0.3)) + 0.04 * vnoise(q * 14.0), 0.06);
  if (k == 3 && fract(ph * 0.0) < 1.0) { d = min(d, sdCapsule(qe, n1 + vec3(-0.03, 0.08, 0.04), n1 + vec3(-0.2, 0.55, 0.28), 0.016)); d = min(d, sdCapsule(qe, n1 + vec3(-0.1, 0.3, 0.14), n1 + vec3(0.05, 0.5, 0.18), 0.012)); }
  if (k == 5) d = min(d, sdCapsule(qe, n1 + vec3(-0.06, 0.1, 0.04), n1 + vec3(-0.08, 0.24, 0.05), 0.02));
  if (k == 2) {
    vec3 t0 = h1, t1 = h1 + vec3(0.18, -0.8, 0.0), t2 = t1 + vec3(0.1 + 0.08 * sin(ph), -0.7, 0.0);
    d = smin(d, min(sdRoundCone(q, t0, t1, 0.2, 0.13), sdRoundCone(q, t1, t2, 0.13, 0.07)), 0.12);
    d = smin(d, sdEllipsoid(qe - n1 - vec3(-0.25, 0.05, 0.55), vec3(0.4, 0.55, 0.06)), 0.08);
    d = min(d, sdRoundCone(qe, h1 + vec3(-0.05, 0.05, 0.18), h1 + vec3(0.35, -0.25, 0.22), 0.06, 0.03));
  }
  }
  // tail
  vec3 tA = vec3(-bl * 1.0, yb + bd * 0.45, 0.0);
  vec3 tB = tA + vec3(-0.12, -(k == 1 ? 0.5 : k == 2 ? 0.8 : 0.65) * sh * 0.55, 0.06 * sin(ph));
  if (k == 1) tB = tA + vec3(-0.6, -0.25 + 0.1 * sin(ph), 0.1 * sin(ph * 0.5));
  d = min(d, sdRoundCone(q, tA, tB, (k == 4 ? 0.09 : 0.035) * (k == 2 ? 1.6 : 1.0), (k == 4 ? 0.12 : 0.02)));
  // four legs in a walking gait: fore legs straight-kneed, hind legs with the hock folding back
  if (q.y > yb + lr0 * 1.6 + 0.1) return min(d, q.y - yb - lr0 * 1.6);
  float sgn = sign(q.z + 1e-4);
  vec3 qz = vec3(q.x, q.y, abs(q.z));
  float o = sgn > 0.0 ? 0.0 : PI;
  float sw = k == 2 ? 0.22 : k == 5 ? 0.3 : 0.36;
  float pF = ph + o + PI * 0.5, pH = ph + o;
  float L = yb;
  float lf = max(0.0, cos(pF)), lh = max(0.0, cos(pH));
  float fF = (k == 2 ? 0.25 : 0.9) * lf, fH = (k == 2 ? 0.25 : 0.8) * lh;
  vec3 tF = vec3(bl * 0.6, yb - bd * 0.2, bw * 0.55);
  vec3 tH = vec3(-bl * 0.62, yb - bd * 0.1, bw * 0.55);
  float swF = sw * sin(pF), swH = sw * sin(pH);
  float dF = limb3(qz, tF, vec2(0.0, -L * 0.42), vec2(0.0, -L * 0.3), vec2(0.0, -L * 0.28 + 0.005), lr0, lr0 * 0.62, lr1, swF, fF * 0.9);
  float dH = limb3(qz, tH, vec2(L * (k == 2 ? 0.0 : 0.1), -L * 0.4), vec2(L * (k == 2 ? 0.0 : -0.12), -L * 0.3), vec2(0.0, -L * 0.3 + 0.005), lr0 * 1.25, lr0 * 0.55, lr1, swH, -fH * 0.6);
  d = smin(d, min(dF, dH), lr0 * 0.8);
  return d;
}
float animalsSD(vec3 p, float dmax) {
  float d = dmax;
  for (int i = 0; i < 16; i++) {
    if (float(i) >= uNA) break;
    if ((animMask & (1 << i)) == 0) continue;
    vec3 c = vec3(uAnA[i * 4], uAnA[i * 4 + 1], uAnA[i * 4 + 2]);
    int k = int(uAnB[i * 4]); float sc = uAnB[i * 4 + 1];
    float R = animR(k) * sc;
    float b = length(p - c - vec3(0.0, R * 0.45, 0.0)) - R;
    if (b > d) continue;
    if (b > 0.5 * sc) { d = b; continue; }      // still outside its bounding sphere: step to it
    vec3 q = p - c;
    q.xz = rot(uAnA[i * 4 + 3]) * q.xz;
    q.xy = rot(uAnB[i * 4 + 3]) * q.xy;
    uManeOK = sc > 1.0 ? 1.0 : 0.0;
    float e = animalSD(q / sc, k, uAnB[i * 4 + 2]) * sc;
    if (e < 0.08 * sc && length(p - uCamPos) < 30.0) e += sc * (0.008 * (vnoise(q * 34.0 / sc) - 0.5) + 0.003 * (vnoise(q * 90.0 / sc) - 0.5));
    d = min(d, e);
  }
  return d;
}

// ---------------- birds ----------------
float birdSD(vec3 q, float fly, float ph, int k) {
  float d = sdEllipsoid(q, vec3(0.13, 0.065, 0.065));
  d = smin(d, sdSphere(q - vec3(0.12, 0.06 - 0.03 * fly, 0.0), 0.045), 0.03);
  d = min(d, sdRoundCone(q, vec3(0.15, 0.055 - 0.03 * fly, 0.0), vec3(k == 1 ? 0.22 : 0.195, 0.045 - 0.03 * fly, 0.0), 0.016, 0.004));
  vec3 tq = q - vec3(-0.17, 0.0, 0.0); tq.xy = rot(-0.25 + 0.25 * fly) * tq.xy;
  d = smin(d, sdEllipsoid(tq, vec3(0.1, 0.012, 0.045 + 0.02 * fly)), 0.02);
  // wings: folded along the back when perched, spread and beating in flight
  vec3 wq = vec3(q.x, q.y, abs(q.z));
  float flap = fly * (0.25 + 0.9 * sin(ph));
  vec3 w0 = vec3(0.0, 0.03, 0.03);
  wq -= w0; wq.yz = rot(-flap) * wq.yz;
  float spread = mix(0.04, 0.26, fly);
  float wing = sdEllipsoid(wq - vec3(-0.04 + 0.03 * fly, 0.0, spread), vec3(0.12 - 0.02 * fly, 0.012, spread + 0.01));
  d = smin(d, wing, 0.02);
  // legs when perched
  if (fly < 0.5) d = min(d, sdCapsule(vec3(q.x, q.y, abs(q.z)), vec3(0.0, -0.05, 0.03), vec3(0.01, -0.11, 0.03), 0.006));
  return d;
}
float birdsSD(vec3 p, float dmax, out float bk) {
  float d = dmax; bk = 0.0;
  for (int i = 0; i < 12; i++) {
    if (float(i) >= uNB) break;
    vec3 c = vec3(uBdA[i * 4], uBdA[i * 4 + 1], uBdA[i * 4 + 2]);
    float sc = uBdB[i * 4 + 3];
    float b = length(p - c) - 0.45 * sc;
    if (b > d) continue;
    vec3 q = (p - c) / sc;
    q.xz = rot(uBdA[i * 4 + 3]) * q.xz;
    float e = birdSD(q, uBdB[i * 4 + 1], uBdB[i * 4 + 2], int(uBdB[i * 4])) * sc;
    if (e < d) { d = e; bk = uBdB[i * 4]; }
  }
  return d;
}

// ---------------- feathers drifting ----------------
vec3 featherPos(int i, out vec3 ang) {
  float fi = float(i);
  float life = 7.0 + 3.0 * hash11(fi * 1.7);
  float t0 = hash11(fi * 9.1) * life;
  float x = mod(uTime + t0, life) / life;
  vec3 s = uFeatherC + (vec3(hash11(fi * 2.3), 0.0, hash11(fi * 4.9)) - 0.5) * vec3(14.0, 0.0, 4.0);
  vec3 pp = s + vec3(3.5 * x + 0.4 * sin(uTime * 1.3 + fi), 0.4 - 4.0 * x + 0.15 * sin(uTime * 2.1 + fi * 3.0), 2.0 * x + 0.3 * sin(uTime * 0.9 + fi));
  ang = vec3(uTime * (0.9 + hash11(fi)) + fi, sin(uTime * 1.7 + fi) * 0.9, uTime * 0.6 + fi * 2.0);
  return pp;
}
float feathersSD(vec3 p, float dmax) {
  float d = dmax;
  for (int i = 0; i < 10; i++) {
    vec3 a; vec3 c = featherPos(i, a);
    float b = length(p - c) - 0.12;
    if (b > d) continue;
    vec3 q = p - c;
    q.xy = rot(a.x) * q.xy; q.yz = rot(a.y) * q.yz; q.xz = rot(a.z) * q.xz;
    q.y += 0.25 * q.x * q.x;                    // the curl of the vane
    d = min(d, sdEllipsoid(q, vec3(0.075, 0.0025, 0.022)));
  }
  return d;
}

// ---------------- crawling things on the ramp ----------------
vec3 crawlPos(int i, out float head) {
  float fi = float(i);
  float L = length(vec2(RZ1 - RZ0, SILL));
  float s = 0.6 + mod(0.12 * uTime * (0.8 + 0.4 * hash11(fi)) + hash11(fi * 3.0) * 7.0, L - 0.6);     // metres up the ramp from the foot
  float x = DOORX + (hash11(fi * 5.0) - 0.5) * 3.6 + 0.3 * sin(s * 1.3 + fi);
  float z = RZ1 - s * (RZ1 - RZ0) / L;
  float y = s < 0.0 ? 0.02 : SILL * (1.0 - (z - RZ0) / (RZ1 - RZ0)) + 0.1;
  head = -PI * 0.5 + 0.3 * cos(s * 1.3 + fi);
  return vec3(x, y, z);
}
float crawlSD(vec3 p, float dmax) {
  float d = dmax;
  for (int i = 0; i < 10; i++) {
    float h; vec3 c = crawlPos(i, h);
    float b = length(p - c) - 0.5;
    if (b > d) continue;
    vec3 q = p - c; q.xz = rot(h) * q.xz;
    float e;
    if (i % 3 == 0) {          // a tortoise: a high shell, small head and feet
      float st = sin(uTime * 3.0 + float(i));
      e = sdEllipsoid(q - vec3(0.0, 0.07, 0.0), vec3(0.19, 0.11, 0.15));
      e = max(e, -q.y + 0.035);
      e = min(e, sdEllipsoid(q - vec3(0.0, 0.04, 0.0), vec3(0.2, 0.02, 0.16)));
      e = min(e, sdRoundCone(q, vec3(0.15, 0.05, 0.0), vec3(0.25 + 0.015 * st, 0.07, 0.0), 0.03, 0.028));
      vec3 lq = vec3(q.x, q.y, abs(q.z));
      e = min(e, sdCapsule(lq, vec3(0.1 + 0.02 * st, 0.04, 0.1), vec3(0.14 + 0.03 * st, 0.0, 0.15), 0.022));
      e = min(e, sdCapsule(lq, vec3(-0.1 - 0.02 * st, 0.04, 0.1), vec3(-0.14 - 0.03 * st, 0.0, 0.14), 0.022));
    } else {                   // a lizard: a long low body and tail in an S
      float w = sin(q.x * 9.0 + uTime * 6.0 + float(i)) * 0.03;
      e = sdCapsule(q - vec3(0.0, 0.02, w), vec3(-0.08, 0.0, 0.0), vec3(0.1, 0.0, 0.0), 0.028);
      e = min(e, sdRoundCone(q - vec3(0.0, 0.015, -w), vec3(-0.08, 0.0, 0.0), vec3(-0.32, 0.0, 0.0), 0.02, 0.003));
      e = min(e, sdRoundCone(q - vec3(0.13, 0.025, w), vec3(0.0), vec3(0.06, -0.005, 0.0), 0.022, 0.01));
      vec3 lq = vec3(q.x, q.y, abs(q.z - w));
      e = min(e, sdCapsule(lq, vec3(0.06, 0.015, 0.02), vec3(0.09, 0.0, 0.07), 0.008));
      e = min(e, sdCapsule(lq, vec3(-0.06, 0.015, 0.02), vec3(-0.1, 0.0, 0.07), 0.008));
    }
    d = min(d, e);
  }
  return d;
}

// ---------------- grass blades (close shots only) ----------------
float grassSD(vec3 p, float gy) {
  float hgt = p.y - gy;
  if (hgt > 0.32) return hgt - 0.3;
  const float C = 0.055;
  vec2 cell = floor(p.xz / C);
  float d = 1e9;
  for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++) {
    vec2 c = cell + vec2(i, j) - vec2(0.5) + step(0.5, fract(p.xz / C)) ;
    vec2 h = hash22(c);
    vec2 b = (c + h) * C;
    if (hash12(c * 3.1 + 7.0) < 0.35) continue;
    float tall = (0.06 + 0.24 * h.x * h.y) * (0.6 + 0.8 * vnoise(c * 0.15));
    vec2 wind = vec2(0.5, 0.25) * (0.35 + 0.25 * sin(uTime * 2.2 + b.x * 1.3 + b.y * 0.7)) * tall + (h - 0.5) * 0.08;
    vec3 a = vec3(b.x, gy - 0.01, b.y);
    vec3 m = a + vec3(wind * 0.35, tall * 0.55).xzy;
    vec3 tp = a + vec3(wind, tall).xzy;
    d = min(d, min(sdRoundCone(p, a, m, 0.0035, 0.0025), sdRoundCone(p, m, tp, 0.0025, 0.0008)));
  }
  return d;
}

// ---------------- the scene ----------------
// mats: 1 ground, 2 pitch, 3 cedar, 4 hay, 5 animal, 6 bird, 7 cedar tree, 8 feather, 9 crawler, 10 ramp, 11 grass, 12 water, 13 trunk
float gMud = 0.0;
float mapG(vec3 p, out float mat) {
  float gy = gH(p.xz);
  float d = (p.y - gy) * 0.85;
  mat = 1.0;
  if (uScrub > 0.5 && d < 2.5 && length(p - uCamPos) < 600.0 && length(p.xz * vec2(0.6, 1.0) - vec2(0.0, 6.0)) > 40.0) { float sc = scrubSD(p, gy); if (sc < d) { d = sc; mat = 7.0; } }
  if (uGrass > 0.5 && d < 0.4) {
    vec2 tr = tracks(p.xz);
    if (tr.y < 0.5 && length(p - uCamPos) < 12.0) { float g = grassSD(p, gy); if (g < d) { d = g; mat = 11.0; } }
  }
  // the ark (bounded)
  if (abs(p.x) < 80.0 && abs(p.z) < 26.0 && p.y < 16.0) {
    float m; float h = arkHull(p, m);
    if (h < d) { d = h; mat = m; }
    float r = rampSD(p);
    if (r < d) { d = r; mat = 10.0; }
  } else d = min(d, max(abs(p.x) - 78.0, max(abs(p.z) - 24.0, p.y - 15.0)) + 0.5);
  if (uTrees > 0.5 && p.y < 45.0) {
    for (int i = 0; i < NCED; i++) {
      if ((cedarMask & (1 << i)) == 0) continue;
      float part; vec3 lq; float c = cedarSD(p, i, part, lq);
      if (c < d) { d = c; mat = part > 2.5 ? 7.0 : 13.0; }
    }
  }
  if (uNA > 0.5) { float a = animalsSD(p, d); if (a < d) { d = a; mat = 5.0; } }
  if (uNB > 0.5) { float bk; float b = birdsSD(p, d, bk); if (b < d) { d = b; mat = 6.0 + 0.1 * bk; } }
  if (uFeathers > 0.5 && length(p - uFeatherC) < 14.0) { float f = feathersSD(p, d); if (f < d) { d = f; mat = 8.0; } }
  if (uCrawl > 0.5) { float c = crawlSD(p, d); if (c < d) { d = c; mat = 9.0; } }
  return d;
}
float mapD(vec3 p) { float m; return mapG(p, m); }
vec3 normG(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * max(0.0008, 0.0006 * t);
  return normalize(e.xyy * mapD(p + e.xyy) + e.yyx * mapD(p + e.yyx) + e.yxy * mapD(p + e.yxy) + e.xxx * mapD(p + e.xxx));
}
float marchG(vec3 ro, vec3 rd, float tmax, out float mat, int steps) {
  float t = 0.02; mat = 0.0;
  cedarMask = cedarRayMask(ro, rd) & ~int(uTreeOff);
  animMask = uNA > 0.5 ? animRayMask(ro, rd) : 0;
  for (int i = 0; i < 400; i++) {
    if (i >= steps) break;
    vec3 p = ro + rd * t;
    float m; float d = mapG(p, m);
    if (abs(d) < 0.0004 * t + 0.0005) { mat = m; cedarMask = 0x7fffffff; animMask = 0xffff; return t; }
    t += max(d, 0.0008 * t);
    mat = m;
    if (t > tmax) break;
    if (i == steps - 1 && d < 0.03 * t) { cedarMask = 0x7fffffff; animMask = 0xffff; return t; }      // ran out of steps grazing the ground: call it a hit
  }
  cedarMask = 0x7fffffff; animMask = 0xffff;
  return -1.0;
}
float mapS(vec3 p) {
  float d = (p.y - hMacro(p.xz) + 0.35) * 0.85;     // the ground itself never shades the door light (it is flat before the ark)
  if (abs(p.x) < 80.0 && abs(p.z) < 26.0 && p.y < 16.0) { float m; d = min(d, arkHull(p, m)); }   // (the ramp, lying under the sill, does not shade the door light)
  if (uNA > 0.5) d = min(d, animalsSD(p, d));
  if (uCrawl > 0.5) d = min(d, crawlSD(p, d));
  return d;
}
float softG(vec3 ro, vec3 rd, float tmax, float k) {
  float res = 1.0, t = 0.05;
  for (int i = 0; i < 36; i++) {
    float h = mapS(ro + rd * t);
    res = min(res, k * h / t);
    t += clamp(h, 0.06, 2.5);
    if (res < 0.01 || t > tmax) break;
  }
  return sat(res);
}
float aoG(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.06 * float(i * i); o += (h - mapD(p + n * h)) * s; s *= 0.6; }
  return sat(1.0 - 1.2 * o);
}

// the storm sky at night: heavy cloud driven by wind, a faint pale band low down, slow light deep in the bank
vec3 skyG(vec3 rd) {
  float y = rd.y;
  vec3 hor = vec3(0.036, 0.042, 0.048), zen = vec3(0.007, 0.008, 0.012);
  vec3 c = mix(hor, zen, pow(sat(y * 2.2 + 0.02), 0.6));
  if (y > -0.05) {
    float yy = max(y, 0.0) + 0.05;
    vec2 uv = rd.xz / yy;
    vec2 w = vec2(uTime * 0.05, uTime * 0.02);
    float n = fbm(uv * 0.32 + w, 6);
    float n2 = fbm(uv * 1.1 - w * 1.7 + n * 1.5, 5);
    float mass = smoothstep(0.32, 0.62, n);                         // the heavy cloud
    float belly = smoothstep(0.42, 0.75, n2) * (1.0 - 0.6 * mass);   // the lit undersides
    vec3 dark = vec3(0.006, 0.0065, 0.009);
    vec3 lit = vec3(0.04, 0.043, 0.056);
    vec3 cc = mix(lit * (0.5 + 0.8 * n2), dark, mass * 0.85);
    cc += vec3(0.022, 0.02, 0.03) * belly * smoothstep(0.5, 0.05, y);
    // slow light deep in the far storm wall (no flashes)
    float fl = uFlicker * pow(vnoise(vec2(uTime * 0.5, 2.0)), 3.0) * smoothstep(0.3, 0.02, y) * (0.4 + n2);
    cc += vec3(0.16, 0.17, 0.24) * fl * 0.3 * sat(1.0 - abs(atan(rd.x, -rd.z) - 0.6) * 0.8);
    c = mix(c, cc, smoothstep(-0.02, 0.06, y) * 0.92);
  }
  // the last violet light low in the west, under the storm's lid
  if (uDusk > 0.0) {
    float dd = sat(dot(normalize(rd.xz + 1e-5), normalize(uDuskDir.xz)));
    float band = exp(-max(y, 0.0) * 22.0) * (0.25 + 0.75 * pow(dd, 3.0));
    float brk = 0.6 + 0.6 * fbm(vec2(atan(rd.x, rd.z) * 6.0, y * 30.0) + vec2(uTime * 0.02, 0.0), 4);
    c += uDusk * vec3(0.16, 0.1, 0.2) * band * brk * smoothstep(-0.01, 0.01, y);
  }
  // far hills along the horizon
  float az = atan(rd.x, rd.z);
  float ridge = 0.008 + 0.014 * fbm(vec2(az * 4.0, 3.0), 4) + 0.004 * fbm(vec2(az * 30.0, 1.0), 3);
  c = mix(c, vec3(0.005, 0.0055, 0.007), smoothstep(ridge + 0.0015, ridge - 0.0015, y));
  c = mix(c, vec3(0.006, 0.0065, 0.008), smoothstep(0.0, -0.01, y));   // the far plain below the horizon
  return c;
}

// light: the door's gold, the window strip, the room lamps, the carried lamps and the night sky
float gPitch = 0.0;   // 1 while shading the glossy pitch: a broader sheen lobe on its lights
vec3 lightG(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float sss, float shadowOn) {
  float a = max(0.04, rough * rough), a2 = a * a;
  vec3 col = vec3(0);
  // cool sky ambient from above, a little bounce from the ground
  float ao = aoG(p, n);
  col += alb * (inRoomP(p) ? vec3(0.03, 0.02, 0.012) : mix(vec3(0.01, 0.011, 0.014), vec3(0.07, 0.08, 0.11), n.y * 0.5 + 0.5) + uDusk * vec3(0.025, 0.02, 0.035)) * ao;
  // the moon, low and cold, diffused through the cloud: a grazing key that shows the ground's relief
  {
    bool inR = inRoomP(p);
    if (!inR) {
      vec3 L = normalize(vec3(-0.75, uMoonY, 0.45));
      float nl = sat(dot(n, L)) * (1.0 - sss) + sss * 0.5;
      vec3 h = normalize(L + v); float nh = sat(dot(n, h)); float dd = nh * nh * (a2 - 1.0) + 1.0;
      col += uMoon * vec3(0.2, 0.225, 0.29) * nl * (alb / PI + 0.04 * a2 / (PI * dd * dd)) * (0.6 + 0.4 * ao);
      col += uMoon * vec3(0.2, 0.225, 0.29) * gPitch * 0.05 * pow(sat(dot(reflect(-L, n), v)), 10.0);
    }
  }
  // the last violet light low on the horizon: a grazing wash that the grass and the backs catch
  if (uDusk > 0.0 && !inRoomP(p)) {
    vec3 L = normalize(vec3(uDuskDir.x, 0.12, uDuskDir.z));
    float nl = sat(dot(n, L) * 0.8 + 0.2);
    vec3 h = normalize(L + v); float nh = sat(dot(n, h)); float dd = nh * nh * (a2 - 1.0) + 1.0;
    col += uDusk * vec3(0.16, 0.11, 0.2) * nl * (alb / PI + 0.04 * a2 / (PI * dd * dd)) * (0.5 + 0.5 * ao);
  }
  // the door: a big warm source that only reaches what the opening can see
  {
    vec3 L = DOORL - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    bool inRoom = inRoomP(p);
    float vis = 1.0;
    if (!inRoom) {
      // the light leaves through the opening: where does the line from the lamp to p cross the door plane?
      vis = 0.0;
      if (p.z > 11.35) {
        float tt = (11.3 - DOORL.z) / (p.z - DOORL.z);
        vec3 x = DOORL + (p - DOORL) * tt;
        vis = smoothstep(11.3, 11.95, p.z) * smoothstep(DW + 0.15, DW - 0.25, abs(x.x - DOORX)) * smoothstep(SILL - 0.15, SILL + 0.2, x.y) * smoothstep(SILL + DH + 0.15, SILL + DH - 0.2, x.y);
      }
      if (vis > 0.0 && shadowOn > 0.5) vis *= softG(p + n * 0.05, L, sqrt(d2) * (p.z - 11.6) / max(p.z - DOORL.z, 0.01), 6.0);   // only as far as the door
    }
    float nl = sat(dot(n, L)) * (1.0 - sss) + sss * (0.5 + 0.5 * dot(n, L));
    vec3 lc = GOLD * uDoorI * (inRoom ? 1.5 : 520.0) / (inRoom ? 1.0 + d2 : 14.0 + d2);
    vec3 h = normalize(L + v); float nh = sat(dot(n, h)); float dd = nh * nh * (a2 - 1.0) + 1.0;
    col += lc * vis * (alb * nl / PI + 0.04 * nl * a2 / (PI * dd * dd));
  }
  // the gold the door lays on the ramp and the trodden ground, thrown back up onto the hull and frame
  if (!inRoomP(p) && p.z < 13.0) {
    vec3 lp = vec3(DOORX, 0.5, RZ0 + 2.5);
    vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    float nl = sat(dot(n, L));
    vec3 h = normalize(L + v); float nh = sat(dot(n, h)); float dd = nh * nh * (a2 - 1.0) + 1.0;
    col += GOLD * uDoorI * 7.0 / (4.0 + d2) * nl * (alb / PI + 0.04 * a2 / (PI * dd * dd));
    col += GOLD * uDoorI * gPitch * 1.2 / (4.0 + d2) * pow(sat(dot(reflect(-L, n), v)), 6.0);
  }
  // the two wall lamps by the door: their light runs along the glossy strakes in long highlights
  for (int i = 0; i < 2; i++) {
    vec3 lp = wallLamp(i) + vec3(0.0, 0.1, 0.0);
    vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 8.0, float(i) * 7.0));
    float nl = sat(dot(n, L)) * (1.0 - sss) + sss * (0.5 + 0.5 * dot(n, L));
    vec3 h = normalize(L + v); float nh = sat(dot(n, h)); float dd = nh * nh * (a2 - 1.0) + 1.0;
    col += LAMPC * uDoorI * 3.5 * fl / (0.1 + d2) * nl * (alb / PI + 0.05 * a2 / (PI * dd * dd));
    col += LAMPC * uDoorI * fl * gPitch * 1.6 / (0.3 + d2) * pow(sat(dot(reflect(-L, n), v)), 14.0);
  }
  // the room lamps
  if (p.z < 11.6 && p.z > -10.5 && abs(p.x - DOORX) < 9.5) {
    for (int i = 0; i < 6; i++) {
      vec3 lp = roomLamp(i) + vec3(0.0, 0.08, 0.0);
      vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
      float wrap = sat(dot(n, L)) * (1.0 - sss) + sss * (0.5 + 0.5 * dot(n, L));
      col += alb * LAMPC * 2.6 * wrap / (0.8 + d2) * (0.85 + 0.15 * vnoise(vec2(uTime * 7.0, float(i) * 3.0)));
    }
  }
  // the window strip under the ridge: a long line of warm light, hidden by the roof below it
  {
    float sz = sign(p.z + 1e-4);
    vec3 wp = vec3(clamp(p.x, -66.0, 66.0), 13.15, 2.6 * sz);
    vec3 L = wp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    float above = smoothstep(-0.03, 0.03, (p.y - 13.15) + (abs(p.z) - 2.6) * 0.19);
    float facing = sat(dot(vec3(0.0, 0.0, sz), -L) * 1.5 + 0.1);
    col += alb * GOLD * 3.2 * sat(dot(n, L)) * above * facing / (1.0 + d2) * (abs(p.z) > 2.55 ? 1.0 : 0.0);
  }
  // carried lamps
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uNL) break;
    vec3 lp = vec3(uLmA[i * 4], uLmA[i * 4 + 1], uLmA[i * 4 + 2]);
    vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 8.0, float(i) * 5.0));
    vec3 lc = LAMPC * uLmA[i * 4 + 3] * 2.2 * fl / (0.05 + d2);
    vec3 h = normalize(L + v); float nh = sat(dot(n, h)); float dd = nh * nh * (a2 - 1.0) + 1.0;
    col += lc * sat(dot(n, L)) * (alb / PI + 0.04 * a2 / (PI * dd * dd));
  }
  return col;
}

// in-scattering in the damp air: the door's beam, the lamps' halos
vec3 inscatter(vec3 ro, vec3 rd, float T) {
  vec3 c = vec3(0);
  // haze lit by the door: integrate 1/d^2 along the ray, weighted to the beam in front of the door
  {
    vec3 oc = DOORL - ro; float tc = dot(oc, rd); float h = sqrt(max(dot(oc, oc) - tc * tc, 2.5));
    float g = (atan((T - tc) / h) + atan(tc / h)) / h;
    vec3 cp = ro + rd * clamp(tc, 0.0, T);
    float beam = smoothstep(10.5, 13.0, cp.z) * smoothstep(DW + 1.0 + (cp.z - 11.0) * 0.55, DW - 0.4 + (cp.z - 11.0) * 0.4, abs(cp.x - DOORX)) * smoothstep(DH + 3.0 + (cp.z - 11.0) * 0.3, DH, abs(cp.y - SILL - DH * 0.5) * 2.0);
    float inside = inRoomP(cp) ? 1.0 : 0.0;
    c += GOLD * uDoorI * g * (beam * 0.010 + inside * 0.006);
  }
  for (int i = 0; i < 2; i++) {
    vec3 lp = wallLamp(i) + vec3(0.0, 0.03, 0.0);
    vec3 oc = lp - ro; float tc = dot(oc, rd);
    if (tc > 0.0 && tc < T + 0.15) {
      vec3 q = ro + rd * tc - lp;
      float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 9.0, float(i) * 7.0));
      vec2 f = vec2(length(vec2(q.x, q.z)), q.y);
      float flame = exp(-pow(f.x / (0.02 * (1.0 - sat(f.y / 0.12)) + 0.003), 2.0)) * smoothstep(-0.01, 0.0, f.y) * smoothstep(0.13, 0.03, f.y);
      float hh = length(q);
      c += vec3(1.0, 0.7, 0.4) * uDoorI * (flame * 30.0 + 0.5 * exp(-hh / 0.08) + 0.06 * exp(-hh / 0.6)) * fl;
    }
  }
  if (uRoom > 0.5) for (int i = 0; i < 6; i++) {
    vec3 lp = roomLamp(i) + vec3(0.0, 0.05, 0.0);
    vec3 oc = lp - ro; float tc = dot(oc, rd);
    if (tc > 0.0 && tc < T + 0.15) {
      vec3 q = ro + rd * tc - lp;
      float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 9.0, float(i) * 4.0));
      vec2 f = vec2(length(vec2(q.x, q.z)), q.y);
      float flame = exp(-pow(f.x / (0.012 * (1.0 - sat(f.y / 0.07))+ 0.002), 2.0)) * smoothstep(-0.01, 0.0, f.y) * smoothstep(0.075, 0.02, f.y);
      float hh = length(q);
      c += vec3(1.0, 0.7, 0.4) * (flame * 30.0 + 0.4 * exp(-hh / 0.05) + 0.05 * exp(-hh / 0.35)) * fl;
    }
  }
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uNL) break;
    vec3 lp = vec3(uLmA[i * 4], uLmA[i * 4 + 1], uLmA[i * 4 + 2]);
    vec3 oc = lp - ro; float tc = dot(oc, rd); float h2 = max(dot(oc, oc) - tc * tc, 1e-5); float h = sqrt(h2);
    float g = (atan((T - tc) / h) + atan(tc / h)) / h;
    c += LAMPC * uLmA[i * 4 + 3] * g * 0.006;
    // the flame itself and the soft glow round it
    if (tc > 0.0 && tc < T + 0.1) {
      float dist = length(oc);
      float px = h / dist;               // angular distance
      c += vec3(1.0, 0.75, 0.45) * uLmA[i * 4 + 3] * (2.5 * exp(-px / 0.0016) + 0.12 * exp(-px / 0.012));
    }
  }
  return c;
}

vec3 gather(vec2 fc) {
  vec3 ro; vec3 rd0 = camRay(fc, ro);
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  vec3 rd = normalize(fp - ro);

  float mat; float t = marchG(ro, rd, 2500.0, mat, 220);
  vec3 col; float T = t > 0.0 ? t : 2500.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t, n = normG(p, t), v = -rd;
    vec3 alb = vec3(0.1); float rough = 0.6, sss = 0.0; vec3 emit = vec3(0); float spec = 0.0; float shadowOn = 1.0;
    float wet = 0.0; float pitchK = 0.0;
    if (mat < 1.5) {
      // trodden earth and grass; the tracks shape the normal
      vec2 tr = tracks(p.xz);
      float near = smoothstep(60.0, 20.0, t);
      if (near > 0.0 && uTracks > 0.0) {
        float e = 0.006;
        float h0 = tr.x;
        float hx = tracks(p.xz + vec2(e, 0.0)).x, hz = tracks(p.xz + vec2(0.0, e)).x;
        vec3 tn = normalize(vec3(-(hx - h0) / e, 1.0, -(hz - h0) / e));
        n = normalize(mix(n, normalize(n + vec3(tn.x, 0.0, tn.z)), near));
      }
      float mud = tr.y;
      if (t < 50.0) { vec3 a1 = vnoised(p.xz * 6.0), a2 = vnoised(p.xz * 17.0 + 3.0); vec2 gb = a1.yz * 6.0 * 0.0025 + a2.yz * 17.0 * 0.0018; n = normalize(n - vec3(gb.x, 0.0, gb.y) * smoothstep(50.0, 10.0, t)); }
      float g = fbm(p.xz * 3.0, 3);
      // dry trodden earth, dust in the prints; dry grass and herbs elsewhere
      vec3 mudC = vec3(0.12, 0.09, 0.065) * (0.6 + 0.6 * g) * (0.75 + 0.45 * vnoise(p.xz * 38.0)) * (0.85 + 0.3 * fbm(p.xz * 0.7, 3));
      mudC *= 1.0 - 22.0 * clamp(-tr.x, 0.0, 0.035);
      vec3 grassC = vec3(0.075, 0.07, 0.04) * (0.5 + 0.9 * fbm(p.xz * 6.0, 3)) * (0.7 + 0.5 * hash12(floor(p.xz * 40.0)));
      // pebbles and bits of straw
      vec2 pc = voronoiEdge(p.xz * 14.0);
      float peb = smoothstep(0.06, 0.16, pc.x) * step(0.9, pc.y) * smoothstep(12.0, 3.0, t) * 0.6;
      mudC = mix(mudC, vec3(0.11, 0.1, 0.085) * (0.6 + 0.6 * hash11(pc.y * 91.0)), peb);
      // bits of straw: short random strands
      vec2 sc = p.xz * 9.0; vec2 sid = floor(sc); vec2 sf = fract(sc) - 0.5; vec2 sh = hash22(sid + 4.0);
      vec2 sdir = vec2(cos(sh.x * 6.28), sin(sh.x * 6.28));
      float straw = step(0.8, sh.y) * smoothstep(0.012, 0.004, abs(dot(sf, vec2(-sdir.y, sdir.x)))) * step(abs(dot(sf, sdir)), 0.3) * smoothstep(12.0, 3.0, t);
      mudC = mix(mudC, vec3(0.3, 0.22, 0.1), straw * 0.6);
      alb = mix(grassC, mudC, mud);
      alb = mix(alb, vec3(0.05, 0.05, 0.035) * (0.45 + 0.9 * fbm(p.xz * 0.03, 4)) * (0.7 + 0.5 * fbm(p.xz * 0.4, 3)), smoothstep(60.0, 160.0, length(p.xz)));
      rough = 0.9;
      spec = 0.02;
      // the grass tips catch the low violet light at grazing angles
      emit += uDusk * vec3(0.012, 0.009, 0.016) * pow(1.0 - sat(dot(n, v)), 4.0) * (1.0 - mud * 0.6) * (0.6 + 0.8 * fbm(p.xz * 0.5, 3));
    } else if (mat < 2.5) {
      // glossy black pitch over cedar strakes laid edge over edge: each strake tilts out at its lower
      // edge, a dark lap line under it, staggered butt joints, brush strokes and runs in the coat, and
      // cedar showing through where it is worn (corners, the door's surround, the laps)
      float SH = 0.3;
      float row = floor(p.y / SH);
      float fy = fract(p.y / SH);
      float off = hash11(row * 3.1) * 6.0;
      float seg = floor((p.x + off) / 6.0);
      float fx = fract((p.x + off) / 6.0);
      float hv = hash12(vec2(row, seg));
      float lap = smoothstep(0.08, 0.0, fy);                      // the shadowed lap under the strake above
      float butt = smoothstep(0.004, 0.0, min(fx, 1.0 - fx) * 6.0 - 0.0);
      float brush = fbm(vec2(p.x * 2.2, p.y * 9.0) + row * 3.1, 4);
      float drip = smoothstep(0.78, 0.92, vnoise(vec2(p.x * 3.0, row * 1.7))) * smoothstep(0.1, 0.9, fy);
      float near = smoothstep(80.0, 15.0, t);
      // the strake's tilt and twist, and the brushed ridges in the pitch
      float side = sign(p.z + 1e-4);
      vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 1.0, 0.0);
      if (abs(n.z) > 0.5) {
        n = normalize(n - B * (0.16 + 0.05 * (hv - 0.5)) * near + B * lap * 0.6 * near + T * (brush - 0.5) * 0.08 * near + B * drip * 0.15 * near);
      }
      alb = vec3(0.014, 0.012, 0.01) * (0.85 + 0.3 * hv) * (1.0 - 0.7 * lap);
      rough = 0.09 + 0.12 * brush + 0.04 * hv - 0.05 * drip + 0.3 * lap + 0.2 * butt;
      // worn to the cedar
      float edgeW = smoothstep(1.2, 0.0, 67.5 - abs(p.x)) + smoothstep(0.5, 0.0, max(abs(p.x - DOORX) - DW - 0.4, abs(p.y - SILL - DH * 0.5) - DH * 0.5 - 0.4)) * step(0.0, p.z) + 0.35 * smoothstep(0.5, 0.0, fy);
      float wear = smoothstep(0.86, 0.9, fbm(p.xy * vec2(2.4, 7.0) + side * 7.0, 4) + 0.12 * edgeW) * near;
      if (wear > 0.0) {
        vec3 ced = vec3(0.3, 0.16, 0.07) * (0.55 + 0.6 * fbm(vec2(p.x * 0.8, p.y * 20.0), 4));
        alb = mix(alb, ced * 0.7, wear); rough = mix(rough, 0.7, wear);
      }
      spec = 1.0 - 0.8 * wear;
      pitchK = 1.0 - wear;
      // the inner face of the hull round the lit room is bare cedar planking, lamplit
      if (abs(p.z) < 11.12 && abs(p.x - DOORX) < 9.35 && p.y < SILL + 6.5 && p.y > SILL - 0.7) {
        float gr = fbm(vec2(p.x * 0.6, p.y * 9.0), 4);
        alb = vec3(0.25, 0.155, 0.085) * (0.6 + 0.55 * gr) * (1.0 - 0.55 * smoothstep(0.46, 0.5, abs(fract((p.y - SILL) / 0.24) - 0.5)));
        rough = 0.65; spec = 0.2; pitchK = 0.0;
      }
      // the window strip just below the ridge
      if (abs(p.z) > 2.55 && abs(p.z) < 2.66 && p.y > 12.75 && p.y < 13.35) {
        float mull = mix(1.0, smoothstep(0.03, 0.06, abs(fract(p.x / 1.5) - 0.5) * 1.5), smoothstep(80.0, 30.0, t)) * (0.75 + 0.25 * vnoise(vec2(p.x * 0.35, 1.0)));
        float fl = 0.9 + 0.1 * vnoise(vec2(p.x * 0.2, uTime * 3.0));
        emit = GOLD * 0.5 * mull * fl * smoothstep(12.75, 12.85, p.y) * smoothstep(13.35, 13.25, p.y);
        alb = mix(alb, vec3(0.4, 0.26, 0.13), 1.0 - mull);
      }
    } else if (mat < 3.5 || (mat > 9.5 && mat < 10.5)) {
      // honey cedar, adze marks and grain, smeared with pitch where it meets the hull
      float gr = fbm(vec2(p.x + p.z, p.y) * vec2(2.0, 22.0), 4);
      alb = vec3(0.3, 0.16, 0.07) * (0.55 + 0.6 * gr);
      float smear = smoothstep(0.45, 0.7, fbm(p.xy * vec2(0.6, 1.4) + p.z * 0.3, 4));
      // corner posts and the top rail are pitched over, the cedar showing where they are worn
      if (abs(p.z) > 11.0 && (abs(p.x - DOORX) > DW + 0.45 && p.x < DOORX + DW + 0.3 || p.x > DOORX + 2.0 * DW + 2.9 || p.z < 0.0)) alb = mix(alb, vec3(0.014, 0.012, 0.01), smoothstep(0.35, 0.6, smear + 0.25));
      if (p.z > 11.4 && p.x > DOORX + DW + 0.3 && p.x < DOORX + 2.0 * DW + 2.9) {    // the door leaf's inner face: vertical boards
        float bd = smoothstep(0.46, 0.5, abs(fract(p.x / 0.32) - 0.5));
        alb = vec3(0.26, 0.14, 0.065) * (0.55 + 0.6 * fbm(vec2(p.x * 20.0, p.y * 1.2), 4)) * (1.0 - 0.6 * bd);
      } else if (p.z > 11.2 && abs(p.x - DOORX) < DW + 0.45) {   // the frame: heavy squared cedar, adze-faced
        alb = vec3(0.32, 0.17, 0.075) * (0.55 + 0.6 * fbm(abs(p.x - DOORX) > DW + 0.01 ? vec2(p.y * 1.2, p.x * 18.0) : vec2(p.x * 1.2, p.y * 18.0), 4)) * (0.85 + 0.3 * vnoise(p.xy * 3.0));
      }
      if (mat > 9.5) {
        // planks laid across the ramp, worn pale where feet have passed
        float u = (p.z - RZ0) * 1.0;
        float pk = floor(u / 0.27);
        alb = vec3(0.26, 0.15, 0.07) * (0.55 + 0.6 * fbm(vec2(p.x * 1.2 + pk * 7.0, u * 30.0), 4)) * (0.8 + 0.4 * hash11(pk));
        float seam = smoothstep(0.47, 0.5, abs(fract(u / 0.27) - 0.5));
        alb *= 1.0 - 0.7 * seam;
        alb = mix(alb, vec3(0.2, 0.15, 0.1), 0.35 * smoothstep(1.6, 0.3, abs(p.x - DOORX)) * fbm(p.xz * 4.0, 3));
      }
      if (inRoomP(p) || p.z < 11.0) {
        alb = vec3(0.25, 0.155, 0.085) * (0.6 + 0.55 * gr) * (0.85 + 0.3 * vnoise(p.xy * 2.0 + p.z));
        if (abs(n.z) > 0.7) alb *= 1.0 - 0.55 * smoothstep(0.46, 0.5, abs(fract((p.y - SILL) / 0.24) - 0.5));
        if (abs(n.y) > 0.7) alb *= 1.0 - 0.5 * smoothstep(0.46, 0.5, abs(fract(p.x / 0.3) - 0.5));
      }
      rough = 0.65;
      spec = 0.25;
      // dusty trails of the crawling things on the ramp
      if (mat > 9.5 && uCrawl > 0.5) {
        float tr = 0.0;
        for (int i = 0; i < 7; i++) { float fi = float(i); float x0 = DOORX + (hash11(fi * 5.0) - 0.5) * 3.6; float L = length(vec2(RZ1 - RZ0, SILL)); float s = (RZ1 - p.z) * L / (RZ1 - RZ0); tr = max(tr, smoothstep(0.035, 0.0, abs(p.x - x0 - 0.3 * sin(s * 1.3 + fi)))); }
        alb *= 1.0 + 0.5 * tr;
      }
    } else if (mat < 4.5) {
      float st = hayTex(p.xz + p.y * 0.7); alb = mix(vec3(0.05, 0.035, 0.02), vec3(0.3, 0.22, 0.11) * (0.7 + 0.5 * vnoise(p.xz * 3.0)), st);
      rough = 0.8; sss = 0.3; shadowOn = 0.0;
    } else if (mat < 5.5) {
      alb = vec3(0.012, 0.011, 0.01); rough = 0.85; spec = 0.05;
    } else if (mat < 6.5) {
      float bk = (mat - 6.0) * 10.0;
      alb = bk < 0.5 ? vec3(0.28, 0.27, 0.26) : bk < 1.5 ? vec3(0.008) : bk < 2.5 ? vec3(0.04, 0.035, 0.03) : vec3(0.5, 0.48, 0.45);
      rough = 0.45; spec = 0.6; sss = 0.15;
    } else if (mat < 7.5) {
      alb = vec3(0.012, 0.018, 0.012) * (0.5 + 0.8 * fbm(p * 2.0, 3)); rough = 0.9; sss = 0.25; shadowOn = 0.0; spec = 0.0;
    } else if (mat < 8.5) {
      alb = vec3(0.6, 0.58, 0.55); rough = 0.4; sss = 0.6; spec = 0.4; shadowOn = 0.0;
    } else if (mat < 9.5) {
      alb = vec3(0.03, 0.025, 0.018); rough = 0.75; spec = 0.08;
    } else if (mat < 11.5) {
      alb = mix(vec3(0.05, 0.06, 0.025), vec3(0.11, 0.09, 0.045), hash12(floor(p.xz * 18.0))) * 0.8; rough = 0.7; sss = 0.3; spec = 0.05; shadowOn = 0.0;
    } else if (mat < 12.5) {
      alb = vec3(0.02, 0.018, 0.015); rough = 0.03; spec = 1.0;
    } else if (mat < 13.5) {
      alb = vec3(0.045, 0.038, 0.032) * (0.6 + 0.8 * fbm(vec2(p.x + p.z, p.y * 6.0), 3)); rough = 0.85; spec = 0.0;
    } else if (mat < 14.5) {
      alb = vec3(0.35, 0.18, 0.09); rough = 0.7; emit = vec3(1.0, 0.5, 0.2) * 0.5 * step(p.y, SILL + 3.56);
    } else {
      alb = vec3(0.1, 0.07, 0.045); rough = 0.35; spec = 0.5;       // bronze straps and pins of the hinges
    }
    if (t > 120.0) shadowOn = 0.0;
    gPitch = pitchK;
    col = emit + lightG(p, n, v, alb, rough, sss, shadowOn) * (mat > 4.5 && mat < 5.5 ? 0.012 : 1.0);
    if (mat > 4.5 && mat < 5.5) {
      // the silhouettes keep their dark, but their edges catch the light behind them: the door's gold
      // and the low sky (fur makes it soft)
      float edge = pow(1.0 - sat(abs(dot(n, v))), 2.5);
      vec3 Ld = DOORL - p; float d2 = dot(Ld, Ld); Ld *= inversesqrt(d2);
      float vis = 0.0;
      if (p.z > 11.35) { float tt = (11.3 - DOORL.z) / (p.z - DOORL.z); vec3 x = DOORL + (p - DOORL) * tt; vis = smoothstep(DW + 0.6, DW - 0.4, abs(x.x - DOORX)) * smoothstep(SILL - 0.6, SILL + 0.3, x.y) * smoothstep(SILL + DH + 0.6, SILL + DH - 0.3, x.y); }
      else if (inRoomP(p)) vis = 0.25;
      col += GOLD * uDoorI * 260.0 / (14.0 + d2) * vis * edge * edge * edge * sat(dot(n, Ld) + 0.1) * 0.012;
      vec3 Ls = normalize(vec3(uDuskDir.x, 0.25, uDuskDir.z));
      col += (vec3(0.05, 0.055, 0.075) + uDusk * vec3(0.1, 0.07, 0.13)) * uRimSky * edge * sat(dot(n, Ls) + 0.2 + 0.5 * n.y);
    }
    // reflections: the sky, the door, the window strip, the lamps (glossy pitch, wet mud, water)
    if (spec > 0.0) {
      vec3 rr = reflect(rd, n);
      float fr = 0.03 + 0.97 * pow(1.0 - sat(dot(n, v)), 5.0);
      vec3 refl;
      if (wet > 0.3 || (mat > 11.5 && mat < 12.5)) {
        float m2; float t2 = marchG(p + n * 0.02, rr, 300.0, m2, 70);
        vec3 q2 = p + rr * max(t2, 0.0);
        refl = t2 > 0.0 ? (m2 > 1.5 && m2 < 2.5 && abs(q2.z) > 2.5 && q2.y > 12.7 ? GOLD * 2.0 : (m2 > 3.5 && m2 < 4.5) || q2.z < 11.0 ? GOLD * 0.6 : lightG(q2, normG(q2, t2), -rr, vec3(0.05), 0.6, 0.0, 0.0)) : skyG(rr);
        refl += inscatter(p, rr, t2 > 0.0 ? t2 : 300.0);
        fr = mix(fr, 0.6, wet);
      } else {
        // the overcast, the last light low in the sky, and (looking down) the gold the door lays on the
        // ramp and the ground before it: long highlights running along the strakes
        float g = 1.0 - rough;
        vec3 sk = mix(vec3(0.03, 0.033, 0.042), skyG(rr) * 1.4, g * g);
        if (rr.y < -0.02) {
          vec3 hit = p + rr * (-(p.y - 0.4) / rr.y);
          vec2 dq = (hit.xz - vec2(DOORX, (RZ0 + RZ1) * 0.5)) / vec2(DW + 0.8, (RZ1 - RZ0) * 0.7);
          float lit = exp(-dot(dq, dq) * 1.2) * smoothstep(-0.02, -0.15, rr.y);
          sk = mix(sk, vec3(0.012, 0.011, 0.01), smoothstep(-0.02, -0.2, rr.y)) + GOLD * uDoorI * 0.9 * lit;
        }
        if (uDusk > 0.0) sk += uDusk * vec3(0.2, 0.12, 0.25) * pow(sat(dot(normalize(rr.xz + 1e-5), normalize(uDuskDir.xz))), 6.0) * exp(-abs(rr.y) * 14.0) * g;
        refl = sk * mix(0.25, 1.0, g) + inscatter(p, rr, 60.0) * g;
      }
      col += refl * mix(fr, 0.04 + 0.96 * pow(1.0 - sat(dot(n, v)), 5.0), pitchK) * spec;
    }
    // atmospheric haze
    float fog = (1.0 - exp(-t * 0.0012)) * 0.6;
    col = mix(col, vec3(0.007, 0.0075, 0.009) * (0.7 + 0.6 * fbm(p.xz * 0.004, 3)), fog);
  } else {
    col = skyG(rd);
  }
  col += inscatter(ro, rd, min(T, 400.0));
  // a faint drizzle: fine streaks catching the gold where they cross the light
  if (uDrizzle > 0.0) {
    vec2 sp = fc / uRes.y;
    for (int l = 0; l < 3; l++) {
      float fl = float(l);
      vec2 q = sp * vec2(90.0 + 40.0 * fl, 3.0 + fl) + vec2(0.0, uTime * (7.0 + 2.0 * fl)) + vec2(sp.y * 8.0, 0.0);
      vec2 id = floor(q); vec2 f = fract(q);
      float hsh = hash12(id + fl * 17.0);
      float s = step(0.86, hsh) * smoothstep(0.12, 0.0, abs(f.x - 0.5)) * smoothstep(0.0, 0.3, f.y) * smoothstep(1.0, 0.6, f.y);
      col += s * uDrizzle * (vec3(0.02) + 0.5 * inscatter(ro, rd, 30.0)) * (0.5 - 0.15 * fl);
    }
  }
  return col * uExpo;
}
`;
