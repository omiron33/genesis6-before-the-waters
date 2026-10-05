// Noe's grove: a low hill apart from the mountain and the valley, crowned with tall straight cedars
// (furrowed red-grey bark, tiered sprays of dark blue-green), a small stone house with a lamp burning
// inside its door, a well with a timber frame, an old olive tree, a small stone altar, three young
// cedars at the grove's edge with a clay lamp at each foot, a felled cedar's stump and its log, tools
// leaned by the door and a plumb line hung against the great cedar. Above, the storm cloud
// (lib/x-grove-sky.js), which parts to let the gold of grace fall on the grove.
// Units metres, y up; the house stands at the origin on the hilltop, its door facing +z.
// Every frame is a pure function of uTime and the scene's uniforms.
import { SKY_GLSL, SKY_UNIFORMS } from './x-grove-sky.js';
import { growCedars, cedarGLSL } from './x-cedar.js';

// ground height of the smooth hill (the shader adds a little detail on top)
export const gh = (x, z) => 12.0 * Math.exp(-(x * x + z * z) / 4608);
const at = (x, z, dy = 0) => [x, gh(x, z) + dy, z];

// the cedars: x, z, height, base radius, crown base, crown radius
const CEDARS = [
  [-8.5, -4.5, 30, 0.8, 12.5, 6.4],   // 0: the great cedar of the plumb line
  [-3.5, -11, 25, 0.7, 8.0, 5.8],
  [4.0, -9.5, 28, 0.75, 7.0, 6.3],
  [10.5, -4.0, 24, 0.65, 6.5, 5.4],
  [13.5, 4.0, 26, 0.7, 7.0, 5.8],
  [-14.5, 1.0, 25, 0.7, 6.0, 5.8],
  [-16.0, -11.5, 29, 0.85, 8.0, 6.8],
  [11.0, -15.5, 27, 0.75, 7.0, 6.3],
  [-2.0, -20.5, 30, 0.85, 9.0, 7.0],
  [19.5, -8.0, 23, 0.6, 6.0, 5.2],
  [-21.5, 9.0, 24, 0.65, 6.0, 5.4],
  [21.0, 9.5, 25, 0.7, 6.5, 5.6],
  [-12.5, 21.0, 22, 0.6, 5.5, 5.0],
  [6.5, -25.5, 26, 0.75, 7.0, 6.0],
  [-25.0, -3.0, 26, 0.75, 7.0, 6.0],
  [-6.0, -27.0, 25, 0.7, 7.0, 5.8],
  [24.5, -1.5, 22, 0.6, 5.5, 5.0],
  // the three young cedars at the grove's edge (Shem, Ham, Japheth)
  [11.6, 18.6, 3.6, 0.08, 0.45, 0.85],
  [14.2, 17.4, 4.0, 0.09, 0.45, 0.95],
  [16.7, 16.0, 3.3, 0.08, 0.4, 0.8],
];
export const N_CEDARS = CEDARS.length;
export const YOUNG = [17, 18, 19];
export const CEDAR_AT = CEDARS.map((c) => at(c[0], c[1]));
export const CEDAR = CEDARS;
// grown as cedars of Lebanon (lib/x-cedar.js): tree 0, the great cedar of the plumb line, stands straight
export const TREES = growCedars(CEDARS.map((c, i) => ({ base: CEDAR_AT[i], h: c[2], r0: c[3], spread: c[3] > 0.3 ? c[5] * 1.35 : c[5], seed: i * 13 + 5, young: c[3] < 0.3, straight: i === 0 })));

export const HOUSE = at(0, 0, -0.05);
export const WELL = at(5.8, 5.4, -0.05);
export const OLIVE = at(-7.6, 6.2, -0.1);
export const ALTAR = at(-4.5, 15.5, -0.05);
export const STUMP = at(-11.0, 11.0, -0.05);
// the felled log lies beside its stump
export const LOG0 = [STUMP[0] - 0.9, STUMP[1] + 0.48, STUMP[2] + 1.3];
export const LOG1 = [STUMP[0] - 3.2, gh(STUMP[0] - 3.2, STUMP[2] + 7.6) + 0.45, STUMP[2] + 7.6];
// the house lamp: set on the threshold stone in the doorway
export const LAMP_H = [HOUSE[0] + 0.82, HOUSE[1] + 0.06, HOUSE[2] + 2.42];
// the lamps at the feet of the young cedars (on their +z side, toward the camera)
export const LAMP_S = YOUNG.map((i) => { const c = CEDARS[i]; return at(c[0] + 0.55, c[1] + 0.95, 0.06); });
// the plumb line on the great cedar: hung from a peg, facing the house
const PD = (() => { const v = [0.87, 0.5]; const l = Math.hypot(...v); return [v[0] / l, v[1] / l]; })();
export const PLUMB_TOP = [CEDARS[0][0] + PD[0] * 1.3, gh(CEDARS[0][0], CEDARS[0][1]) + 5.5, CEDARS[0][1] + PD[1] * 1.3];
export const PLUMB_BOB = [PLUMB_TOP[0], gh(CEDARS[0][0], CEDARS[0][1]) + 0.95, PLUMB_TOP[2]];
export const PLUMB_DIR = PD;

const v3 = (a) => `vec3(${a.map((x) => x.toFixed(4)).join(', ')})`;
const v4 = (a) => `vec4(${a.map((x) => x.toFixed(4)).join(', ')})`;

export const GROVE_UNIFORMS = {
  ...SKY_UNIFORMS,
  uFocus: 10.0, uAper: 0.0,
  uLampH: 1.0, uLampS: [0, 0, 0], uLampF: [0, -100, 0], uLampFk: 0.0,
  uCoal: 0.0, uSmoke: 0.0, uBend: 0.0,
  uHaze: 0.004, uFogCol: [0.05, 0.05, 0.07], uRays: 0.0, uGate: 0.0,
  uDust: 0.0, uKeyK: 1.0, uRayMax: 700.0, uGrassH: 0.16, uGrassD: 22.0, uFlashL: [0, 0, 0], uShadowR: 1000.0,
};

