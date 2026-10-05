// The flood world: the finished ark on Noe's hill in the storm at night (s35, s36, s45, s46).
// Built to the shared design and to the same measures as the timber-yard ark (lib/x-ark.js), so the
// two read as one ship: a long box hull 300 x 50 x 30 cubits (1 cubit = 0.4572 m: 137.2 x 22.9 x
// 13.7 m) standing on a slipway of timber blocks; cedar strakes of varied widths, each lapped over the
// one below, coated in glossy black pitch (drips and runs from the seams, the gloss broken where it is
// thin, honey cedar showing at worn edges, the corner posts, the top rail, the door frame and ramp);
// vertical sides to 11 m, a low roof narrowing to a clerestory, a continuous window strip one cubit
// high just under the ridge cap, glowing gold; one great door in the side near the middle, its leaf
// hinged on the bow side and swung open flat against the hull, a cleated ramp down to the ground.
// Long axis x, door side +z, hilltop ground y = 0. Cedars of Lebanon stand round the hilltop.
// Lights: the gold from the door (through the opening, shadowed by the leaf), the window strip, the
// carried lamps (s36), lightning, and the cold cloud-light of the night.
import { SKY_GLSL, SKY_UNIFORMS } from './x-flood-sky.js';

const CU = 0.4572;
export const ARK = { L: 150 * CU, W: 25 * CU, Y0: 1.2, DX: 6.0, DY0: 1.55, DW: 2.3, DH: 4.15, RL: 7.0 };

// the hill without its small noise (for paths)
const hillH = (x, z) => { const r = Math.hypot(x * 0.42, z), s = Math.max(r - 34, 0); return -60 * (1 - Math.exp(-s * s / (12000 + 90 * s))); };
// Carried lamps (four pairs, the bearers unseen) walking up to the ramp, up it and into the hold:
// the first pair sets out at `start`, each pair `gap` seconds behind, at `speed` m/s.
// Returns 32 floats (x, y, z, on) for uLampP.
export function lampsAt(t, start, gap, speed) {
  const { W, DX, DY0, RL } = ARK;
  const P0 = [DX + 4, hillH(DX + 4, W + RL + 14) + 1.0, W + RL + 14], P1 = [DX, hillH(DX, W + RL) + 1.05, W + RL];
  const P2 = [DX, DY0 + 1.05, W + 0.2], P3 = [DX - 0.8, DY0 + 1.05, W - 3.2];
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const l1 = len(P0, P1), l2 = len(P1, P2), l3 = len(P2, P3), L = l1 + l2 + l3;
  const out = [];
  for (let i = 0; i < 8; i++) {
    const pr = i >> 1, side = (i & 1) * 2 - 1;
    const dw = (t - (start + pr * gap)) * speed - side * 0.25;
    let p;
    if (dw < l1) p = lerp(P0, P1, Math.max(dw, 0) / l1); else if (dw < l1 + l2) p = lerp(P1, P2, (dw - l1) / l2); else p = lerp(P2, P3, Math.min((dw - l1 - l2) / l3, 1));
    const ph = dw * 2.4 + i * 1.3;
    p = [p[0] + side * 0.6 + 0.03 * Math.sin(ph * 0.5), p[1] + 0.045 * Math.abs(Math.sin(ph)), p[2]];
    const s = dw / L;
    const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    out.push(...p, sm(-0.02, 0, s) * (1 - sm(0.9, 1, s)));
  }
  return out;
}
// a moon direction the hull's door side mirrors toward a camera at cam (low in the sky behind it)
export function moonFor(cam, elev = 0.22) {
  const d = [ARK.DX - cam[0], 0, ARK.W - cam[2]]; const l = Math.hypot(...d);
  const r = [d[0] / l, elev, -d[2] / l]; const m = Math.hypot(...r);
  return r.map((v) => v / m);
}
// metres the lamps walk from their start to the threshold
export const LAMP_PATH = (() => {
  const { W, DX, DY0, RL } = ARK;
  const P0 = [DX + 4, hillH(DX + 4, W + RL + 14) + 1.0, W + RL + 14], P1 = [DX, hillH(DX, W + RL) + 1.05, W + RL], P2 = [DX, DY0 + 1.05, W + 0.2];
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  return len(P0, P1) + len(P1, P2);
})();

export const ARK_UNIFORMS = {
  ...SKY_UNIFORMS,
  uDoor: 180.0,       // door leaf angle in degrees (0 shut, 180 open flat against the hull)
  uGold: 1.0,         // the gold within
  uWet: 0.6,          // wetness of the world 0..1
  uLampP: new Array(32).fill(0),   // carried lamps: (x, y, z, on) x 8, from lampsAt()
  uClear: [0, 0, 0, 0],   // keep cedars out of a circle (x, z, radius) round the camera
  uMirror: [0, 0.2, 1],   // a pale patch of cloud behind the camera that the wet pitch mirrors (from moonFor)
};