export const GROVE_GLSL = SKY_GLSL + /* glsl */ `
uniform float uRayMax, uGrassH, uGrassD, uShadowR, uFocus, uAper, uLampH, uLampFk, uCoal, uSmoke, uBend, uHaze, uRays, uGate, uDust, uKeyK;
uniform vec3 uLampS, uLampF, uFogCol, uFlashL;

bool gLite = false;   // skip surface detail (shadow rays)
${cedarGLSL(TREES)}
#define NT NCED
#define TA CED_A
const vec3 HOUSE = ${v3(HOUSE)};
const vec3 WELL = ${v3(WELL)};
const vec3 OLIVE = ${v3(OLIVE)};
const vec3 ALTAR = ${v3(ALTAR)};
const vec3 STUMP = ${v3(STUMP)};
const vec3 LOG0 = ${v3(LOG0)};
const vec3 LOG1 = ${v3(LOG1)};
const vec3 LAMPH = ${v3(LAMP_H)};
const vec3 LS0 = ${v3(LAMP_S[0])};
const vec3 LS1 = ${v3(LAMP_S[1])};
const vec3 LS2 = ${v3(LAMP_S[2])};
const vec3 PTOP = ${v3(PLUMB_TOP)};
const vec3 PBOB = ${v3(PLUMB_BOB)};
const vec2 PDIR = vec2(${PD[0].toFixed(4)}, ${PD[1].toFixed(4)});

// ------------------------------------------------------------------ ground
float hillH(vec2 x) {
  float r = length(x);
  float h = 12.0 * exp(-dot(x, x) / 4608.0);
  if (r > 90.0) h += (fbm(x * 0.006 + 3.0, 4) - 0.5) * 8.0 * smoothstep(90.0, 400.0, r);
  h -= 4.0 * smoothstep(90.0, 300.0, r);
  return h;
}
// boulders and outcrops on the hill's flanks (one per 7 m cell at most, clear of the yard)
float rockH(vec2 x) {
  float rr = length(x);
  if (rr < 14.0 || rr > 90.0) return 0.0;
  vec2 c = floor(x / 7.0);
  if (hash12(c * 1.31 + 0.7) < 0.55) return 0.0;
  vec2 o = (c + 0.25 + 0.5 * hash22(c)) * 7.0;
  float r = 0.5 + 1.3 * hash12(c + 3.1);
  vec2 dv = (x - o) * vec2(1.0, 1.0 + 0.6 * hash12(c + 9.0));
  float d2 = dot(dv, dv) / (r * r);
  if (d2 >= 1.0) return 0.0;
  return r * 0.6 * pow(1.0 - d2, 0.4) * (0.85 + 0.3 * vnoise(x * 1.1 + c)) - 0.1;
}
float groundH(vec2 x) {
  float h = hillH(x);
  h += max(rockH(x), 0.0);
  float near = smoothstep(260.0, 60.0, length(x - uCamPos.xz));
  if (near > 0.0) h += ((fbm(x * 0.21, 2) - 0.5) * 0.3 + (vnoise(x * 1.7) - 0.5) * 0.03) * near;
  return h;
}

float barkD(vec3 q, float r, float seed) { return 0.6 - barkPat(q, r, seed).x; }

// ------------------------------------------------------------------ the world
int gMask = 0x7fffffff;   // which cedars the current ray can meet (march only)
float gId;   // material of the nearest surface (set by map)
int gTi;     // which cedar
vec3 gQ;     // local point (cedar / stump / log)

float sdCylY(vec3 p, float r, float h0, float h1) {
  vec2 w = vec2(length(p.xz) - r, abs(p.y - (h0 + h1) * 0.5) - (h1 - h0) * 0.5);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
}

// a small clay oil lamp sitting at b (its flame stands at b + (0, 0.06, 0.08))
float lampSD(vec3 p, vec3 b) {
  vec3 q = p - b;
  float d = sdEllipsoid(q - vec3(0.0, 0.03, 0.0), vec3(0.075, 0.035, 0.065));
  d = min(d, sdCapsule(q, vec3(0.0, 0.035, 0.03), vec3(0.0, 0.045, 0.085), 0.016));
  d = max(d, -(length(q.xz - vec2(0.0, -0.01)) - 0.025));
  return d;
}
vec3 lampFlamePos(vec3 b) { return b + vec3(0.0, 0.055, 0.086); }

float houseSD(vec3 p, out float id) {
  vec3 q = p - HOUSE; q.y -= 1.45;
  id = 4.0;
  float outer = sdBox(q, vec3(3.0, 1.75, 2.3));
  float inner = sdBox(q - vec3(0.0, 0.1, 0.0), vec3(2.55, 1.8, 1.85));
  float w = max(outer, -inner);
  w = max(w, -sdBox(q - vec3(0.6, -1.45 + 0.95, 2.3), vec3(0.48, 0.95, 0.7)));
  w = max(w, -sdBox(q - vec3(-1.6, 0.3, 2.3), vec3(0.27, 0.24, 0.7)));
  w = max(w, q.y - 1.3);
  float cd = length(p - uCamPos);
  if (w < 0.1 && cd < 25.0 && !gLite) {
    // rough-laid stone: courses and joints pressed in
    vec2 uv = abs(q.z) > 2.2 || abs(q.z) < 1.9 ? q.xy : q.zy;
    if (abs(q.x) > 2.9) uv = q.zy;
    vec2 v = voronoiEdge(uv * vec2(4.2, 7.5) + vec2(0.0, 0.3 * sin(uv.x * 2.0)));
    w += (0.012 * (1.0 - smoothstep(0.0, 0.05, v.x)) - 0.01 * smoothstep(0.0, 0.25, v.x) * (fbm(uv * 14.0, 2) + 0.6 * dot(hash22(vec2(v.y * 37.0, 1.0)) - 0.5, uv - floor(uv * 4.0) / 4.0) * 8.0)) * smoothstep(25.0, 6.0, cd);
  }
  float d = w;
  // the roof: timber slab with an earth top, a low parapet
  float roof = sdBox(q - vec3(0.0, 1.45, 0.0), vec3(3.12, 0.16, 2.42));
  float par = max(sdBox(q - vec3(0.0, 1.72, 0.0), vec3(3.12, 0.14, 2.42)), -sdBox(q - vec3(0.0, 1.8, 0.0), vec3(2.9, 0.2, 2.2)));
  float r = min(roof, par);
  if (r < d) { d = r; id = 5.0; }
  // beam ends under the roof edge, a lintel over the door
  vec3 bq = q - vec3(0.0, 1.22, 2.36); bq.x = mod(bq.x + 0.35, 0.7) - 0.35;
  float be = max(sdBox(bq, vec3(0.07, 0.07, 0.14)), abs(q.x) - 2.9);
  be = min(be, sdBox(q - vec3(0.6, -1.45 + 1.96, 2.25), vec3(0.66, 0.09, 0.14)));
  // the stool inside and the threshold stone
  if (be < d) { d = be; id = 8.0; }
  float th = sdBox(q - vec3(0.6, -1.45, 2.45), vec3(0.6, 0.06, 0.3));
  if (th < d) { d = th; id = 4.0; }
  // tools leaned by the door: an axe and a long adze
  vec3 tb = HOUSE + vec3(1.85, 0.0, 2.62);
  float hd = min(sdCapsule(p, tb, tb + vec3(0.1, 0.92, -0.3), 0.02), sdCapsule(p, tb + vec3(0.32, 0.0, 0.02), tb + vec3(0.47, 1.22, -0.31), 0.02));
  if (hd < d) { d = hd; id = 8.0; }
  float ir = min(sdBox(p - (tb + vec3(0.12, 0.92, -0.26)), vec3(0.025, 0.06, 0.1)), sdBox(p - (tb + vec3(0.47, 1.2, -0.24)), vec3(0.13, 0.03, 0.03)));
  if (ir < d) { d = ir; id = 18.0; }
  return d;
}

float wellSD(vec3 p, out float id) {
  vec3 q = p - WELL;
  id = 7.0;
  float r = length(q.xz);
  vec2 w = vec2(max(r - 0.95, 0.62 - r), abs(q.y + 0.1) - 0.9);
  float d = min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
  if (d < 0.08 && length(p - uCamPos) < 25.0 && !gLite) {
    float a = atan(q.z, q.x);
    vec2 v = voronoiEdge(vec2(a * 2.4, q.y * 4.0));
    d += 0.02 * (1.0 - smoothstep(0.0, 0.12, v.x));
  }
  float wat = max(q.y + 0.7, r - 0.64);
  if (wat < d) { d = wat; id = 17.0; }
  float fr = min(sdCapsule(q, vec3(-1.05, -0.2, 0.0), vec3(-1.05, 2.05, 0.0), 0.07), sdCapsule(q, vec3(1.05, -0.2, 0.0), vec3(1.05, 2.05, 0.0), 0.07));
  fr = min(fr, sdCapsule(q, vec3(-1.2, 1.95, 0.0), vec3(1.2, 1.95, 0.0), 0.075));
  float bucket = sdCylY(q - vec3(0.15, 0.0, 0.0), 0.15, 0.85, 1.07);
  fr = min(fr, bucket);
  if (fr < d) { d = fr; id = 8.0; }
  float rope = sdCapsule(q, vec3(0.15, 1.9, 0.0), vec3(0.15, 1.07, 0.0), 0.012);
  if (rope < d) { d = rope; id = 14.0; }
  return d;
}

float oliveSD(vec3 p, out float id) {
  vec3 q = p - OLIVE;
  id = 9.0;
  float tw = sin(q.y * 2.2) * 0.12;
  vec3 qt = q + vec3(tw, 0.0, -tw);
  float d = sdCapsule(qt, vec3(0.0, -0.4, 0.0), vec3(0.35, 1.3, 0.2), 0.42);
  d = smin(d, sdCapsule(qt, vec3(0.35, 1.3, 0.2), vec3(-0.15, 2.3, 0.1), 0.3), 0.3);
  d = smin(d, sdCapsule(q, vec3(-0.15, 2.3, 0.1), vec3(-1.7, 3.3, 0.7), 0.16), 0.2);
  d = smin(d, sdCapsule(q, vec3(-0.15, 2.3, 0.1), vec3(1.4, 3.5, -0.5), 0.15), 0.2);
  d = smin(d, sdCapsule(q, vec3(0.1, 2.1, 0.1), vec3(0.3, 3.8, 1.3), 0.13), 0.2);
  d = smin(d, sdCapsule(q, vec3(0.2, 1.5, 0.2), vec3(1.0, 2.6, 1.0), 0.12), 0.15);
  if (d < 0.2 && !gLite) d += (fbm(q * 3.2, 3) - 0.5) * 0.13;
  float c = sdEllipsoid(q - vec3(-1.6, 3.9, 0.7), vec3(1.8, 1.05, 1.6));
  c = smin(c, sdEllipsoid(q - vec3(1.4, 4.0, -0.4), vec3(1.7, 1.0, 1.5)), 0.6);
  c = smin(c, sdEllipsoid(q - vec3(0.3, 4.3, 1.2), vec3(1.5, 1.0, 1.4)), 0.6);
  c = smin(c, sdEllipsoid(q - vec3(0.0, 4.7, -0.1), vec3(1.8, 1.1, 1.7)), 0.6);
  c = smin(c, sdEllipsoid(q - vec3(0.9, 3.1, 1.3), vec3(1.0, 0.7, 0.9)), 0.5);
  if (c < 1.0) c += (gLite ? 0.0 : (fbm(q * 2.2 + 4.0, 3) - 0.5) * 0.9) + 0.12;
  c *= 0.65;
  if (c < d) { d = c; id = 10.0; }
  return d;
}

float altarSD(vec3 p, out float id) {
  vec3 q = p - ALTAR;
  id = 11.0;
  float d = sdBox(q - vec3(0.0, 0.42, 0.0), vec3(0.6, 0.4, 0.5)) - 0.06;
  if (d < 0.15 && !gLite) d += 0.05 * (fbm(q * 2.5, 2) - 0.5);
  if (d < 0.12 && length(p - uCamPos) < 25.0 && !gLite) {
    vec2 uv = abs(q.x) > 0.58 ? q.zy : q.xy;
    if (q.y > 0.84) uv = q.xz;
    vec2 v = voronoiEdge(uv * vec2(4.0, 6.0) + vec2(0.0, 0.4 * sin(uv.x * 3.0)));
    d += 0.01 * (1.0 - smoothstep(0.0, 0.06, v.x)) - 0.008 * smoothstep(0.0, 0.3, v.x) + 0.02 * (fbm(q * 7.0, 3) - 0.5);
  }
  float coal = sdEllipsoid(q - vec3(0.0, 0.86, 0.0), vec3(0.42, 0.08, 0.34));
  if (coal < 0.1) coal += (vnoise(q.xz * 26.0) - 0.5) * 0.04;
  if (coal < d) { d = coal; id = 12.0; }
  return d;
}

// the felled cedar: its stump (cut top) and the log beside it
float stumpSD(vec3 p, out float id) {
  vec3 q = p - STUMP;
  id = 2.0;
  float yy = max(q.y, 0.0);
  float rr = 0.62 + 0.3 * exp(-yy * 5.0);
  float top = 0.55 + 0.04 * q.x;
  float r = length(q.xz);
  float d = r - rr;
  float cd = length(p - uCamPos);
  if (d < 0.1 && cd < 20.0 && !gLite) d += 0.035 * barkD(q, rr, 3.0) * smoothstep(20.0, 4.0, cd);
  d = max(d, q.y - top);
  if (q.y > top - 0.02 && r < 0.6) { id = 13.0; }
  gQ = q;
  // the log, cut square at both ends
  vec3 ax = normalize(LOG1 - LOG0);
  vec3 lq = p - LOG0;
  float s = dot(lq, ax);
  vec3 rad = lq - ax * s;
  float lr = 0.56 - 0.012 * s;
  float dl = length(rad) - lr;
  if (dl < 0.1 && cd < 20.0 && !gLite) { vec3 bq = vec3(rad.x, s, rad.z); dl += 0.035 * barkD(vec3(dot(rad, normalize(cross(ax, vec3(0, 1, 0)))), s, rad.y), lr, 5.0) * smoothstep(20.0, 4.0, cd); }
  float lenL = length(LOG1 - LOG0);
  dl = max(dl, max(-s, s - lenL));
  if (dl < d) {
    d = dl; id = s < 0.02 ? 13.0 : 2.0;
    gQ = vec3(dot(rad, normalize(cross(ax, vec3(0, 1, 0)))), s, rad.y);
    if (id > 12.5) gQ = vec3(gQ.x, 0.0, gQ.z) + vec3(0.0, 2.0, 0.0);
  }
  return d;
}

float plumbSD(vec3 p, out float id) {
  id = 14.0;
  float d = sdCapsule(p, PTOP, PBOB + vec3(0.0, 0.11, 0.0), 0.0032);
  vec3 tr = TA[0].xyz; tr.y = PTOP.y;
  float peg = sdCapsule(p, tr + vec3(PDIR.x, 0.0, PDIR.y) * 0.5, PTOP + vec3(PDIR.x, 0.03, PDIR.y) * 0.04, 0.028);
  if (peg < d) { d = peg; id = 8.0; }
  float bob = sdRoundCone(p, PBOB, PBOB + vec3(0.0, 0.1, 0.0), 0.042, 0.016);
  if (bob < d) { d = bob; id = 15.0; }
  return d;
}

float map(vec3 p) {
  float d = (p.y - groundH(p.xz)) * 0.8; gId = 1.0; gTi = -1;
  for (int i = 0; i < NT; i++) {
    if (((gMask >> i) & 1) == 0) continue;
    float part; vec3 lq;
    float dd = cedarSD(p, i, part, lq);
    if (dd < d) { d = dd; gId = part; gTi = i; gQ = lq; }
  }
  float id; float dd;
  if (length(p - HOUSE - vec3(0.0, 1.6, 0.0)) < 6.5) { dd = houseSD(p, id); if (dd < d) { d = dd; gId = id; } }
  else d = min(d, length(p - HOUSE - vec3(0.0, 1.6, 0.0)) - 5.5);
  if (length(p - WELL - vec3(0.0, 0.8, 0.0)) < 2.6) { dd = wellSD(p, id); if (dd < d) { d = dd; gId = id; } }
  if (length(p - OLIVE - vec3(0.0, 2.8, 0.0)) < 5.5) { dd = oliveSD(p, id); if (dd < d) { d = dd; gId = id; } }
  if (length(p - ALTAR - vec3(0.0, 0.5, 0.0)) < 1.6) { dd = altarSD(p, id); if (dd < d) { d = dd; gId = id; } }
  if (length(p - STUMP) < 11.0) { vec3 sq = gQ; dd = stumpSD(p, id); if (dd < d) { d = dd; gId = id; gTi = -2; } else gQ = sq; }
  if (abs(p.x - PTOP.x) < 1.2 && abs(p.z - PTOP.z) < 1.2 && p.y < PTOP.y + 0.3) { dd = plumbSD(p, id); if (dd < d) { d = dd; gId = id; } }
  // the lamps
  float lm = 1e5;
  if (length(p - LAMPH) < 0.6) lm = min(lm, lampSD(p, LAMPH)); else lm = min(lm, length(p - LAMPH) - 0.4);
  float dl = min(length(p - LS0), min(length(p - LS1), length(p - LS2)));
  if (dl < 0.6) lm = min(lm, min(lampSD(p, LS0), min(lampSD(p, LS1), lampSD(p, LS2)))); else lm = min(lm, dl - 0.4);
  if (uLampF.y > -50.0 && length(p - uLampF) >= 1.5) lm = min(lm, length(p - uLampF) - 1.0);
  else if (uLampF.y > -50.0) {
    lm = min(lm, lampSD(p, uLampF));
    float st = sdEllipsoid(p - uLampF + vec3(0.0, 0.16, 0.0), vec3(0.34, 0.17, 0.28));
    if (st < 0.1) st += 0.05 * (fbm((p - uLampF) * 6.0, 3) - 0.5);
    if (st < d) { d = st; gId = 11.0; }
  }
  if (lm < d) { d = lm; gId = 16.0; }
  return d;
}

// the small things only, for soft shadows (cedars cast theirs analytically)
float mapSmall(vec3 p) {
  gLite = true;
  float d = 1e5, id;
  if (length(p - HOUSE - vec3(0.0, 1.6, 0.0)) < 6.5) d = min(d, houseSD(p, id)); else d = min(d, length(p - HOUSE - vec3(0.0, 1.6, 0.0)) - 5.5);
  if (length(p - WELL - vec3(0.0, 0.8, 0.0)) < 2.6) d = min(d, wellSD(p, id)); else d = min(d, length(p - WELL - vec3(0.0, 0.8, 0.0)) - 2.2);
  if (length(p - OLIVE - vec3(0.0, 2.8, 0.0)) < 5.5) d = min(d, oliveSD(p, id)); else d = min(d, length(p - OLIVE - vec3(0.0, 2.8, 0.0)) - 5.0);
  if (length(p - ALTAR - vec3(0.0, 0.5, 0.0)) < 1.6) d = min(d, altarSD(p, id)); else d = min(d, length(p - ALTAR - vec3(0.0, 0.5, 0.0)) - 1.2);
  if (length(p - STUMP) < 11.0) { vec3 sq = gQ; d = min(d, stumpSD(p, id)); gQ = sq; } else d = min(d, length(p - STUMP) - 10.0);
  gLite = false;
  return d;
}

vec3 calcNormal(vec3 p, float t) {
  float e = max(0.0008, 0.0007 * t);
  vec2 k = vec2(1.0, -1.0);
  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
}

float march(vec3 ro, vec3 rd, float tmax) {
  float t = 0.02;
  for (int i = 0; i < 220; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.0012 * t + 0.0004) return t;
    t += max(d * (t > 40.0 ? 1.4 : 0.9), (gId > 2.5 && gId < 3.5) || (gId > 9.5 && gId < 10.5) ? 0.02 + 0.003 * t : 0.0) + (t > 120.0 ? t * 0.006 : 0.0);
    if (t > tmax) break;
    if (rd.y >= 0.0 && (p.y > 45.0 || (p.y > 14.0 && length(p.xz) > 42.0 && dot(p.xz, rd.xz) > 0.0))) break;
    // past the hill and heading away over the low plain: the far-plain fallback takes over
    if (dot(p.xz, rd.xz) > 0.0 && dot(p.xz, p.xz) > 4900.0 && p.y > 7.0) break;
  }
  return -1.0;
}

float softShadow(vec3 ro, vec3 rd, float tmax) {
  float res = 1.0, t = 0.06;
  for (int i = 0; i < 28; i++) {
    float h = mapSmall(ro + rd * t);
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.03, 0.6);
    if (res < 0.01 || t > tmax) break;
  }
  return sat(res);
}

float calcAO(vec3 p, vec3 n) {
  float o = 0.0, sc = 1.0;
  for (int i = 0; i < 3; i++) {
    float h = 0.06 + 0.45 * float(i);
    gLite = true; o += (h - map(p + n * h)) * sc; sc *= 0.65; gLite = false;
  }
  return sat(1.0 - 1.1 * o);
}

// ------------------------------------------------------------------ fire
// one flame where the ray passes its axis (after the candles of faith-of-the-apostles)
vec3 flameAt(vec3 ro, vec3 rd, vec3 b, float h, float k, float seed, float depth) {
  if (k <= 0.001) return vec3(0);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dd > 1e-6 ? dot(b.xz - ro.xz, dxz) / dd : 0.0;
  if (t <= 0.0 || t > depth + 0.02) return vec3(0);
  vec3 q = ro + rd * t - b;
  float hh = h * min(k, 1.3) * (0.88 + 0.24 * vnoise(vec2(uTime * 7.0 + seed, 1.0)));
  float y = q.y / hh;
  if (y < -0.4 || y > 1.5) return vec3(0);
  float sw = (vnoise(vec2(uTime * 1.9 + seed, 3.0)) - 0.5) * 0.6;
  vec2 rr = q.xz - normalize(vec2(-rd.z, rd.x) + 1e-5) * sw * hh * 0.25 * y * y;
  float x = length(rr) / (hh * 0.24);
  float yy = clamp(y, 0.0, 1.0);
  float prof = pow(yy, 0.5) * pow(1.0 - yy, 0.75) * 1.9 + 0.08;
  float body = smoothstep(1.0, 0.55, x / prof) * smoothstep(-0.15, 0.08, y) * smoothstep(1.15, 0.85, y);
  float core = smoothstep(0.55, 0.15, x / prof) * smoothstep(0.0, 0.2, y) * smoothstep(0.75, 0.35, y);
  float root = smoothstep(0.9, 0.3, x / prof) * smoothstep(0.25, 0.0, y) * smoothstep(-0.25, 0.0, y);
  vec3 c = vec3(1.0, 0.55, 0.22) * body * 6.0 + vec3(1.0, 0.88, 0.66) * core * 22.0 + vec3(0.15, 0.3, 1.0) * root * 1.5;
  return c * min(k, 1.2);
}
float flick(float seed) { return 0.86 + 0.14 * vnoise(vec2(uTime * 9.0, seed)); }
// glow round a flame as a lens sees it, and its light in the haze
vec3 flameGlow(vec3 ro, vec3 rd, vec3 c, float k, float depth, float size) {
  if (k <= 0.0) return vec3(0);
  vec3 oc = c - ro; float tc = dot(oc, rd);
  if (tc < 0.0 || tc > depth + 0.1) return vec3(0);
  float hg = sqrt(max(dot(oc, oc) - tc * tc, 0.0));
  return vec3(1.0, 0.64, 0.32) * k * (0.5 * exp(-hg / (0.01 * size)) + 0.05 * exp(-hg / (0.06 * size)) + 0.008 * exp(-hg / (0.35 * size)));
}

// ------------------------------------------------------------------ smoke from the altar
float smokeD(vec3 p) {
  vec3 q = p - ALTAR - vec3(0.0, 0.9, 0.0);
  if (q.y < 0.0) return 0.0;
  float h = q.y;
  q.x -= uBend * h * h * 0.06;
  // a slow sway of the whole column, small near the coals
  q.xz -= vec2(sin(h * 0.3 - uTime * 0.7), cos(h * 0.23 - uTime * 0.5)) * 0.05 * h * (1.0 + uBend * 4.0);
  // warp: the smoke curls as it climbs
  vec3 s = vec3(q.x * 2.4, h * 1.1 - uTime * 1.6, q.z * 2.4);
  vec3 wq = s + 1.4 * vec3(vnoise(s * 0.7 + 3.0), 0.0, vnoise(s * 0.7 + 9.0)) - 0.7;
  float n = fbm(wq, 4);
  float n2 = vnoise(wq * 3.1 + 5.0);
  float r = length(q.xz + (vec2(n, n2) - 0.5) * (0.05 + 0.04 * h)) / (0.07 + 0.045 * h);
  float d = sat((1.0 - r) * 1.0 + (n - 0.5) * 1.8 + (n2 - 0.5) * 0.6);
  // thin ribbons and gaps
  d *= smoothstep(0.25, 0.6, n + 0.25 * n2 + 0.15);
  return d * exp(-h * 0.035) * smoothstep(0.0, 0.25, h) * 0.75;
}

// ------------------------------------------------------------------ shading
vec3 lampLight(vec3 p, vec3 n, vec3 lp, float k) {
  vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
  return vec3(1.0, 0.6, 0.28) * k * sat(dot(n, L) * 0.8 + 0.2) / (d2 + 0.02);
}
float sonK(int i) { return i == 0 ? uLampS.x : i == 1 ? uLampS.y : uLampS.z; }

vec3 shadeHit(vec3 p, vec3 rd, float t) {
  vec3 n = calcNormal(p, t);
  map(p);
  float id = gId; int ti = gTi; vec3 lq = gQ;
  vec3 v = -rd;
  vec3 alb = vec3(0.3); float rough = 0.8, spec = 0.04; vec3 emit = vec3(0);
  float trans = 0.0, see = 0.0;
  float cd = t;
  if (id < 1.5) {
    // the ground: dry grass, needle litter under the cedars, a worn path to the door
    float g = fbm(p.xz * 0.35, 4), g2 = fbm(p.xz * 6.0, 2), g3 = vnoise(p.xz * 45.0);
    alb = mix(vec3(0.07, 0.075, 0.035), vec3(0.16, 0.13, 0.065), smoothstep(0.3, 0.7, g)) * (0.6 + 0.6 * g2) * (0.75 + 0.5 * g3);
    alb = mix(alb, vec3(0.2, 0.17, 0.12), smoothstep(0.72, 0.8, fbm(p.xz * 1.3 + 5.0, 3)) * 0.6);   // stones and bare earth
    float needles = 0.0;
    for (int i = 0; i < NT; i++) { float r = length(p.xz - TA[i].xz); needles = max(needles, smoothstep(CED_B[i].y * 0.75, CED_B[i].y * 0.15, r)); }
    alb = mix(alb, vec3(0.16, 0.085, 0.05) * (0.8 + 0.4 * g2), needles * 0.85);
    vec2 hp = p.xz - HOUSE.xz;
    float path = smoothstep(0.9, 0.3, abs(hp.x - 0.6 - 0.25 * sin(hp.y * 0.4))) * step(2.0, hp.y) * smoothstep(14.0, 4.0, hp.y);
    path = max(path, smoothstep(3.6, 2.6, length(max(abs(hp) - vec2(3.0, 2.3), 0.0)) + 2.6));
    path *= 0.5 * smoothstep(0.35, 0.65, fbm(p.xz * 1.5, 3));
    alb = mix(alb, vec3(0.1, 0.085, 0.065) * (0.7 + 0.6 * g2), path);
    // far land goes dull and dark
    alb *= mix(1.0, 0.6, smoothstep(80.0, 500.0, length(p.xz)));
    rough = 0.95;
    // grass: blades seen through thin shells above the ground (near the lens only)
    float rock = smoothstep(0.02, 0.12, rockH(p.xz));
    if (cd < uGrassD && path < 0.5 && rock < 0.5) {
      float gy = groundH(p.xz);
      float hit = 0.0, hh = 0.0;
      float H = uGrassH;
      float dens = 34.0 * sqrt(0.16 / H);
      for (int k = 0; k < 9; k++) {
        float h = H * (1.0 - float(k) / 9.0);
        float tt = (gy + h - p.y) / rd.y;
        vec3 q = p + rd * tt;
        vec2 lean = vec2(0.8, 0.5) * h * h / H * 1.4 + vec2(sin(uTime * 1.3 + q.x * 0.4), cos(uTime * 1.1 + q.z * 0.4)) * 0.12 * h;
        vec2 qq = (q.xz - lean) * dens;
        vec2 cell = floor(qq);
        vec2 f = fract(qq) - 0.5 - (hash22(cell) - 0.5) * 0.6;
        float bh = H * hash12(cell * 1.7) * (0.35 + 0.9 * fbm(q.xz * 0.5, 2));
        float wdt = 0.3 * (1.0 - h / max(bh, 1e-3));
        if (h < bh && length(f) < wdt) { hit = 1.0; hh = h / max(bh, 1e-3); break; }
      }
      float gk = smoothstep(uGrassD, uGrassD * 0.45, cd) * (1.0 - needles * 0.8);
      vec3 blade = mix(vec3(0.03, 0.035, 0.015), vec3(0.22, 0.19, 0.08), hh) * (0.7 + 0.6 * hash12(floor(p.xz * dens)));
      alb = mix(alb, mix(alb * 0.4, blade, hit), gk);
      trans = hit * gk * hh * 0.9;
      if (hit > 0.5) n = normalize(mix(n, vec3(0.0, 0.3, 0.0) - rd, 0.5 * gk));
    }
    // stone of the outcrops: grey limestone with lichen
    if (rock > 0.0) {
      vec3 st = vec3(0.17, 0.16, 0.14) * (0.5 + 0.8 * fbm(p * 4.0, 3));
      st = mix(st, vec3(0.3, 0.3, 0.24), smoothstep(0.6, 0.8, fbm(p.xz * 5.0 + 2.0, 3)) * 0.5);
      alb = mix(alb, st, rock);
      if (cd < 40.0) { vec3 rn = vec3(fbm(p * 6.0, 3), fbm(p * 6.0 + 4.0, 3), fbm(p * 6.0 + 8.0, 3)) - 0.5; n = normalize(n + rn * 1.4 * rock); }
    }
    // small grain on the near ground
    if (cd < 15.0) { vec2 gr = vec2(vnoise(p.xz * 40.0), vnoise(p.xz * 40.0 + 7.0)) - 0.5; n = normalize(n + vec3(gr.x, 0.0, gr.y) * 0.35 * smoothstep(15.0, 3.0, cd)); }
  } else if (id < 2.5) {
    // bark: grey-brown scaly ridges, deep dark fissures between; low saturation, a little lichen
    float r = length(lq.xz);
    vec2 bp = barkPat(lq, r, ti >= 0 ? CED_B[ti].z : 3.0);
    float b = bp.x;
    vec3 ridgeC = mix(vec3(0.15, 0.135, 0.12), vec3(0.25, 0.23, 0.21), hash11(bp.y * 33.0)) * (0.85 + 0.3 * fbm(lq * vec3(25.0, 6.0, 25.0), 2));
    alb = mix(vec3(0.025, 0.021, 0.018), ridgeC, smoothstep(0.25, 0.7, b));
    float lich = smoothstep(0.66, 0.8, fbm(lq * vec3(5.0, 1.6, 5.0) + 2.0, 3)) * smoothstep(0.6, 0.85, b);
    alb = mix(alb, vec3(0.3, 0.31, 0.28), lich * 0.5);
    rough = 0.92;
    if (cd < 6.0) { vec3 mn = vec3(vnoise(lq * 140.0), vnoise(lq * 140.0 + 5.0), vnoise(lq * 140.0 + 9.0)) - 0.5; n = normalize(n + mn * 0.25 * smoothstep(6.0, 1.0, cd)); }
  } else if (id < 3.5) {
    // cedar sprays: dark blue-green, lighter at the tips
    float f = fbm(p * 3.0, 3);
    alb = mix(vec3(0.016, 0.026, 0.026), vec3(0.04, 0.055, 0.045), f);
    if (ti >= 17) alb = mix(vec3(0.04, 0.08, 0.045), vec3(0.09, 0.15, 0.07), f);
    rough = 0.75; trans = 1.0;
    float fq = 30.0 / max(1.0, cd / 8.0);
    vec3 nn = vec3(vnoise(p * fq), vnoise(p * fq + 3.0), vnoise(p * fq + 6.0)) - 0.5; n = normalize(n + nn * 0.9);
    // sprays: clumps of needles with dark gaps between
    float clump = smoothstep(0.3, 0.7, fbm(p * 2.6 + 1.7, 3));
    alb *= (0.3 + 0.9 * clump);
    trans *= clump;
    // the sky shows through the thin edges of the sprays
    see = smoothstep(0.62, 0.8, vnoise(p * 4.0 + 3.3)) * 0.45 * smoothstep(0.1, 0.5, -n.y + 0.3);
  } else if (id < 4.5) {
    vec3 q = p - HOUSE;
    bool inside = abs(q.x) < 2.56 && abs(q.z) < 1.86 && q.y < 3.0;
    float s = fbm(p * 2.5, 3);
    vec2 uv = abs(q.x) > 2.9 ? q.zy : q.xy;
    vec2 vv = voronoiEdge(uv * vec2(4.2, 7.5) + vec2(0.0, 0.3 * sin(uv.x * 2.0)));
    vec3 stone = mix(vec3(0.34, 0.29, 0.23), vec3(0.5, 0.44, 0.35), hash11(vv.y * 91.0)) * (0.8 + 0.4 * fbm(p * 9.0, 3));
    stone = mix(stone, vec3(0.28, 0.27, 0.25), smoothstep(0.55, 0.8, fbm(p * 1.3 + 7.0, 3)) * 0.5);   // weathering
    alb = mix(vec3(0.46, 0.42, 0.36) * (0.7 + 0.3 * s), stone, smoothstep(0.0, 0.04, vv.x));
    alb *= 1.0 - 0.3 * smoothstep(0.85, 0.2, q.y) * fbm(p * 3.0, 2);  // damp at the foot
    if (inside) alb = vec3(0.52, 0.42, 0.3) * (0.85 + 0.2 * s);
    rough = 0.9;
  } else if (id < 5.5) {
    alb = vec3(0.2, 0.15, 0.1) * (0.7 + 0.5 * fbm(p * 4.0, 3)); rough = 0.95;
  } else if (id < 8.5 && id > 7.5) {
    // timber: weathered cedar and olive wood
    alb = vec3(0.3, 0.2, 0.12) * (0.7 + 0.5 * fbm(p * vec3(30.0, 3.0, 30.0), 3)); rough = 0.7;
  } else if (id < 7.5) {
    alb = vec3(0.4, 0.36, 0.3) * (0.7 + 0.5 * fbm(p * 5.0, 3)); rough = 0.9;
  } else if (id < 9.5) {
    // the olive's grey twisted bark
    alb = vec3(0.26, 0.24, 0.21) * (0.6 + 0.6 * fbm(p * vec3(8.0, 2.0, 8.0), 4)); rough = 0.9;
  } else if (id < 10.5) {
    // olive leaves: grey-green above, silver beneath
    float f = fbm(p * 4.0, 3);
    alb = mix(vec3(0.07, 0.08, 0.05), vec3(0.17, 0.18, 0.13), f); rough = 0.6; trans = 0.6;
    if (cd < 15.0) { vec3 nn = vec3(vnoise(p * 22.0), vnoise(p * 22.0 + 3.0), vnoise(p * 22.0 + 6.0)) - 0.5; n = normalize(n + nn * 0.9); }
  } else if (id < 11.5) {
    vec3 q = p - ALTAR;
    vec2 uv = abs(q.x) > 0.58 ? q.zy : q.xy;
    vec2 v = voronoiEdge(uv * vec2(4.0, 6.0) + vec2(0.0, 0.4 * sin(uv.x * 3.0)));
    alb = mix(vec3(0.17, 0.155, 0.14), vec3(0.3, 0.27, 0.23), hash11(v.y * 57.0)) * (0.6 + 0.6 * fbm(p * 11.0, 3));
    alb = mix(alb, vec3(0.2, 0.21, 0.17), smoothstep(0.6, 0.8, fbm(p * 4.0 + 3.0, 3)) * 0.6);   // lichen
    alb = mix(vec3(0.08, 0.07, 0.06), alb, smoothstep(0.0, 0.05, v.x));
    alb = mix(alb, vec3(0.05), smoothstep(0.6, 0.86, p.y - ALTAR.y) * 0.6);
    rough = 0.9;
  } else if (id < 12.5) {
    // coals: black crust with glowing cracks that breathe
    float c = fbm(p * 18.0 + vec3(0.0, uTime * 0.2, 0.0), 3);
    float glow = smoothstep(0.45, 0.75, c) * (0.7 + 0.3 * sin(uTime * 2.3 + c * 9.0));
    alb = vec3(0.03); emit = vec3(1.0, 0.32, 0.06) * glow * 6.0 * uCoal; rough = 0.9;
  } else if (id < 13.5) {
    // the cut face of the cedar: growth rings of uneven years, a little off centre, wet and fresh
    vec2 xz = lq.xz - vec2(0.05, 0.035);
    float r = length(xz), a = atan(xz.y, xz.x);
    float wob = 0.006 * (fbm(vec2(a * 1.5, r * 4.0), 3) - 0.5) + 0.004 * sin(a * 2.0 + 1.0) * smoothstep(0.0, 0.3, r);
    float rr = r + wob;
    // a year is ~4.6 mm on average, thin years and fat years
    float ring = rr * 215.0 + 9.0 * fbm(vec2(rr * 14.0, 3.7), 3);
    float fr = fract(ring);
    float late = smoothstep(0.7, 0.93, fr) * (1.0 - smoothstep(0.95, 1.0, fr));
    float frB = fract(ring + 0.12);
    float lateB = smoothstep(0.7, 0.93, frB) * (1.0 - smoothstep(0.95, 1.0, frB));
    float yearK = 0.6 + 0.8 * hash11(floor(ring) * 1.37);   // some years darker than others
    float rp = rr / 0.6;
    vec3 heart = mix(vec3(0.5, 0.29, 0.17), vec3(0.62, 0.4, 0.24), fbm(vec2(a * 3.0, rr * 9.0), 3));
    vec3 sap = vec3(0.8, 0.64, 0.44);
    alb = mix(heart, sap, smoothstep(0.84, 0.9, rp));
    alb *= mix(1.1, 1.0 - 0.45 * yearK, late) * (1.0 - 0.15 * fr * yearK);
    // tool grain across the face, fine fibres
    alb *= 0.93 + 0.1 * vnoise(vec2(a * 300.0, rr * 30.0));
    // the pith, two radial checks drying from it
    alb *= mix(0.5, 1.0, smoothstep(0.0, 0.01, r));
    float chk = 0.0;
    for (int k = 0; k < 2; k++) {
      float ca = 1.3 + 2.6 * float(k) + 0.08 * sin(r * 30.0);
      float da = abs(mod(a - ca + PI, 2.0 * PI) - PI) * r;
      chk = max(chk, smoothstep(0.0025 * (1.0 - r / 0.35), 0.0, da) * smoothstep(0.35 - 0.1 * float(k), 0.1, r));
    }
    alb *= 1.0 - 0.85 * chk;
    // the bark rim, and sawdust on the face near it
    alb = mix(alb, vec3(0.12, 0.07, 0.05), smoothstep(0.585, 0.6, r));
    float dust = smoothstep(0.62, 0.8, fbm(xz * 40.0, 3)) * smoothstep(0.35, 0.58, r) * step(r, 0.585);
    alb = mix(alb, vec3(0.85, 0.7, 0.5), dust * 0.7);
    // saw marks: shallow arcs across the face
    float sawv = sin((xz.x + 0.25 * xz.y * xz.y) * 260.0 + 3.0 * fbm(xz * 9.0, 2)) * (0.4 + 0.6 * fbm(xz * 4.0, 2));
    n = normalize(n + vec3(sawv * 0.012, 0.0, sawv * 0.004) * step(r, 0.585));
    n = normalize(n + vec3(cos(a), 0.0, sin(a)) * (late - lateB) * 0.35 * step(r, 0.585));
    float wet = smoothstep(0.35, 0.6, fbm(xz * 5.0 + 2.0, 3)) * (1.0 - dust);
    rough = mix(0.6, 0.18, wet); spec = 0.045;
    alb *= mix(1.0, 0.8, wet);
  } else if (id < 14.5) {
    // twisted cord: strands winding round it
    float tw = sin(p.y * 260.0 + atan(p.z - PTOP.z, p.x - PTOP.x) * 3.0);
    alb = vec3(0.33, 0.27, 0.19) * (0.7 + 0.3 * tw) * (0.85 + 0.3 * vnoise(p.xz * 40.0 + p.y * 9.0)); rough = 0.9;
  } else if (id < 15.5) {
    // the bob: a worn grey stone
    alb = vec3(0.24, 0.23, 0.21) * (0.6 + 0.6 * fbm(p * 60.0, 3)); rough = 0.75; spec = 0.04;
    vec3 sn = vec3(vnoise(p * 90.0), vnoise(p * 90.0 + 3.0), vnoise(p * 90.0 + 7.0)) - 0.5; n = normalize(n + sn * 0.6);
  } else if (id < 16.5) {
    alb = vec3(0.42, 0.24, 0.13) * (0.8 + 0.3 * fbm(p * 60.0, 2)); rough = 0.6;
  } else if (id < 17.5) {
    alb = vec3(0.005); rough = 0.05; spec = 0.4;
  } else {
    alb = vec3(0.06, 0.055, 0.05); rough = 0.4; spec = 0.3;
  }

  vec3 L = normalize(uSunDir);
  float ao = calcAO(p, n);
  float sh = 1.0;
  float nl = dot(n, L);
  float gate = mix(1.0, gapMask(p), uGate) * uKeyK;
  if (gate > 0.002 && (nl > -0.2 || trans > 0.0)) {
    sh = cedarVis(p + n * 0.05, L);
    if (sh > 0.01 && length(p - HOUSE) < 40.0) sh *= softShadow(p + n * 0.04, L, 14.0);
  } else sh = 0.0;
  vec3 key = uSunCol * gate * sh;
  vec3 h = normalize(L + v);
  float a2 = max(0.02, rough * rough); a2 *= a2;
  float nh = sat(dot(n, h));
  float D = a2 / (PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
  float F = spec + (1.0 - spec) * pow(1.0 - sat(dot(h, v)), 5.0);
  vec3 col = alb / PI * key * sat(nl) + key * sat(nl) * D * F * 0.25;
  // light through the sprays
  if (trans > 0.0) col += alb * vec3(1.3, 1.25, 0.7) * key * trans * (0.06 + 0.6 * pow(sat(dot(rd, L)), 4.0)) * sat(-nl + 0.3);
  // sky and bounce
  vec3 amb = uAmbCol * (0.55 + 0.45 * n.y) + vec3(0.6, 0.5, 0.35) * uAmbCol * sat(-n.y) * 0.5;
  // the gold of the gap lifts the shadows inside the grove too
  // and the lit ground throws gold back up onto trunks, walls and the undersides of the sprays
  amb += uSunCol * uGrace * uGate * gapMask(p + vec3(0.0, 6.0, 0.0)) * (0.004 + 0.02 * sat(0.6 - 0.6 * n.y)) * (id > 2.5 && id < 3.5 ? 0.3 : 1.0);
  col += alb * amb * ao;
  // lamps
  vec3 lamps = vec3(0);
  if (uLampH > 0.0 && length(p - LAMPH) < 9.0) {
    vec3 lp = lampFlamePos(LAMPH) + vec3(0.0, 0.04, 0.0);
    float s = softShadow(p + n * 0.06, normalize(lp - p), length(lp - p) - 0.12);
    lamps += lampLight(p, n, lp, 2.2 * uLampH * flick(1.0)) * s;
  }
  for (int i = 0; i < 3; i++) {
    float k = sonK(i);
    if (k <= 0.0) continue;
    vec3 lp = lampFlamePos(i == 0 ? LS0 : i == 1 ? LS1 : LS2) + vec3(0.0, 0.03, 0.0);
    lamps += lampLight(p, n, lp, 0.5 * k * flick(float(i) * 7.0 + 3.0));
  }
  if (uLampFk > 0.0) lamps += lampLight(p, n, lampFlamePos(uLampF) + vec3(0.0, 0.03, 0.0), 0.3 * uLampFk * flick(9.0));
  if (uCoal > 0.0) { vec3 cp = ALTAR + vec3(0.0, 1.0, 0.0); vec3 Lc = cp - p; float d2 = dot(Lc, Lc); lamps += vec3(1.0, 0.35, 0.08) * uCoal * 0.5 * sat(dot(n, normalize(Lc)) * 0.7 + 0.3) / (d2 + 0.1); }
  col += alb * lamps * mix(1.0, ao, 0.5);
  // the room inside the door, warm with lamplight
  { vec3 hq = p - HOUSE; if (abs(hq.x) < 2.6 && abs(hq.z) < 1.9 && hq.y < 3.0 && uLampH > 0.0) col += alb * vec3(1.0, 0.58, 0.26) * 0.22 * uLampH * flick(1.0) * (0.5 + 0.5 * smoothstep(-1.9, 1.9, hq.z)); }
  // lightning far off lights the edges of things
  if (dot(uFlashL, uFlashL) > 0.0) { vec3 Lf = normalize(uFlashL); col += alb * vec3(0.5, 0.58, 0.85) * length(uFlashL) * (sat(dot(n, Lf)) * 0.8 + 0.1) * ao; }
  if (see > 0.0) col = mix(col, mix(skyBase(rd), uCloudAmb * 0.45 + uSunCol * uGrace * 0.006, uCloud), see);
  // the water in the well mirrors the sky
  if (id > 16.5 && id < 17.5) col += skyBase(reflect(rd, n)) * 0.25;
  // the cut cedar glistens
  return col + emit;
}

// ------------------------------------------------------------------ the frame
vec3 groveLens(vec2 fc, out vec3 ro) {
  vec3 rd0 = camRay(fc, ro);
  if (uAper <= 0.0) return rd0;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1 + uTime), hash12(uJitter * 613.0 + 7.7 + uTime));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}

// far off on the dark plain, the fires of the valley cities (s25)
vec3 valleyFires(vec2 xz, float t) {
  if (uWall <= 0.0 || t < 300.0) return vec3(0);
  vec2 cg = xz / 60.0; vec2 ci = floor(cg);
  float hsh = hash12(ci);
  if (hsh <= 0.93) return vec3(0);
  vec2 lc = (ci + 0.5 + (hash22(ci) - 0.5) * 0.6) * 60.0;
  float dl = length(xz - lc) / (2.0 + t * 0.002);
  return vec3(1.0, 0.35, 0.08) * 0.25 * exp(-dl * dl) * (0.7 + 0.3 * vnoise(vec2(uTime * 3.0, hsh * 50.0)));
}

vec3 grove(vec2 fc) {
  vec3 ro; vec3 rd = groveLens(fc, ro);
  float jit = hash12(fc + fract(uTime * 3.71) * 61.0);
  gMask = cedarRayMask(ro, rd);
  float t = march(ro, rd, 3500.0);
  gMask = 0x7fffffff;
  vec3 col; float depth;
  vec3 skyC = skyFull(ro, rd, jit);
  if (t > 0.0) {
    vec3 p = ro + rd * t;
    col = shadeHit(p, rd, t);
    depth = t;
    // aerial haze: the far land goes into the sky's colour
    float fog = 1.0 - exp(-t * uHaze * exp(-max(p.y - 6.0, 0.0) * 0.01));
    vec3 hz = mix(uFogCol, uSkyHor * 0.7, smoothstep(200.0, 3500.0, t));
    vec4 w = stormWall(normalize(vec3(rd.x, max(rd.y, 0.004), rd.z)));
    hz = mix(hz, w.rgb, w.a * smoothstep(300.0, 2500.0, t));
    col = mix(col, hz, fog);
    col += valleyFires(p.xz, t);
  } else if (rd.y < 0.0) {
    // the far plain, beyond the march
    float tp = (-4.0 - ro.y) / rd.y;
    float fog = 1.0 - exp(-tp * uHaze);
    col = mix(uFogCol * 0.5, mix(uFogCol, uSkyHor * 0.7, smoothstep(200.0, 3500.0, tp)), fog);
    vec4 w = stormWall(normalize(vec3(rd.x, 0.004, rd.z)));
    col = mix(col, w.rgb, w.a * smoothstep(300.0, 2500.0, tp) * fog);
    col += valleyFires(ro.xz + rd.xz * tp, tp);
    depth = tp;
  } else {
    col = skyC; depth = 1e5;
  }
  // haze lit by the low sun, and the shaft of gold from the gap
  if (uRays > 0.0) {
    float tm = min(depth, uRayMax);
    float dt = tm / 16.0;
    float acc = 0.0;
    for (int i = 0; i < 16; i++) {
      vec3 p = ro + rd * (float(i) + jit) * dt;
      if (p.y > CB) break;
      float g = mix(1.0, gapMask(p), uGate);
      if (g < 0.01) continue;
      // streaks: the ragged break's light falls in beams (constant along the light)
      vec2 gp = gapProj(p);
      g *= mix(1.0, 0.12 + 1.8 * smoothstep(0.35, 0.8, vnoise(gp * 0.11 + 2.0)) * (0.5 + 0.8 * vnoise(gp * 0.35)), uGate);
      float vis = length(p.xz) < 45.0 && p.y < 40.0 ? cedarVisCheap(p, normalize(uSunDir)) : 1.0;
      acc += g * vis * exp(-max(p.y, 0.0) * 0.004) * dt;
    }
    float ph = 0.35 + 1.4 * pow(sat(dot(rd, normalize(uSunDir))), 6.0);
    col += uSunCol * acc * uRays * 0.00012 * ph;
  }
  // the altar's smoke
  if (uSmoke > 0.0) {
    vec2 oc = ALTAR.xz - ro.xz;
    float rdl = max(length(rd.xz), 1e-4);
    vec2 rdn = rd.xz / rdl;
    float tc = dot(oc, rdn) / rdl;
    float off = length(ro.xz + rd.xz * tc - ALTAR.xz);
    float Rm = 4.5;
    if (off < Rm) {
      float half_ = sqrt(Rm * Rm - off * off) / rdl;
      float t0 = max(tc - half_, 0.0), t1 = min(tc + half_, depth);
      t1 = min(t1, t0 + 80.0);
      if (t1 > t0) {
        float sdt = (t1 - t0) / 40.0;
        vec3 Ls = vec3(0); float T = 1.0;
        for (int i = 0; i < 40; i++) {
          vec3 p = ro + rd * (t0 + (float(i) + jit) * sdt);
          if (p.y > ALTAR.y + 70.0) break;
          float d = smokeD(p) * uSmoke;
          if (d > 0.01) {
            float lit = exp(-(smokeD(p + normalize(uSunDir) * 0.15) + smokeD(p + normalize(uSunDir) * 0.45)) * 1.6);
            float g = mix(1.0, gapMask(p), uGate);
            float ph = 0.03 + 0.5 * pow(sat(dot(rd, normalize(uSunDir))), 6.0) + 0.1 * pow(sat(dot(rd, normalize(uSunDir))), 1.5);
            // backlit: the thin edges glow, the dense core stays grey
            vec3 sc = uAmbCol * 3.0 + uSunCol * g * lit * ph * 0.6 * (1.4 - 1.0 * sat(d * 2.5));
            sc += vec3(1.0, 0.35, 0.08) * uCoal * 0.6 * exp(-(p.y - ALTAR.y - 0.9) * 1.5);
            float a = 1.0 - exp(-d * sdt * 2.2);
            Ls += T * a * sc; T *= 1.0 - a;
            if (T < 0.02) break;
          }
        }
        col = col * T + Ls;
      }
    }
  }
  // flames
  if (uLampH > 0.0) { vec3 fp = lampFlamePos(LAMPH); col += flameAt(ro, rd, fp, 0.055, uLampH, 1.0, depth) + flameGlow(ro, rd, fp + vec3(0.0, 0.02, 0.0), uLampH, depth, 1.0); }
  for (int i = 0; i < 3; i++) {
    float k = sonK(i);
    if (k <= 0.0) continue;
    vec3 fp = lampFlamePos(i == 0 ? LS0 : i == 1 ? LS1 : LS2);
    col += flameAt(ro, rd, fp, 0.06, k, float(i) * 5.0 + 2.0, depth) + flameGlow(ro, rd, fp + vec3(0.0, 0.02, 0.0), k * 1.5, depth, 2.2);
  }
  if (uLampFk > 0.0) { vec3 fp = lampFlamePos(uLampF); col += flameAt(ro, rd, fp, 0.055, uLampFk, 9.0, depth) + flameGlow(ro, rd, fp + vec3(0.0, 0.02, 0.0), uLampFk, depth, 1.0); }
  // sawdust and pollen drifting in the low sun
  if (uDust > 0.0) {
    for (int i = 0; i < 48; i++) {
      float fi = float(i);
      vec3 h3 = vec3(hash11(fi * 1.7), hash11(fi * 3.1 + 2.0), hash11(fi * 5.3 + 4.0));
      vec3 mp = STUMP + vec3(-1.4, 0.4, -1.2) + h3 * vec3(2.8, 1.6, 2.6);
      mp.y += fract(h3.y + uTime * 0.03 * (0.5 + h3.x)) * 1.2 - 0.6;
      mp.xz += vec2(sin(uTime * 0.4 + fi), cos(uTime * 0.33 + fi * 1.3)) * 0.15;
      vec3 oc = mp - ro; float tc = dot(oc, rd);
      if (tc < 0.0 || tc > depth) continue;
      float h2 = dot(oc, oc) - tc * tc;
      float s = 0.0012 + 0.001 * h3.z;
      float g = mix(1.0, gapMask(mp), uGate);
      col += uSunCol * g * uDust * 0.02 * exp(-h2 / (s * s)) * (0.4 + pow(sat(dot(rd, normalize(uSunDir))), 2.0));
    }
  }
  return col;
}
`;