const f = (v) => v.toFixed(4);
export const ARK_GLSL = SKY_GLSL + /* glsl */ `
uniform float uDoor, uGold, uWet;
uniform float uLampP[32];
uniform vec4 uClear;
uniform vec3 uMirror;

const float CU = ${f(CU)};
const float AL = ${f(ARK.L)}, AW = ${f(ARK.W)};
const float AY0 = ${f(ARK.Y0)};          // hull bottom, on its slipway
const float YW = AY0 + 11.0;             // top of the side walls
const float YR = AY0 + 12.8;             // foot of the window strip
const float YWIN = YR + CU;              // top of the window (a cubit)
const float YCAP = AY0 + ${f(30 * CU)};  // the ridge
const float RW = 2.6;                    // half width of the clerestory
const float DX = ${f(ARK.DX)}, DY0 = ${f(ARK.DY0)}, DW = ${f(ARK.DW)}, DH = ${f(ARK.DH)};
const float RL = ${f(ARK.RL)};
const vec3 GOLD = vec3(1.0, 0.66, 0.30);
const vec3 LAMPC = vec3(1.0, 0.55, 0.2);
const vec3 HINGE = vec3(DX + DW + 0.15, 0.0, AW + 0.36);

// lamps on posts along the door side and by the bow, as in the timber yard (lib/x-ark.js)
#define NO 8
vec3 outLamp(int i) {
  if (i == 6) return vec3(AL + 5.0, 2.7, AW + 6.0);
  if (i == 7) return vec3(AL + 5.0, 2.7, -AW - 3.0);
  if (i == 3) return vec3(-80.0, 2.7, AW + 9.0);     // (the two posts by the door are taken down)
  if (i == 4) return vec3(52.0, 2.7, AW + 5.5);
  return vec3(-56.0 + 22.0 * float(i) + (i == 2 ? -14.0 : 0.0), 2.7, AW + 5.5 + (i == 3 ? 3.5 : 0.0));
}
float outFlick(int i) { return 0.85 + 0.15 * vnoise(vec2(uTime * 7.0, float(i) * 13.0)); }

float sdTrap(vec2 p, float r1, float r2, float he) {
  vec2 k1 = vec2(r2, he), k2 = vec2(r2 - r1, 2.0 * he);
  p.x = abs(p.x);
  vec2 ca = vec2(p.x - min(p.x, (p.y < 0.0) ? r1 : r2), abs(p.y) - he);
  vec2 cb = p - k1 + k2 * clamp(dot(k1 - p, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
vec3 bumpN(vec3 n, vec3 T, vec3 B, float du, float dv) { return normalize(n - T * du - B * dv); }

// ---------- the hill ----------
float hillH(vec2 xz) {
  float r = length(vec2(xz.x * 0.42, xz.y));
  float s = max(r - 34.0, 0.0);
  return -60.0 * (1.0 - exp(-s * s / (12000.0 + 90.0 * s)));
}
float groundH(vec2 xz) {
  float h = hillH(xz);
  float r = length(vec2(xz.x * 0.42, xz.y));
  h += (fbm(xz * 0.025, 3) - 0.5) * 6.0 * smoothstep(30.0, 72.0, r);
  h += (vnoise(xz * 0.35) - 0.5) * 0.22;
  // the trodden way up to the ramp, a little sunk
  float path = smoothstep(3.2, 1.0, abs(xz.x - DX - 0.12 * (xz.y - AW - RL))) * smoothstep(AW + RL - 2.0, AW + RL + 1.0, xz.y);
  return h - 0.08 * path;
}

// ---------- cedars of Lebanon ----------
// a straight trunk carrying flat, layered sprays held out level in broken tiers: each tier spreads
// further one way than another, ragged at its edge, with gaps through it
const float CS = 13.0;
bool cedarAt(vec2 cid, out vec3 base, out float H, out float R) {
  vec2 hh = hash22(cid * 1.37 + 4.1);
  vec2 c = (cid + 0.5) * CS + (hh - 0.5) * CS * 0.55;
  float r = length(vec2(c.x * 0.42, c.y));
  if (r < 36.0 || r > 100.0) return false;
  // keep the door side of the hull open
  if (c.y > AW - 4.0 && abs(c.x) < AL + 14.0) return false;
  if (c.y > AW + 22.0 && hash12(cid + 7.7) < 0.55) return false;
  if (hash12(cid + 2.3) < 0.2) return false;
  if (length(c - uClear.xy) < uClear.z) return false;
  if (c.y < 0.0 && abs(c.x) < AL - 8.0 && hash12(cid + 3.3) < 0.45) return false;
  base = vec3(c.x, hillH(c) - 1.0, c.y);
  H = 20.0 + 14.0 * hash12(cid + 5.5);
  R = 3.5 + 3.0 * hash12(cid + 9.1);
  return true;
}
float cedarSD(vec3 p, vec3 b, float H, float R, float seed, out float fol) {
  vec3 q = p - b;
  float hk = sat(q.y / H);
  q.xz -= vec2(0.6, 0.22) * uSway * (sin(uTime * 0.8 + seed * 6.0) + 0.45 * sin(uTime * 2.1 + seed * 3.0)) * hk * hk;
  float rxz = length(q.xz);
  fol = 0.0;
  if (rxz > R * 2.7 + 2.0 || q.y > H + 2.0) return max(rxz - R * 2.7 - 1.0, q.y - H - 1.0);
  // the trunk, straight and tapering, a little leaning
  vec2 lean = (hash22(vec2(seed, 4.0)) - 0.5) * 0.04 * q.y;
  float tr = mix(0.7, 0.16, hk);
  float trunk = max(length(q.xz - lean) - tr, max(q.y - H * 0.92, -q.y - 2.0));
  float d = trunk;
  // tiers of level sprays from a third of the way up; uneven spacing, the top a small flat crown
  float y0 = H * (0.22 + 0.1 * hash11(seed * 5.0));
  bool nearC = length(p - uCamPos) < 70.0;   // fine detail only where it can be seen
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float u = fi / 5.0;
    float yi = y0 + (H - 0.6 - y0) * pow(u, 0.85) + (hash11(seed * 9.0 + fi) - 0.5) * 1.4;
    float dy = q.y - yi;
    if (hash11(seed * 13.0 + fi) < 0.15) continue;
    if (abs(dy) > 2.2) { d = min(d, abs(dy) - 1.6); continue; }
    float Ri = R * (1.2 - 0.6 * u) * (0.55 + 0.75 * hash11(seed * 3.0 + fi));
    vec2 off = (hash22(vec2(seed * 7.0, fi)) - 0.5) * Ri * 0.9;
    vec2 qq = q.xz - lean - off;
    float rr = length(qq);
    if (rr > Ri * 1.5 + 1.5) { d = min(d, rr - Ri * 1.5 - 0.5); continue; }
    // (edge below is capped at 1.5 Ri)
    float ang = atan(qq.y, qq.x);
    // a tier is two or three fans of level sprays reaching out at their own angles, with gaps
    // between them; feathery, ragged edges
    float fan = vnoise(vec2(ang * 1.6 + fi * 5.3, seed * 11.0 + fi)) * 0.7 + vnoise(vec2(ang * 4.0, seed * 3.0 + fi)) * 0.3;
    float lobe = 0.15 + 1.1 * smoothstep(0.25, 0.7, fan);
    float rag = vnoise(qq * 0.9 + vec2(fi * 7.0, seed * 5.0)) * 0.65 + vnoise(qq * 1.9 + seed) * 0.35;
    float fineE = nearC ? 0.25 * vnoise(qq * 3.5 + fi) + 0.12 * vnoise(qq * 9.0) : 0.185;
    float edge = min(Ri * lobe * (0.5 + 0.7 * rag + fineE), Ri * 1.5);
    float k = sat(rr / max(edge, 0.5));
    // a dense mass near the stem, thinning to level sprays that droop a little at their tips;
    // the underside hangs ragged
    float th = 0.32 + 0.3 * (1.0 - k);
    float droop = 0.7 * k * k * k;
    float under = (vnoise(qq * 1.6 + fi) - 0.5) * 0.7 + (nearC ? (vnoise(qq * 5.0) - 0.5) * 0.3 : 0.0);
    float yy = dy + droop;
    float top = th * 0.6 + 0.55 * vnoise(qq * 1.3 + fi * 4.0) * (1.0 - k * 0.5);
    float pad = max(rr - edge, yy > 0.0 ? yy - top : -yy - th - under);
    float hole = (0.3 - vnoise(qq * 0.8 + vec2(fi * 3.1, seed))) * 2.5;
    float lace = nearC ? (0.33 - vnoise(qq * 2.2 + vec2(seed, fi * 2.0))) * 1.2 : -1.0;
    pad = max(pad, max(hole * smoothstep(0.3, 0.6, k), lace * smoothstep(0.55, 0.85, k)));
    if (pad < 0.5) pad += (vnoise(vec3(qq.x, dy * 1.6, qq.y) * 2.4 + seed) - 0.5) * 0.5 + (nearC ? (vnoise(vec3(qq.x, dy, qq.y) * 6.0) - 0.5) * 0.15 : 0.0);
    pad *= 0.6;
    if (pad < d) { d = pad; fol = 1.0; }
  }
  return d;
}
float cedarsSD(vec3 p, out float fol) {
  fol = 0.0;
  vec2 g = p.xz / CS - 0.5;
  vec2 c0 = floor(g);
  float d = 1e4;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
    vec2 cid = c0 + vec2(i, j);
    vec3 b; float H, R;
    if (!cedarAt(cid, b, H, R)) continue;
    float fo;
    float dd = cedarSD(p, b, H, R, hash12(cid), fo);
    if (dd < d) { d = dd; fol = fo; }
  }
  return d;
}

// ---------- the ark ----------
vec3 leafT() { float a = radians(uDoor); return vec3(-cos(a), 0.0, sin(a)); }
vec3 leafN() { float a = radians(uDoor); return vec3(sin(a), 0.0, cos(a)); }
float leafSD(vec3 p) {
  vec3 q = p - HINGE;
  vec3 T = leafT(), N = leafN();
  vec3 l = vec3(dot(q, T) - DW - 0.15, p.y - DY0 - DH * 0.5, dot(q, N));
  return sdBox(l, vec3(DW + 0.15, DH * 0.5 + 0.12, 0.1));
}
float rampSD(vec3 p) {
  vec3 A = vec3(DX, DY0, AW + 0.2), B = vec3(DX, groundH(vec2(DX, AW + RL)) + 0.05, AW + RL);
  vec3 d = B - A; float len = length(d); d /= len;
  vec3 n = normalize(vec3(0.0, d.z, -d.y));
  vec3 q = p - (A + B) * 0.5;
  vec3 l = vec3(q.x, dot(q, n), dot(q, d));
  float deck = sdBox(l, vec3(DW - 0.1, 0.12, len * 0.5 + 0.1));
  float cz = mod(l.z, 0.5) - 0.25;
  float cleat = sdBox(vec3(l.x, l.y - 0.15, cz), vec3(DW - 0.2, 0.04, 0.045));
  cleat = max(cleat, abs(l.z) - len * 0.5 + 0.2);
  return min(deck, cleat);
}
// id: 1 pitch hull, 2 cedar trim, 3 window strip, 4 door cavity, 5 leaf, 6 ramp, 9 slipway
float arkSD(vec3 p, out int id) {
  id = 1;
  float body = sdBox(p - vec3(0.0, (AY0 + YW) * 0.5, 0.0), vec3(AL, (YW - AY0) * 0.5, AW)) - 0.03;
  float roof = max(sdTrap(vec2(p.z, p.y - (YW + YR) * 0.5), AW + 0.2, RW, (YR - YW) * 0.5), abs(p.x) - AL - 0.2);
  float win = sdBox(p - vec3(0.0, (YR + YWIN) * 0.5, 0.0), vec3(AL - 0.4, (YWIN - YR) * 0.5, RW - 0.12));
  float cap = max(sdTrap(vec2(p.z, p.y - (YWIN + YCAP) * 0.5), RW + 0.35, 0.2, (YCAP - YWIN) * 0.5), abs(p.x) - AL - 0.3);
  float hull = min(min(body, roof), cap);
  // cedar trim: corner posts, the top rail under the eaves, the eave board, a rubbing strake low down,
  // and the frames (ribs) showing as low ridges under the pitch every 4.5 m
  float corner = sdBox(vec3(abs(p.x) - AL, p.y - (AY0 + YW) * 0.5, abs(p.z) - AW), vec3(0.28, (YW - AY0) * 0.5 + 0.1, 0.28));
  float rail = sdBox(vec3(p.x, p.y - YW + 0.15, abs(p.z) - AW - 0.06), vec3(AL + 0.15, 0.2, 0.12));
  float rub = sdBox(vec3(p.x, p.y - AY0 - 0.9, abs(p.z) - AW - 0.04), vec3(AL + 0.05, 0.16, 0.08));
  float trim = min(corner, min(rail, rub));
  float rx = mod(p.x + 2.25, 4.5) - 2.25;
  float ribs = max(sdBox(vec3(rx, p.y - (AY0 + YW) * 0.5, abs(p.z) - AW), vec3(0.16, (YW - AY0) * 0.5, 0.035)), abs(p.x) - AL + 0.6);
  hull = min(hull, ribs);
  // the door: a cavity in the hull with a heavy cedar frame
  vec3 dc = p - vec3(DX, DY0 + DH * 0.5, AW);
  float cav = sdBox(dc, vec3(DW, DH * 0.5, 3.6));
  float frame = max(sdBox(dc - vec3(0.0, 0.1, 0.05), vec3(DW + 0.45, DH * 0.5 + 0.5, 0.2)), -sdBox(dc, vec3(DW, DH * 0.5, 1.0)));
  hull = max(hull, -cav);
  trim = max(trim, -cav);
  float d = hull;
  if (trim < d) { d = trim; id = 2; }
  if (frame < d) { d = frame; id = 2; }
  if (win < d) { d = win; id = 3; }
  float back = sdBox(dc - vec3(0.0, 0.0, -3.7), vec3(DW + 0.5, DH * 0.5 + 0.5, 0.1));
  if (back < d) { d = back; id = 4; }
  float lf = leafSD(p);
  if (lf < d) { d = lf; id = 5; }
  float rp = rampSD(p);
  if (rp < d) { d = rp; id = 6; }
  // the lamp posts
  for (int i = 0; i < NO; i++) {
    if (p.y > 3.0) break;
    vec3 lp = outLamp(i);
    vec3 q = p - lp;
    if (abs(q.x) > 1.0 || abs(q.z) > 1.0) continue;
    float post = max(length(q.xz) - 0.07, max(q.y + 0.1, -q.y - 3.0));
    float bowl = max(length(q - vec3(0.0, -0.05, 0.0)) - 0.16, q.y + 0.02);
    float pl = min(post, bowl);
    if (pl < d) { d = pl; id = 9; }
  }
  // the slipway: blocks on two rails under the hull
  if (p.y < AY0 + 0.1) {
    vec3 q = vec3(mod(p.x, 4.0) - 2.0, p.y - AY0 * 0.5, abs(p.z) - 6.5);
    float bk = max(sdBox(q, vec3(0.45, AY0 * 0.5, 1.3)) - 0.02, abs(p.x) - AL - 1.0);
    float rl = sdBox(vec3(p.x, p.y - 0.15, abs(p.z) - 6.5), vec3(AL + 1.5, 0.18, 0.25));
    float sw = min(bk, rl);
    if (sw < d) { d = sw; id = 9; }
  }
  return d;
}

// whole scene: 0 ground, 1..6, 9 ark, 7 cedar trunk, 8 cedar foliage
float mapA(vec3 p, out int id) {
  float g = (p.y - groundH(p.xz)) * 0.7;
  id = 0; float d = g;
  float bb = sdBox(p - vec3(2.0, 7.5, 4.0), vec3(AL + 6.0, 7.8, AW + RL + 4.0));
  if (bb < 1.0) { int ai; float a = arkSD(p, ai); if (a < d) { d = a; id = ai; } }
  else d = min(d, bb);
  float fol;
  float c = cedarsSD(p, fol);
  if (c < d) { d = c; id = fol > 0.5 ? 8 : 7; }
  return d;
}
float mapD(vec3 p) { int i; return mapA(p, i); }
vec3 normA(vec3 p, float e) {
  vec2 k = vec2(1.0, -1.0) * e;
  return normalize(k.xyy * mapD(p + k.xyy) + k.yyx * mapD(p + k.yyx) + k.yxy * mapD(p + k.yxy) + k.xxx * mapD(p + k.xxx));
}
float marchA(vec3 ro, vec3 rd, out int id) {
  float t = 0.05;
  for (int i = 0; i < 160; i++) {
    vec3 p = ro + rd * t;
    float d = mapA(p, id);
    if (abs(d) < 0.0012 * t + 0.002) return t;
    t += d * (t < 30.0 ? 0.85 : 0.95);
    if (t > 900.0 || p.y > 60.0 && rd.y > 0.0) { id = -1; return -1.0; }
  }
  vec3 p = ro + rd * t; mapA(p, id);
  return t;
}
float shadowA(vec3 p, vec3 l) {
  float r = 1.0, t = 0.3;
  for (int i = 0; i < 24; i++) {
    float d = mapD(p + l * t);
    r = min(r, 8.0 * d / t);
    t += clamp(d, 0.4, 6.0);
    if (r < 0.01 || t > 100.0) break;
  }
  return sat(r);
}
float aoA(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 3; i++) { float h = 0.3 * float(i * i); o += (h - mapD(p + n * h)) * s; s *= 0.6; }
  return sat(1.0 - o * 0.35);
}

// ---------- lights ----------
vec3 doorLightPos() { return vec3(DX, DY0 + DH * 0.6, AW - 2.2); }
float doorOpen() { return sat(uDoor / 40.0); }
// how much of the door light reaches p, through the opening and past the leaf
float doorVis(vec3 p) {
  vec3 L = doorLightPos();
  vec3 v = L - p;
  if (p.z < AW - 0.3 && p.z > AW - 3.7 && abs(p.x - DX) < DW + 0.1) return 1.0;
  if (p.z < AW) return 0.0;
  float s = (AW - p.z) / v.z;
  vec3 X = p + v * s;
  float ox = abs(X.x - DX) - DW, oy = abs(X.y - DY0 - DH * 0.5) - DH * 0.5;
  float m = smoothstep(0.3, -0.3, max(ox, oy));
  vec3 T = leafT(), N = leafN();
  float dn = dot(v, N);
  if (abs(dn) > 1e-5) {
    float sl = dot(HINGE - p, N) / dn;
    if (sl > 0.0 && sl < 1.0) {
      vec3 Y = p + v * sl; float u = dot(Y - HINGE, T);
      float ins = smoothstep(-0.15, 0.15, u) * smoothstep(2.0 * DW + 0.45, 2.0 * DW + 0.15, u) * smoothstep(DY0 - 0.3, DY0, Y.y) * smoothstep(DY0 + DH + 0.3, DY0 + DH, Y.y);
      m *= 1.0 - ins;
    }
  }
  return m;
}
vec3 lampPos(int i, out float on) {
  on = uLampP[i * 4 + 3];
  return vec3(uLampP[i * 4], uLampP[i * 4 + 1], uLampP[i * 4 + 2]);
}
vec3 goldAt(vec3 p) {
  vec3 L = doorLightPos() - p; float d2 = dot(L, L);
  return GOLD * uGold * 80.0 / (d2 + 6.0);
}
vec3 windowAt(vec3 p) {
  vec3 c = vec3(clamp(p.x, -AL, AL), (YR + YWIN) * 0.5, clamp(p.z, -RW, RW));
  vec3 L = c - p; float d2 = dot(L, L);
  return GOLD * uGold * 6.0 / (d2 + 3.0);
}
float winGlow(float x) {
  // lamps hang inside every 6 m; the strip is brighter at each
  float lamp = 0.6 + 0.4 * pow(sat(1.0 - abs(fract((x + 63.0) / 6.0) - 0.5) * 2.0), 3.0);
  return lamp * (0.85 + 0.15 * vnoise(vec2(x * 0.1, uTime * 1.5)));
}

vec3 rainLight(vec3 p) {
  vec3 c = vec3(0.07, 0.08, 0.1);
  c += goldAt(p) * doorVis(p) * 0.7;
  c += windowAt(p) * 0.35 * smoothstep(YW - 2.0, YR, p.y);
  c += vec3(0.55, 0.6, 0.85) * uFlash * 0.4;
  for (int i = 0; i < NO; i++) { vec3 L = outLamp(i) - p; c += LAMPC * 1.2 / (dot(L, L) + 0.5); }
  for (int i = 0; i < 8; i++) {
    float on; vec3 lp = lampPos(i, on);
    if (on <= 0.0) continue;
    vec3 L = lp - p; c += LAMPC * on * 0.4 / (dot(L, L) + 0.15);
  }
  return c;
}

vec3 ggx(vec3 n, vec3 v, vec3 l, float rough, vec3 f0) {
  vec3 h = normalize(l + v);
  float nl = sat(dot(n, l)), nh = sat(dot(n, h)), vh = sat(dot(v, h));
  float a = max(0.02, rough * rough), a2 = a * a;
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - vh, 5.0) * sat(f0.x * 25.0);
  return F * nl * a2 / (PI * dd * dd) * 0.25;
}

// what a glossy surface mirrors: the cloud, the window strip, the open doorway, the flash
vec3 reflEnv(vec3 p, vec3 r, bool full) {
  vec3 env = (full ? stormSky(r) : stormSkyLo(r)) * 1.4;
  float mm = sat(dot(r, normalize(uMirror)));
  env += vec3(0.30, 0.32, 0.38) * (pow(mm, 8.0) * 1.8 + pow(mm, 40.0) * 3.5) * (0.3 + 1.4 * cloudN(r)) * smoothstep(230.0, 50.0, length(p - uCamPos)) * (1.0 - step(0.0, -r.y));
  // the window strip (either side)
  float zs = sign(p.z + 1e-4) * RW;
  if (abs(p.z) > RW && r.z * sign(p.z) < -1e-4 && p.y < YWIN + 0.5) {
    float tw = (zs - p.z) / r.z;
    vec3 w = p + r * tw;
    if (tw > 0.0 && w.y > YR && w.y < YWIN && abs(w.x) < AL - 0.4) {
      float lat = smoothstep(0.02, 0.0, abs(fract(w.x / 0.4) - 0.5) - 0.42);
      env = GOLD * uGold * winGlow(w.x) * 3.0 * (1.0 - 0.7 * lat);
    }
  }
  // the lamps on their posts, small and sharp
  for (int i = 0; i < NO; i++) {
    vec3 oc = outLamp(i) + vec3(0.0, 0.12, 0.0) - p; float tc = dot(oc, r);
    if (tc < 0.0) continue;
    float h = sqrt(max(dot(oc, oc) - tc * tc, 0.0));
    env += LAMPC * outFlick(i) * (4.0 * exp(-h / (0.05 + tc * 0.004)) + 0.3 * exp(-h / (0.4 + tc * 0.02)));
  }
  // the open doorway (from in front of the hull)
  if (p.z > AW + 0.1 && r.z < -1e-4) {
    float tw = (AW - p.z) / r.z;
    vec3 w = p + r * tw;
    if (abs(w.x - DX) < DW && w.y > DY0 && w.y < DY0 + DH) env = GOLD * uGold * 1.4 * doorOpen() * (0.7 + 0.3 * smoothstep(DY0 + DH, DY0, w.y));
  }
  return env;
}

// light falling on a surface point
vec3 lightAt(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float f0s, float ao, float sss) {
  vec3 f0 = vec3(f0s);
  vec3 col = vec3(0);
  vec3 sky = vec3(0.16, 0.18, 0.24) * (0.5 + 0.5 * n.y);
  col += alb * sky * ao;
  // the moon behind the cloud: a soft cold key from high in front-left
  vec3 ml = normalize(uMoonDir);
  col += vec3(0.42, 0.46, 0.6) * (alb * sat(dot(n, ml) * 0.7 + 0.3) / PI * 2.0 + ggx(n, v, ml, max(rough, 0.2), f0) * 1.5) * ao;
  if (uFlash > 0.01) {
    vec3 l = normalize(uLightDir);
    float sh = shadowA(p + n * 0.05, l);
    vec3 fl = vec3(0.6, 0.65, 0.85) * uFlash * 0.9;
    col += fl * sh * (alb * (sat(dot(n, l)) + sss * 0.4) / PI * 3.0 + ggx(n, v, l, rough, f0) * 3.0);
    col += alb * fl * 0.06 * ao;
  }
  // the gold of the door
  float dv = doorVis(p);
  if (dv > 0.0 && uGold > 0.0) {
    vec3 L = doorLightPos() - p; float d2 = dot(L, L); vec3 l = L * inversesqrt(d2);
    vec3 lc = GOLD * uGold * 160.0 / (d2 + 6.0) * dv;
    col += lc * (alb * (sat(dot(n, l)) + sss * 0.5) / PI + ggx(n, v, l, rough, f0));
  }
  // gold thrown back off the ramp and the lit ground onto the hull beside the door
  if (uGold > 0.0 && abs(p.z) > AW - 0.1 && p.z > 0.0) {
    vec3 gp = vec3(DX, 0.3, AW + 3.5);
    vec3 L = gp - p; float d2 = dot(L, L); vec3 l = L * inversesqrt(d2);
    col += GOLD * uGold * doorOpen() * 6.0 / (d2 + 4.0) * (alb * sat(dot(n, l)) / PI + ggx(n, v, l, max(rough, 0.15), f0) * 0.6);
  }
  // the window strip under the ridge (the roof, the cap, the crowns of the cedars)
  if (p.y > YW - 6.0 && uGold > 0.0 && !(abs(p.z) < AW + 0.8 && abs(p.x) < AL + 0.8 && p.y < YW - 0.2)) {
    vec3 c = vec3(clamp(p.x, -AL + 0.6, AL - 0.6), (YR + YWIN) * 0.5, sign(p.z) * min(abs(p.z), RW - 0.3));
    vec3 L = c - p; float d2 = dot(L, L); vec3 l = L * inversesqrt(d2);
    float face = abs(p.z) < RW + 0.1 ? 1.0 : sat(sign(p.z) * -l.z * 1.0 + 0.3);
    vec3 lc = GOLD * uGold * 30.0 * winGlow(p.x) / (d2 + 2.0) * face;
    col += lc * (alb * (sat(dot(n, l)) + sss * 0.4) / PI + ggx(n, v, l, rough, f0));
  }
  for (int i = 0; i < NO; i++) {
    vec3 L = outLamp(i) + vec3(0.0, 0.12, 0.0) - p; float d2 = dot(L, L);
    if (d2 > 2500.0) continue;
    vec3 l = L * inversesqrt(d2);
    vec3 lc = LAMPC * 6.0 * outFlick(i) / (d2 + 0.3);
    col += lc * (alb * (sat(dot(n, l)) + sss * 0.4) / PI + ggx(n, v, l, rough, f0));
  }
  for (int i = 0; i < 8; i++) {
    float on; vec3 lp = lampPos(i, on);
    if (on <= 0.0) continue;
    vec3 L = lp - p; float d2 = dot(L, L); vec3 l = L * inversesqrt(d2);
    vec3 lc = LAMPC * on * 2.2 / (d2 + 0.05) * (0.9 + 0.1 * vnoise(vec2(uTime * 9.0, float(i))));
    col += lc * (alb * sat(dot(n, l)) / PI + ggx(n, v, l, rough, f0));
  }
  return col;
}

// a carried lamp: a small clay lamp, its flame and the glow a lens sees round it
vec3 lampsGlow(vec3 ro, vec3 rd, float depth) {
  vec3 acc = vec3(0);
  for (int i = 0; i < NO; i++) {
    vec3 c = outLamp(i) + vec3(0.0, 0.12, 0.0);
    vec3 oc = c - ro; float tc = dot(oc, rd);
    if (tc < 0.0 || tc > depth + 0.4) continue;
    float h = sqrt(max(dot(oc, oc) - tc * tc, 0.0));
    float px = tc * 0.0012;
    vec3 x = ro + rd * tc - c;
    float flame = smoothstep(0.09, 0.03, length(vec3(x.x, (x.y - 0.06) * 0.55, x.z))) * step(-0.05, x.y);
    acc += (vec3(1.0, 0.75, 0.4) * flame * 12.0 + LAMPC * outFlick(i) * (1.2 * exp(-h / max(0.06, px * 1.5)) + 0.2 * exp(-h / 0.6) + 0.025 * exp(-h / 3.0)));
  }
  for (int i = 0; i < 8; i++) {
    float on; vec3 lp = lampPos(i, on);
    if (on <= 0.0) continue;
    vec3 oc = lp - ro; float tc = dot(oc, rd);
    if (tc < 0.0 || tc > depth + 0.3) continue;
    float h = sqrt(max(dot(oc, oc) - tc * tc, 0.0));
    float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 11.0, float(i) * 5.0));
    vec3 fp = lp + vec3(0.0, 0.07, 0.0);
    vec3 of = fp - ro; float tf = dot(of, rd); vec3 x = ro + rd * tf - fp;
    float fd = length(vec2(x.x, x.z)) / (0.035 * (1.0 - sat(x.y / 0.14)) + 0.004);
    float flame = smoothstep(1.2, 0.4, fd) * smoothstep(-0.03, 0.0, x.y) * smoothstep(0.15, 0.08, x.y);
    vec3 ob = lp - ro; float tb = dot(ob, rd); vec3 xb = ro + rd * tb - lp;
    float body = smoothstep(0.012, 0.0, length(xb * vec3(1.0, 2.2, 1.0)) - 0.06) * step(xb.y, 0.02);
    acc = mix(acc, vec3(0.25, 0.12, 0.05) * on, body * on);
    float px = tc * 0.0012;
    acc += (vec3(1.0, 0.75, 0.4) * flame * 30.0 + LAMPC * (3.0 * exp(-h / max(0.035, px)) + 0.25 * exp(-h / 0.35) + 0.03 * exp(-h / 1.5))) * on * fl;
  }
  return acc;
}

vec3 cedarWood(vec2 g, float seed) {
  float grain = fbm(vec2(g.x * 0.7, g.y * 14.0) + seed, 4);
  return vec3(0.42, 0.23, 0.10) * (0.6 + 0.65 * grain);
}

// the pitch over the strakes: albedo, roughness and the bumped normal
void pitchSurface(vec3 p, inout vec3 n, float t, out vec3 alb, out float rough) {
  vec3 an = abs(n);
  bool roof = p.y > YW - 0.05 && an.y > 0.4;
  float sy = roof ? (AW - abs(p.z)) * 1.1 : p.y - AY0;
  float sx = an.x > 0.6 ? p.z : p.x;
  vec3 T = an.x > 0.6 ? vec3(0, 0, 1) : vec3(1, 0, 0);
  vec3 B = normalize(cross(n, T)); if (B.y < 0.0 && !roof) B = -B;
  if (roof && dot(B, vec3(0.0, 0.0, -sign(p.z))) < 0.0) B = -B;
  float lod = smoothstep(110.0, 8.0, t);
  // strakes of varied widths: some rows split, some wide
  float yy = sy + 0.06 * sin(sy * 2.7) + 0.035 * sin(sy * 6.9 + 1.0);
  float row0 = floor(yy / 0.42);
  float split = step(0.55, hash11(row0 * 3.1));
  float w = split > 0.5 ? 0.21 : 0.42;
  float row = floor(yy / w) + split * 500.0, lap = fract(yy / w);
  float bl = 6.0 + 5.0 * hash11(row * 3.7);
  float bu = (sx + hash11(row) * 9.0) / bl, bi = floor(bu), bf = fract(bu);
  // each board tilted and twisted a little, so each catches the light its own way
  float tilt = 0.05 + 0.05 * hash11(row * 5.1) + 0.012 * hash11(row * 5.1 + bi * 1.3) + 0.035 * lap;
  float twist = (hash11(row * 2.3 + bi * 7.1) - 0.5) * 0.02;
  float seam = smoothstep(0.08, 0.0, lap) + 0.5 * smoothstep(0.012, 0.0, min(bf, 1.0 - bf) * bl);
  // brush strokes along the boards, and slow runs of pitch hanging from each seam
  float br = fbm(vec2(sx * 1.6, sy * 18.0 + row), 3);
  float dc = floor(sx * 6.0), dh = hash11(dc * 1.7 + row * 31.0);
  float runL = 0.2 + 0.7 * dh;
  float run = step(0.72, dh) * smoothstep(runL, 0.0, 1.0 - lap) * smoothstep(0.05, 0.0, abs(fract(sx * 6.0) - 0.5) - 0.06);
  float dU = (br - 0.5) * 0.05 * lod + (fract(sx * 6.0) - 0.5) * run * 1.2 * lod + twist * (bf - 0.5) * lod * 2.0;
  float dV = -tilt * lod - seam * 0.6 * lod + (vnoise(vec2(sx * 0.8, sy * 9.0)) - 0.5) * 0.08 * lod;
  n = bumpN(n, T, B, dU, dV);
  alb = vec3(0.012, 0.010, 0.008) * (0.8 + 0.5 * br);
  float satin = smoothstep(0.45, 0.78, fbm(vec2(sx, sy) * 0.3 + row * 0.13, 4));
  rough = mix(0.06 + 0.06 * br, 0.3, satin) * mix(1.0, 0.75, uWet) + seam * 0.25;
  // the cedar showing through where the pitch is worn: low down, at the corners, along seams
  float wear = smoothstep(0.74, 0.9, fbm(vec2(sx * 2.5, sy * 0.6), 4) + 0.25 * smoothstep(0.8, 0.0, sy) + 0.35 * smoothstep(1.4, 0.0, AL - abs(p.x)) + 0.12 * seam) * lod * 0.8;
  if (wear > 0.0) { alb = mix(alb, cedarWood(vec2(sx, sy), row) * 0.75, wear); rough = mix(rough, 0.7, wear); }
}

vec3 arkScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  int id;
  float t = marchA(ro, rd, id);
  vec3 col; float depth = 2000.0;
  if (t > 0.0) {
    depth = t;
    vec3 p = ro + rd * t;
    vec3 n = normA(p, 0.002 + t * 0.0006);
    vec3 v = -rd;
    float ao = aoA(p, n);
    vec3 alb = vec3(0.1); float rough = 0.6, f0 = 0.04, sss = 0.0; vec3 emit = vec3(0);
    float wet = uWet;
    float refl = 0.0;
    if (id == 0) {
      float lod = smoothstep(90.0, 6.0, t);
      // grass: blades combed by the wind (streaks along the wind), darker tufts and bare patches
      vec2 wd = normalize(vec2(1.0, 0.35));
      vec2 gq = vec2(dot(p.xz, wd), dot(p.xz, vec2(-wd.y, wd.x)));
      float comb = 0.35 * uSway * sin(uTime * 1.6 + gq.x * 0.25 + gq.y * 0.1);
      float blades = vnoise(vec2(gq.x * 3.0 + comb, gq.y * 26.0)) * 0.55 + vnoise(vec2(gq.x * 7.0, gq.y * 61.0) + 3.0) * 0.45;
      blades = mix(0.5, blades, lod);
      float tuft = fbm(p.xz * 0.45, 4);
      float gust = smoothstep(0.55, 0.9, vnoise(vec2(p.x * 0.05 - uTime * 0.9 * uSway, p.z * 0.08)));
      alb = mix(vec3(0.10, 0.12, 0.065), vec3(0.20, 0.20, 0.11), tuft) * (0.45 + 0.9 * blades);
      vec3 T = vec3(wd.x, 0.0, wd.y), B = vec3(-wd.y, 0.0, wd.x);
      n = bumpN(n, T, B, (blades - 0.5) * 0.5 * lod, (vnoise(vec2(gq.x * 5.0, gq.y * 40.0) + 9.0) - 0.5) * 0.9 * lod);
      // the trodden way and the apron before the ramp: mud, stones and puddles
      float apron = smoothstep(7.0, 2.5, length((p.xz - vec2(DX, AW + RL + 3.0)) * vec2(0.6, 0.5)));
      float path = smoothstep(3.6, 1.2, abs(p.x - DX - 0.12 * (p.z - AW - RL))) * smoothstep(AW + RL - 2.0, AW + RL + 1.0, p.z) * smoothstep(110.0, 70.0, p.z);
      float slip = smoothstep(3.0, 0.5, max(abs(p.x) - AL, abs(p.z) - AW)) * 0.8;
      float mud = sat(max(max(apron, path), slip) + (fbm(p.xz * 0.9, 3) - 0.5) * 0.6 * max(apron, path));
      vec3 mudA = vec3(0.11, 0.08, 0.055) * (0.7 + 0.5 * fbm(p.xz * 3.0, 3));
      // ruts of the carts that brought the timber
      float rut = smoothstep(0.25, 0.0, abs(abs(p.x - DX - 0.12 * (p.z - AW - RL)) - 1.1)) * path;
      mudA *= 1.0 - 0.3 * rut;
      alb = mix(alb, mudA, mud);
      // stones half sunk in the ground
      vec2 sv = voronoiEdge(p.xz * 1.1);
      float stone = step(0.93, hash12(vec2(sv.y * 91.0, 3.0))) * smoothstep(0.05, 0.2, sv.x) * lod;
      alb = mix(alb, vec3(0.09, 0.088, 0.085) * (0.6 + 0.6 * hash12(vec2(sv.y, 9.0))), stone);
      rough = mix(mix(0.85, 0.42, wet), 0.3, stone * wet);
      f0 = 0.02 * wet;
      // puddles: in the mud mostly, mirrors with rain rings
      float pud = smoothstep(0.56, 0.62, fbm(p.xz * 0.55 + 3.0, 3) + 0.15 * mud + 0.08 * rut) * (0.45 + 0.55 * mud) * smoothstep(0.2, 0.6, wet) * smoothstep(0.96, 0.99, n.y + 0.03) * (1.0 - stone);
      alb = mix(alb * (1.0 - 0.45 * wet), vec3(0.01), pud);
      rough = mix(rough, 0.02, pud);
      f0 = mix(f0, 0.02, pud);
      n = normalize(mix(n, vec3(0, 1, 0), pud));
      if (pud > 0.01 && uRain > 0.0) {
        for (int k = 0; k < 2; k++) {
          vec2 qq = p.xz * (2.6 + float(k) * 1.7) + float(k) * 7.0;
          vec2 cell = floor(qq); vec2 fq = fract(qq) - 0.5 - (hash22(cell) - 0.5) * 0.5;
          float ph = fract(uTime * 1.4 + hash12(cell));
          float rr = length(fq) - ph * 0.45;
          float ring = sin(rr * 55.0) * exp(-ph * 3.5) * smoothstep(0.1, 0.0, abs(rr));
          n = normalize(n + vec3(fq.x, 0.0, fq.y) * ring * 0.9 * pud * uRain);
        }
      }
      refl = max(pud, 0.6 * wet * (1.0 - stone));
      rough = mix(rough, 0.25, wet * (1.0 - pud) * 0.6);
      alb *= mix(1.0, 0.7, smoothstep(-10.0, -40.0, p.y));
    } else if (id == 1) {
      bool ribSide = abs(n.x) > 0.6 && abs(p.x) < AL - 0.5;
      pitchSurface(p, n, t, alb, rough);
      f0 = 0.05; refl = ribSide ? 0.0 : 1.0;
      if (ribSide) { rough = 0.8; f0 = 0.02; }
    } else if (id == 2 || id == 6 || id == 5 || id == 9) {
      vec2 g = abs(n.y) > 0.5 ? p.xz : (abs(n.z) > 0.5 ? vec2(p.x, p.y) : vec2(p.z, p.y));
      if (abs(n.x) < 0.5 && abs(p.x) > AL - 0.4) g = vec2(p.y, p.x + p.z);
      if (id == 6) g = vec2(p.z * 1.1, p.x);
      alb = cedarWood(g, float(id));
      rough = mix(0.65, 0.35, wet);
      f0 = 0.04;
      if (id == 2 && abs(p.x - DX) > DW + 1.0) {
        // the rails and rubbing strake are pitched too; cedar shows where it is worn
        float worn = smoothstep(0.42, 0.66, fbm(vec2(p.x * 1.3 + p.z, p.y * 1.7), 4) + 0.2 * smoothstep(1.0, 0.0, AL - abs(p.x)));
        alb = mix(vec3(0.014, 0.012, 0.01), alb * 0.85, worn);
        rough = mix(0.12, rough, worn); f0 = 0.05; refl = 1.0 - worn;
      }
      if (id == 5) {
        // the leaf: pitched on its outer face, planked cedar on its inner face
        vec3 N = leafN();
        float outside = step(0.0, dot(n, N));
        float u = dot(p - HINGE, leafT());
        float plank = smoothstep(0.03, 0.0, abs(fract(u / 0.32) - 0.5) - 0.46);
        alb = cedarWood(vec2(p.y, u), 9.0) * (1.0 - 0.45 * plank);
        // iron-hard bands across it, and the wet
        float band = smoothstep(0.08, 0.0, abs(fract((p.y - DY0) / (DH / 3.0)) - 0.5) - 0.42);
        alb *= 1.0 - 0.5 * band;
        if (outside > 0.5) {
          alb = vec3(0.013, 0.011, 0.009) * (1.0 + plank * 1.5); rough = 0.12 + 0.2 * plank; f0 = 0.05; refl = 1.0;
          n = normalize(n + leafT() * (fract(u / 0.32) - 0.5) * 0.12);
        }
      }
      if (id == 9) { alb *= 0.5; rough = 0.8; }
      if (id == 6) {
        // the ramp is trodden and wet: the lamplight lies along each cleat
        alb *= 0.85; rough = mix(0.5, 0.2, wet); refl = 0.4 * wet;
      }
      sss = 0.1;
    } else if (id == 3) {
      // the window strip: lamplight through a lattice of laths, mullions every 1.6 m
      float lat = smoothstep(0.02, 0.0, abs(fract(p.x / 0.4) - 0.5) - 0.42);
      float mull = step(abs(mod(p.x, 1.6) - 0.8), 0.1);
      float vy = sat((p.y - YR) / CU);
      emit = mix(vec3(1.0, 0.55, 0.25), GOLD, vy) * uGold * winGlow(p.x) * 2.6 * (1.0 - 0.7 * lat) * (1.0 - 0.9 * mull);
      alb = vec3(0.3, 0.17, 0.08); rough = 0.7;
    } else if (id == 4) {
      vec2 q = p.xy - vec2(DX, DY0 + DH * 0.5);
      alb = vec3(0.4, 0.22, 0.1);
      emit = GOLD * uGold * (0.5 + 0.5 * smoothstep(3.5, 0.0, length(q * vec2(0.6, 0.8))));
    } else if (id == 7) {
      // cedar trunk: dark furrowed bark, wet
      float b = fbm(vec2(atan(p.x, p.z) * 6.0, p.y * 0.8), 4);
      alb = vec3(0.07, 0.05, 0.035) * (0.6 + 0.8 * b);
      rough = mix(0.8, 0.45, wet);
    } else {
      // cedar sprays: dense dark blue-green needles, paler at the tips that catch the light
      float b = vnoise(p * 3.0);
      alb = vec3(0.022, 0.035, 0.028) * (0.6 + 0.8 * b) * (1.0 + 0.6 * smoothstep(0.3, 1.0, n.y));
      rough = 0.7; sss = 0.35;
    }
    // inside the doorway: the hold's own warm light on its timbers
    bool inside = false;
    if (p.z < AW - 0.05 && abs(p.x - DX) < DW + 0.05 && p.y > DY0 - 0.1 && p.y < DY0 + DH + 0.1 && id != 5 && id != 6) {
      float deep = sat((AW - p.z) / 3.6);
      float g = vnoise(vec2(p.y * 6.0, p.z * 0.5 + p.x)) * 0.3 + 0.7;
      vec2 dq = vec2(p.x - DX, p.y - DY0 - 1.8);
      float pool = exp(-dot(dq, dq) / 7.0);
      emit = vec3(1.0, 0.52, 0.17) * uGold * (0.12 + 0.35 * deep + 0.6 * pool * deep) * g;
      emit *= 0.55 + 0.45 * smoothstep(0.02, 0.07, abs(fract(p.y / 0.42) - 0.5));
      emit *= 1.0 - 0.6 * smoothstep(0.12, 0.05, abs(fract(p.z / 1.1) - 0.5) - 0.38) * step(DW - 0.1, abs(p.x - DX));
      inside = true;
    }
    col = inside ? emit : emit + lightAt(p, n, v, alb, rough, f0, ao, sss);
    // mirrored light in the wet pitch, the wet timber and the puddles: long streaks of cloud and gold
    if (refl > 0.0 && !inside) {
      vec3 r = reflect(rd, n);
      if (r.y < 0.0 && id != 0) r.y *= -0.3;
      vec3 env = reflEnv(p + n * 0.05, r, id == 1 || id == 5 || (id == 0 && refl > 0.7));
      float F = f0 + (1.0 - f0) * pow(1.0 - sat(dot(n, v)), 5.0);
      col += env * F * refl * sat(1.0 - rough * 2.2) * mix(0.5, 1.0, ao);
    }
  } else {
    col = stormSky(rd);
  }
  // haze: night air thick with rain, with the gold hanging in it near the door
  float fogD = 0.0012 + 0.0022 * uRain;
  float sheet = rainSheets(rd);
  fogD *= 0.7 + 0.9 * sheet * uRain;
  float fo = t > 0.0 ? 1.0 - exp(-min(depth, 1500.0) * fogD) : 0.35 * smoothstep(0.25, 0.0, rd.y) * (0.5 + uRain);
  vec3 fogC = vec3(0.045, 0.052, 0.07) + vec3(0.5, 0.55, 0.75) * uFlash * 0.12;
  col = mix(col, fogC, fo);
  {
    vec3 c = doorLightPos() + vec3(0.0, 0.0, 2.8);
    vec3 oc = c - ro; float tc = dot(oc, rd); float h = max(sqrt(max(dot(oc, oc) - tc * tc, 1e-4)), 2.5);
    float g = (atan((min(depth, 400.0) - tc) / h) + atan(tc / h)) / h;
    col += GOLD * uGold * doorOpen() * g * (0.006 + 0.02 * uRain);
    vec3 wc = vec3(clamp(ro.x + rd.x * max(tc, 0.0), -AL, AL), (YR + YWIN) * 0.5, 0.0);
    vec3 ow = wc - ro; float tw = dot(ow, rd); float hw = sqrt(max(dot(ow, ow) - tw * tw, 1e-4));
    if (tw > 0.0 && tw < depth + 3.0) col += GOLD * uGold * (exp(-hw / 2.5) * 0.05 + exp(-hw / 12.0) * 0.012) * (0.6 + uRain);
  }
  col += boltGlow(ro, rd, depth);
  col += lampsGlow(ro, rd, depth);
  // the last of the gold: as the leaf meets the frame, light holds in one upright seam at its free edge
  float seamK = smoothstep(18.0, 3.0, uDoor) * sat(uDoor / 0.6) * uGold;
  if (seamK > 0.001) {
    vec3 a0 = vec3(DX - DW - 0.05, DY0 + 0.05, AW + 0.36), a1 = vec3(DX - DW - 0.05, DY0 + DH - 0.05, AW + 0.36);
    vec3 u = a1 - a0, w0 = ro - a0;
    float b = dot(rd, u), c2 = dot(u, u), d0 = dot(rd, w0), e = dot(u, w0);
    float den = c2 - b * b;
    float sc = clamp((b * e - c2 * d0) / max(den, 1e-5), 0.0, 1e5), tcs = clamp((e + b * sc) / c2, 0.0, 1.0);
    if (sc < depth + 0.6) {
      float dd = length(ro + rd * sc - (a0 + u * tcs));
      float px = sc * 0.0012;
      float wdt = 0.004 + 0.012 * min(uDoor, 6.0);
      col += vec3(1.0, 0.68, 0.32) * seamK * (5.0 * exp(-dd / max(wdt, px)) + 0.25 * exp(-dd / 0.25) + 0.03 * exp(-dd / 1.4));
    }
  }
  col += rainStreaks(ro, rd, depth);
  return whiteOut(col);
}
`;
