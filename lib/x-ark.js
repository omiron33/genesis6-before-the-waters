// The ark on Noe's hill at night (s29 cubits, s30 narrow, s31 door). One shared world:
// a long box hull 300 x 50 x 30 cubits (1 cubit = 0.4572 m) of cedar strakes coated in glossy black
// pitch, cedar showing at the corner posts, the top rail, the roof eaves, the door frame and ramp.
// Flat bottom on a slipway of timber blocks, vertical sides, the roof narrowing to a clerestory: a
// continuous window strip one cubit high just below the ridge cap, glowing warm from inside. One large
// door in the side near the middle (door leaf swung open flat against the hull, its cedar face out) with
// a cleated ramp to the ground. Inside: three decks with posts, beams, stalls, hay and jars, lamps.
// Around it: the hilltop of trodden earth, tall straight cedars, lamps on posts, the far plain with the
// valley's fires, the storm sky. Length along x (bow +x), width along z (door side +z), ground y = 0.
// Uniforms: uLine (x length, y width, z height: 0..1 how far each measure line is drawn), uCubit (the
// cubit mark at the window), uDeck (lower, second, third: interior lamps lit), uCut (x below which the
// near side wall is cut away), uInside (1 to shade the interior lamps at all).
import { YARD_COMMON, YARD_MARCH, YARD_UNIFORMS } from './x-yard.js';

export const CU = 0.4572;
export const ARK = {
  hx: 150 * CU, hz: 25 * CU, y0: 1.2, H: 30 * CU,
  get top() { return this.y0 + this.H; },
};
export const DOORX = 6.0;
// the measure lines (world endpoints): length along the near bottom edge, width across the bow foot,
// height up the near bow corner
const e = 0.35;
export const LINES = {
  len: [[-ARK.hx, ARK.y0, ARK.hz + e], [ARK.hx, ARK.y0, ARK.hz + e]],
  wid: [[ARK.hx + e, ARK.y0, ARK.hz], [ARK.hx + e, ARK.y0, -ARK.hz]],
  hei: [[ARK.hx + e, ARK.y0, ARK.hz + e], [ARK.hx + e, ARK.y0 + ARK.H, ARK.hz + e]],
};
export const ARK_UNIFORMS = { ...YARD_UNIFORMS, uLine: [0, 0, 0], uCubit: 0, uDeck: [0, 0, 0], uCut: -1000, uInside: 0, uLineGlow: 1, uMoonI: 0.12 };

const f = (v) => v.toFixed(4);
const v3 = (a) => `vec3(${a.map(f).join(', ')})`;

export const ARK_GLSL = YARD_COMMON + /* glsl */ `
uniform vec3 uLine;
uniform float uCubit;
uniform vec3 uDeck;
uniform float uCut, uInside, uLineGlow, uMoonI;

const float CU = ${f(CU)};
const float HX = ${f(ARK.hx)}, HZ = ${f(ARK.hz)}, Y0 = ${f(ARK.y0)};
const float HW = Y0 + 11.0;             // top of the side walls
const float YR = Y0 + 12.8;             // foot of the window strip
const float ZC = 2.6;                   // half width of the clerestory
const float YW = YR + CU;               // top of the window (a cubit)
const float YT = Y0 + ${f(ARK.H)};      // the ridge
const float TH = 0.35;                  // hull wall thickness
const float DX = ${f(DOORX)};           // door centre along x
const float DW = 2.3, DB = Y0 + 0.35, DT = Y0 + 4.5;   // door half width, sill, head
const float F1 = Y0 + 0.35, F2 = Y0 + 4.0, F3 = Y0 + 7.65; // deck floors
const vec3 LA0 = ${v3(LINES.len[0])}, LA1 = ${v3(LINES.len[1])};
const vec3 LB0 = ${v3(LINES.wid[0])}, LB1 = ${v3(LINES.wid[1])};
const vec3 LC0 = ${v3(LINES.hei[0])}, LC1 = ${v3(LINES.hei[1])};

// outdoor lamps on posts along the door side, and two by the bow
#define NO 12
vec3 outLamp(int i) {
  if (i == 11) return vec3(DX - DW - 0.9, DT - 0.2, HZ + 0.55);
  if (i == 10) return vec3(89.2, 1.12, 31.6);
  if (i == 8) return vec3(62.0, 2.7, 46.0);
  if (i == 9) return vec3(84.0, 2.7, 62.0);
  if (i == 6) return vec3(HX + 5.0, 2.7, HZ + 6.0);
  if (i == 7) return vec3(HX + 5.0, 2.7, -HZ - 3.0);
  return vec3(-56.0 + 22.0 * float(i) + (i == 2 ? -14.0 : 0.0), 2.7, HZ + 5.5 + (i == 3 ? 3.5 : 0.0));
}
// interior lamps: per deck, along the middle, every 6 m
float deckY(int d) { return d == 0 ? F1 : (d == 1 ? F2 : F3); }
vec3 inLamp(int d, int k) { return vec3(-63.0 + 6.0 * float(k), deckY(d) + 2.55, 0.0 + (k % 2 == 0 ? 2.0 : -2.0)); }
// interior light level of deck d at x (the door's surroundings always lit; the rest as named)
float deckLit(int d, float x) {
  float named = d == 0 ? uDeck.x : (d == 1 ? uDeck.y : uDeck.z);
  float nearDoor = d == 0 ? smoothstep(-6.0, 0.0, x) * (1.0 - smoothstep(22.0, 30.0, x)) : 0.0;
  return max(named, nearDoor);
}

// ---------------- the hull ----------------
vec2 cedarAt(int i) {
  float fi = float(i);
  float a = fi * 0.571 + 0.3 + (fi > 5.0 ? 2.6 : 0.0);
  vec2 tc = vec2(cos(a) * (95.0 + 22.0 * hash11(fi)), sin(a) * (52.0 + 18.0 * hash11(fi * 3.0)));
  if (i == 0) tc = vec2(118.0, -30.0);
  if (i == 1) tc = vec2(-104.0, -38.0);
  if (i == 2) tc = vec2(-120.0, 18.0);
  if (tc.x > 55.0 && tc.y > 5.0) return vec2(1e4);
  return tc;
}
float cedarH(int i) { return 20.0 + 14.0 * hash11(float(i) * 7.0); }
float roofPrism(vec3 p) {
  vec2 q = vec2(abs(p.z), p.y);
  vec2 n = normalize(vec2(YR - HW, HZ - ZC));
  float slope = dot(q - vec2(HZ, HW), n);
  return max(max(abs(p.x) - HX, max(p.y - YR, HW - p.y)), slope);
}
float capPrism(vec3 p) {
  vec2 q = vec2(abs(p.z), p.y);
  vec2 n = normalize(vec2(YT - YW, ZC + 0.25));
  float slope = dot(q - vec2(ZC + 0.25, YW), n);
  return max(max(abs(p.x) - HX - 0.3, max(p.y - YT, YW - p.y)), slope);
}
// solid outer volume of the hull (for cheap far tests)
float hullOuter(vec3 p) {
  float body = sdBox(p - vec3(0.0, (Y0 + HW) * 0.5, 0.0), vec3(HX, (HW - Y0) * 0.5, HZ));
  float roof = roofPrism(p);
  float cl = sdBox(p - vec3(0.0, (YR + YW) * 0.5, 0.0), vec3(HX, CU * 0.5, ZC));
  return min(min(body, roof), min(cl, capPrism(p)));
}

// interior furniture of the decks (posts, beams, stalls, hay, jars), only inside
float interior(vec3 p, out float m) {
  m = 30.0;
  float d = 1e9;
  // deck floors (the lowest is the hull bottom's inner face)
  float fl = 1e9;
  for (int i = 1; i < 3; i++) fl = min(fl, abs(p.y - deckY(i) + 0.12) - 0.12);
  fl = max(fl, max(abs(p.x) - HX + TH, abs(p.z) - HZ + TH));
  if (fl < d) { d = fl; m = 30.0; }
  // posts in two rows and beams under each floor
  vec3 q = p; q.x = mod(p.x + 1.5, 6.0) - 3.0;
  float post = sdBox(vec3(q.x, p.y - (Y0 + HW) * 0.5, abs(p.z) - 5.0), vec3(0.16, (HW - Y0) * 0.5, 0.16));
  float beam = 1e9;
  for (int i = 1; i < 3; i++) beam = min(beam, sdBox(vec3(p.x, p.y - deckY(i) + 0.38, abs(p.z) - 5.0), vec3(HX - TH, 0.14, 0.13)));
  beam = min(beam, sdBox(vec3(p.x, p.y - HW + 0.2, abs(p.z) - 5.0), vec3(HX - TH, 0.14, 0.13)));
  float pb = min(post, beam);
  if (pb < d) { d = pb; m = 31.0; }
  // stalls along both walls on every deck: low partitions every 3 m
  float dy = p.y < F2 ? p.y - F1 : (p.y < F3 ? p.y - F2 : p.y - F3);
  vec3 s = vec3(mod(p.x, 3.0) - 1.5, dy - 0.65, abs(p.z) - (HZ - TH - 2.2));
  float st = sdBox(s, vec3(0.04, 0.65, 2.2));
  float rail = sdBox(vec3(p.x, dy - 1.3, abs(p.z) - (HZ - TH - 4.4)), vec3(HX - TH, 0.05, 0.05));
  float sr = min(st, rail);
  if (sr < d) { d = sr; m = 32.0; }
  // hay heaped in the lower stalls, and a trough at the front of each
  if (p.y < F2) {
    float hay = (p.y - F1) - 0.25 - 0.55 * fbm(p.xz * 1.1 + 3.0, 3) * smoothstep(HZ - TH - 4.6, HZ - TH - 2.8, abs(p.z));
    hay = max(hay, (HZ - TH - 4.4) - abs(p.z));
    if (hay < d) { d = hay * 0.8; m = 33.0; }
    vec3 tq = vec3(mod(p.x, 3.0) - 1.5, p.y - F1 - 0.3, abs(p.z) - (HZ - TH - 4.15));
    float tr = sdBox(tq, vec3(1.2, 0.3, 0.22));
    tr = max(tr, -sdBox(tq - vec3(0.0, 0.12, 0.0), vec3(1.12, 0.3, 0.15)));
    if (tr < d) { d = tr; m = 32.0; }
  }
  // sacks of grain heaped against the posts on the second deck; coops of laths on the third
  if (p.y > F2 && p.y < F3) {
    vec3 sq = vec3(mod(p.x + 1.5, 6.0) - 3.0, p.y - F2, abs(p.z) - 5.0);
    float sk = 1e9;
    for (int i = 0; i < 4; i++) { float fi = float(i); vec3 o = vec3(-0.5 + 0.38 * fi, 0.28 + (i == 3 ? 0.42 : 0.0), 0.55 - 0.15 * fi); if (i == 3) o.x = -0.1; sk = min(sk, sdEllipsoid(sq - o, vec3(0.3, 0.26, 0.24))); }
    if (sk < d) { d = sk; m = 37.0; }
  }
  if (p.y > F3) {
    vec3 cq = vec3(mod(p.x, 3.0) - 1.5, p.y - F3 - 0.5, abs(p.z) - (HZ - TH - 2.0));
    float coop = sdBox(cq, vec3(1.1, 0.5, 1.6));
    float laths = abs(mod(cq.x + 1.1, 0.18) - 0.09) - 0.025;
    coop = max(coop, -max(sdBox(cq, vec3(1.05, 0.45, 1.65)), laths));
    if (coop < d) { d = coop; m = 32.0; }
  } else if (p.y < F3) {
    // grain jars standing in rows in the second deck's stalls
    vec3 j = vec3(mod(p.x, 1.5) - 0.75, p.y - F2, mod(abs(p.z) - (HZ - TH - 3.5), 1.2) - 0.6);
    if (abs(p.z) > HZ - TH - 4.3) {
      float jar = sdRoundCone(j, vec3(0.0, 0.25, 0.0), vec3(0.0, 0.75, 0.0), 0.26, 0.12);
      jar = smin(jar, sdSphere(j - vec3(0.0, 0.3, 0.0), 0.3), 0.1);
      jar = max(jar, -j.y + 0.02);
      if (jar < d) { d = jar; m = 34.0; }
    }
  }
  // interior lamp bodies
  return d;
}

float mapM(vec3 p, out float m) {
  // ground: the trodden hilltop, falling away beyond
  float r = length(vec2(p.x / 1.5, p.z));
  float g = p.y - 0.15 * fbm(p.xz * 0.15, 3) + max(r - 75.0, 0.0) * 0.22 + max(r - 140.0, 0.0) * 0.3;
  float d = g; m = 1.0;
  float ho = hullOuter(p);
  if (ho < 2.0) {
    // the shell: outer volume minus the inside
    float inner = sdBox(p - vec3(0.0, (Y0 + TH + HW) * 0.5, 0.0), vec3(HX - TH, (HW - Y0 - TH) * 0.5, HZ - TH));
    inner = min(inner, max(roofPrism(p) + TH, abs(p.x) - HX + TH));
    inner = min(inner, sdBox(p - vec3(0.0, (YR + YW) * 0.5 - 0.3, 0.0), vec3(HX - TH, CU * 0.5 + 0.3, ZC - 0.3)));
    float shell = max(ho, -inner);
    // the door opening
    float door = sdBox(p - vec3(DX, (DB + DT) * 0.5, HZ), vec3(DW, (DT - DB) * 0.5, 1.0));
    shell = max(shell, -door);
    // the cutaway: the near side wall removed below the eaves for x < uCut
    // (each strake ends at its own place, so the cut edge is a staggered run of plank ends)
    if (p.x < uCut + 1.0) {
      float row = floor((p.y - Y0) / 0.3);
      float cx = uCut - 0.45 * hash11(row * 1.7 + 3.0) - 0.15 * sin(row * 0.7);
      shell = max(shell, -sdBox(p - vec3(cx - 200.0, (Y0 + HW) * 0.5 + 0.2, HZ), vec3(200.0, (HW - Y0) * 0.5 - 0.2, TH * 2.0 + 0.2)));
    }
    // the window strip: recessed between mullions
    float win = sdBox(p - vec3(0.0, (YR + YW) * 0.5, 0.0), vec3(HX - 0.5, CU * 0.5 - 0.02, ZC + 0.5));
    float mull = abs(mod(p.x, 1.6) - 0.8) - 0.11;
    shell = max(shell, -max(win, -mull));
    float glaze = sdBox(p - vec3(0.0, (YR + YW) * 0.5, 0.0), vec3(HX - 0.5, CU * 0.5, ZC - 0.25));
    if (shell < d) { d = shell; m = 2.0; }
    if (glaze < d) { d = glaze; m = 3.0; }
    // cedar trim: corner posts, top rail, eave board (proud of the pitch a little)
    float cp = sdBox(vec3(abs(p.x) - HX, p.y - (Y0 + HW) * 0.5, abs(p.z) - HZ), vec3(0.22, (HW - Y0) * 0.5 + 0.05, 0.22));
    float rail = sdBox(vec3(p.x, p.y - HW + 0.2, abs(p.z) - HZ - 0.05), vec3(HX + 0.1, 0.22, 0.09));
    rail = min(rail, sdBox(vec3(abs(p.x) - HX - 0.05, p.y - HW + 0.2, p.z), vec3(0.09, 0.22, HZ + 0.1)));
    float df = sdBox(p - vec3(DX, (DB + DT) * 0.5 + 0.1, HZ + 0.1), vec3(DW + 0.3, (DT - DB) * 0.5 + 0.35, 0.16));
    df = max(df, -sdBox(p - vec3(DX, (DB + DT) * 0.5, HZ), vec3(DW, (DT - DB) * 0.5, 1.0)));
    // frames inside the planking every 1.5 m (seen where the side is cut away)
    float fx = mod(p.x, 1.5) - 0.75;
    float frame = sdBox(vec3(fx, p.y - (Y0 + HW) * 0.5, abs(p.z) - (HZ - TH - 0.1)), vec3(0.09, (HW - Y0) * 0.5, 0.1));
    if (p.z > 0.0 && p.x < uCut - 0.6 && mod(floor(p.x / 1.5), 4.0) != 0.0) frame = 1e9;
    if (frame < d) { d = frame; m = 36.0; }
    // a heavy wale (deck clamp) along the side at each deck, its end shown in section at the cut
    float wale = 1e9;
    for (int i = 1; i < 3; i++) wale = min(wale, sdBox(vec3(p.x, p.y - deckY(i) + 0.2, abs(p.z) - (HZ - TH - 0.32)), vec3(HX - TH, 0.22, 0.2)));
    if (wale < d) { d = wale; m = 36.0; }
    float trim = min(min(cp, rail), df);
    if (trim < d) { d = trim; m = 4.0; }
    // inside: decks and their furniture
    if (inner < 0.5 && uInside > 0.5) {
      float mi; float di = interior(p, mi);
      di = max(di, inner);
      if (di < d) { d = di; m = mi; }
      // the hanging interior lamps
      int dk = p.y < F2 ? 0 : (p.y < F3 ? 1 : 2);
      float kk = clamp(floor((p.x + 63.0) / 6.0 + 0.5), 0.0, 21.0);
      vec3 L = inLamp(dk, int(kk));
      vec3 ql = p - (L - vec3(0.06, 0.03, 0.0));
      float lamp = max(sdEllipsoid(ql, vec3(0.08, 0.035, 0.065)), ql.y - 0.012);
      lamp = min(lamp, sdCapsule(ql, vec3(0.0), vec3(0.0, deckY(dk) + 3.5 - L.y, 0.0), 0.004));
      if (lamp < d) { d = lamp; m = 35.0; }
    }
  } else d = min(d, ho);
  // the door leaf, swung open flat against the hull, and the ramp
  if (abs(p.z - HZ - 4.0) < 6.0 && abs(p.x - DX - 3.0) < 8.0) {
    float leaf = sdBox(p - vec3(DX + DW + 0.2 + DW + 0.05, (DB + DT) * 0.5 + 0.1, HZ + 0.42), vec3(DW + 0.1, (DT - DB) * 0.5 + 0.3, 0.1));
    if (leaf < d) { d = leaf; m = 5.0; }
    // ramp: from the sill down to the ground over 7 m
    vec3 q = p - vec3(DX, 0.0, HZ);
    float run = 7.0, rise = DB;
    float ang = atan(rise, run);
    vec2 yz = vec2(q.z, q.y);
    vec2 c = vec2(run * 0.5, rise * 0.5);
    vec2 u = vec2(cos(ang), -sin(ang)), w = vec2(sin(ang), cos(ang));
    vec2 l = vec2(dot(yz - c, u), dot(yz - c, w));
    float ramp = sdBox(vec3(q.x, l.y + 0.06, l.x), vec3(DW - 0.1, 0.12, run * 0.5 / cos(ang)));
    // cleats across it
    float cl = sdBox(vec3(q.x, l.y - 0.07, mod(l.x, 0.5) - 0.25), vec3(DW - 0.15, 0.035, 0.04));
    cl = max(cl, abs(l.x) - run * 0.5 / cos(ang) + 0.2);
    float rm = min(ramp, cl);
    if (rm < d) { d = rm; m = 6.0; }
  }
  // slipway blocks under the hull and the rails they stand on
  if (p.y < Y0 + 0.1 && abs(p.x) < HX + 2.0 && abs(p.z) < HZ) {
    vec3 q = vec3(mod(p.x, 4.0) - 2.0, p.y - Y0 * 0.5, abs(p.z) - 6.5);
    float bk = sdBox(q, vec3(0.45, Y0 * 0.5, 1.3)) - 0.02;
    float rl = sdBox(vec3(p.x, p.y - 0.18, abs(p.z) - 6.5), vec3(HX + 1.5, 0.2, 0.25));
    float sw = min(bk, rl);
    if (sw < d) { d = sw; m = 7.0; }
  }
  // cedars about the hilltop: a straight trunk carrying broken tiers of flat, layered sprays
  if (length(p.xz) > 60.0 && p.y < 45.0) {
    for (int i = 0; i < 11; i++) {
      float fi = float(i);
      vec2 tc = cedarAt(i);
      if (tc.x > 1e3) continue;
      vec2 dq = p.xz - tc;
      float rb = 9.0;
      float dd = length(dq) - rb;
      if (dd > 0.5) { d = min(d, dd); continue; }
      float h = cedarH(i);
      float gy = max(length(vec2(tc.x / 1.5, tc.y)) - 75.0, 0.0) * -0.22;
      vec3 q = p - vec3(tc.x, gy, tc.y);
      float trunk = sdCapsule(q, vec3(0.0), vec3(0.0, h, 0.0), 0.55 - 0.014 * q.y);
      if (trunk < d) { d = trunk; m = 8.0; }
      // the tiers: flat layered sprays in clumps round the trunk, some tiers broken or missing
      float tierH = 1.15 + 0.4 * hash11(fi * 3.3);
      float ti = floor((q.y - h * 0.28) / tierH + 0.5);
      for (int j = -1; j <= 1; j++) {
        float k = ti + float(j);
        if (k < 0.0) continue;
        float hy = h * 0.28 + k * tierH + 0.4 * (hash11(fi * 7.0 + k) - 0.5);
        if (hy > h + 0.8) continue;
        float u = sat((hy - h * 0.28) / (h * 0.75));
        float r = (5.5 * pow(1.0 - u, 0.75) + 1.0) * (0.75 + 0.45 * hash11(fi + k * 5.0));
        for (int c2 = 0; c2 < 4; c2++) {
          float fc = float(c2);
          if (hash11(fi * 13.0 + k * 3.1 + fc * 1.7) < 0.22) continue;        // a gap in the tier
          float a0 = 6.283 * hash11(fi * 5.0 + k * 2.0) + fc * 1.571 + 0.8 * hash11(k + fc);
          float rc = r * (0.45 + 0.25 * hash11(fi + k + fc * 9.0));
          vec3 c = vec3(cos(a0) * r * 0.42, hy + 0.3 * (hash11(k * 3.0 + fc) - 0.5), sin(a0) * r * 0.42);
          vec3 w = q - c;
          float rr = length(w.xz) / rc;
          float th = (0.4 + 0.3 * hash11(fi * 2.0 + k + fc)) * (1.0 - 0.6 * rr * rr);
          float lump = fbm(vec3(w.x * 1.4, w.y * 3.0, w.z * 1.4) + vec3(fi, k, fc) * 7.0, 3);
          float sp = max(length(w.xz) - rc * (0.75 + 0.5 * lump), abs(w.y + 0.35 * rr * rr) - max(th, 0.12) * (0.7 + 0.6 * lump));
          sp *= 0.55;
          if (sp < d) { d = sp; m = 9.0; }
        }
      }
    }
  } else d = min(d, max(60.0 - length(p.xz), 0.0) + 0.5);
  // the measuring rod and its cord on a trestle by the bow
  {
    vec3 q = p - vec3(90.0, 0.0, 32.0);
    if (dot(q, q) < 16.0) {
      float tr = sdBox(q - vec3(0.0, 0.92, 0.0), vec3(1.6, 0.06, 0.32)) - 0.01;
      for (int s2 = 0; s2 < 2; s2++) {
        float x = s2 == 0 ? -1.2 : 1.2;
        tr = min(tr, sdCapsule(q, vec3(x - 0.25, 0.0, -0.25), vec3(x, 0.88, -0.2), 0.04));
        tr = min(tr, sdCapsule(q, vec3(x - 0.25, 0.0, 0.25), vec3(x, 0.88, 0.2), 0.04));
      }
      if (tr < d) { d = tr; m = 7.0; }
      // the rod: six cubits of reed-straight cedar, lying a little askew
      vec3 qr = q - vec3(0.0, 1.0, 0.05);
      float c = cos(0.12), sn = sin(0.12); qr.xz = mat2(c, -sn, sn, c) * qr.xz;
      float rod = sdBox(qr, vec3(6.0 * CU * 0.5, 0.02, 0.025)) - 0.004;
      if (rod < d) { d = rod; m = 11.0; }
      // the cord, coiled beside it
      vec3 qc = q - vec3(0.6, 1.0, -0.15);
      float coil = 1e9;
      for (int j = 0; j < 4; j++) { float rr = 0.13 + 0.018 * float(j); coil = min(coil, length(vec2(length(qc.xz) - rr, qc.y - 0.012 * float(j % 2))) - 0.009); }
      if (coil < d) { d = coil; m = 12.0; }
    } else d = min(d, sqrt(dot(q, q)) - 3.5);
  }
  {
    vec3 L = outLamp(11);
    vec3 ql = p - (L - vec3(0.06, 0.06, 0.0));
    float lamp = max(sdEllipsoid(ql, vec3(0.13, 0.05, 0.1)), ql.y - 0.02);
    lamp = min(lamp, sdCapsule(p, L - vec3(0.06, 0.07, 0.0), vec3(L.x - 0.06, L.y + 0.5, HZ + 0.02), 0.012));
    if (lamp < d) { d = lamp; m = 10.0; }
  }
  // outdoor lamp posts
  {
    float best = 1e9; vec3 lb;
    for (int i = 0; i < NO - 2; i++) { vec3 L = outLamp(i); float dd = length(p.xz - L.xz); if (dd < best) { best = dd; lb = L; } }
    if (best < 2.0) {
      float post = sdBox(p - vec3(lb.x, 1.3, lb.z), vec3(0.07, 1.3, 0.07));
      vec3 ql = p - (lb - vec3(0.06, 0.06, 0.0));
      float lamp = max(sdEllipsoid(ql, vec3(0.13, 0.05, 0.1)), ql.y - 0.02);
      float pl = min(post, lamp);
      if (pl < d) { d = pl; m = 10.0; }
    } else d = min(d, best - 1.5);
  }
  return d;
}
float map(vec3 p) { float m; return mapM(p, m); }
` + YARD_MARCH(700.0, 150) + /* glsl */ `
// ---------------- light ----------------
vec3 outCol(int i) { return LAMPC * flick(float(i) * 3.1 + 40.0) * (i == 10 ? 5.0 : (i == 11 ? 7.0 : 26.0)); }
vec3 inCol(int d, int k) { return LAMPC * flick(float(d * 30 + k) * 1.7) * 16.0; }
// the warm glow inside the window strip, along x
float winGlow(float x) {
  float s = 0.75 + 0.25 * sin(x * 1.05) * sin(x * 0.37 + 1.0);
  s *= 0.85 + 0.15 * vnoise(vec2(x * 0.3, uTime * 3.0));
  return s;
}
vec3 WINC = vec3(1.0, 0.70, 0.40);

// a measure line drawn from a to b, progress k (0..1): closest point for lighting and the glow along the ray
// closest approach of a ray to a segment: sp along the segment (0..1), tq along the ray
void segRay(vec3 ro, vec3 rd, vec3 a, vec3 b, out float sp, out float tq) {
  vec3 ba = b - a, w0 = a - ro;
  float A = dot(ba, ba), Bv = dot(ba, rd), D = dot(ba, w0), E = dot(rd, w0);
  float den = A - Bv * Bv;
  sp = den > 1e-7 ? sat((Bv * E - D) / den) : 0.0;
  tq = Bv * sp + E;
  // refine against the clamp
  sp = sat(dot(ro + rd * tq - a, ba) / max(A, 1e-6));
  tq = dot(a + ba * sp - ro, rd);
}
vec3 segClosest(vec3 p, vec3 a, vec3 b) { vec3 ba = b - a; return a + ba * sat(dot(p - a, ba) / dot(ba, ba)); }

vec3 lineLight(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float f0) {
  vec3 col = vec3(0);
  vec3 lc = vec3(1.0, 0.86, 0.6) * 3.0 * uLineGlow;
  if (uLine.x > 0.0) { vec3 b = mix(LA0, LA1, uLine.x); col += pointLit(p, n, v, alb, rough, f0, segClosest(p, LA0, b), lc, 0.3); }
  if (uLine.y > 0.0) { vec3 b = mix(LB0, LB1, uLine.y); col += pointLit(p, n, v, alb, rough, f0, segClosest(p, LB0, b), lc, 0.3); }
  if (uLine.z > 0.0) { vec3 b = mix(LC0, LC1, uLine.z); col += pointLit(p, n, v, alb, rough, f0, segClosest(p, LC0, b), lc, 0.3); }
  return col;
}

vec3 lightArk(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float f0, bool inside) {
  vec3 col = vec3(0);
  if (!inside) {
    for (int i = 0; i < NO; i++) {
      vec3 L = outLamp(i);
      vec3 dl = L - p; if (dot(dl, dl) > 1600.0) continue;
      col += pointLit(p, n, v, alb, rough, f0, L, outCol(i), 0.08);
    }
    // the window strip: a long line of light; light it from the nearest point of the strip on this side
    vec3 wp = vec3(clamp(p.x, -HX + 0.5, HX - 0.5), (YR + YW) * 0.5, sign(p.z + 1e-4) * ZC);
    vec3 wl = wp - p; float wd = length(wl);
    float wn = sat(dot(n, wl / wd));
    float side = sat(dot(-wl / wd, vec3(0.0, 0.0, sign(p.z + 1e-4))) + 0.3);
    col += alb / PI * WINC * winGlow(p.x) * 6.0 * wn * side * (2.0 / (wd + 0.5));
    if (rough < 0.3) col += pointLit(p, n, v, vec3(0), rough, f0, wp, WINC * winGlow(p.x) * 14.0, 1.2) * side;
    // the door's light pouring out
    vec3 dp = vec3(DX, (DB + DT) * 0.5, HZ + 0.4);
    vec3 dd = dp - p;
    float out_ = sat(-dd.z / (length(dd) + 1e-3) + 0.15);
    col += pointLit(p, n, v, alb, rough, f0, dp, vec3(1.0, 0.68, 0.36) * 30.0 * out_, 1.5);
  } else {
    int dk = p.y < F2 - 0.2 ? 0 : (p.y < F3 - 0.2 ? 1 : 2);
    float kk = floor((p.x + 63.0) / 6.0 + 0.5);
    for (int j = -2; j <= 2; j++) {
      int k = int(kk) + j;
      if (k < 0 || k > 21) continue;
      vec3 L = inLamp(dk, k);
      float lit = deckLit(dk, L.x);
      if (lit <= 0.001) continue;
      col += pointLit(p, n, v, alb, rough, f0, L, inCol(dk, k) * lit, 0.04);
    }
    // warm bounce light filling a lamplit hold (the lamps light the floor, the floor lights the rest)
    col += alb * vec3(1.0, 0.68, 0.38) * 0.45 * deckLit(dk, p.x) * (0.6 + 0.4 * sat(-n.y + 0.5));
    // the open door lets the night in
    col += alb * vec3(0.01, 0.012, 0.02);
  }
  col += lineLight(p, n, v, alb, rough, f0);
  if (!inside) {
    // the moon behind thin cloud: a broad soft source (its sheen is what shows a wet black roof)
    vec3 md = normalize(uMoon);
    col += pointLit(p, n, v, alb, max(rough, 0.12), f0, p + md * 1000.0, vec3(0.55, 0.58, 0.72) * 1000.0 * 1000.0 * uMoonI, 180.0);
  }
  // the moonlit cloud and the sky above
  col += alb * vec3(0.045, 0.048, 0.075) * (0.5 + 0.5 * n.y);
  // the far storm flickering on everything that faces it
  col += alb * vec3(0.3, 0.32, 0.45) * flash(uTime) * 0.04 * sat(0.5 - n.x * 0.5 + 0.3 * n.y);
  return col;
}

// ---------------- materials ----------------
vec3 shadeArk(vec3 p, vec3 n, vec3 v, float m, float t) {
  vec3 alb = vec3(0.1); float rough = 0.8, f0 = 0.04; vec3 emit = vec3(0);
  bool inside = (m > 29.5 && m < 35.5) || m > 36.5 || (m > 1.5 && m < 2.5 && abs(p.z) < HZ - TH * 0.5 && abs(p.x) < HX - TH * 0.5 && p.y > Y0 + TH * 0.5 && p.y < HW - 0.1);
  if (m < 1.5) {
    // the hilltop: trodden mud and chips round the hull, rough grass beyond, stones here and there
    float near = smoothstep(16.0, 2.0, max(abs(p.x) - HX, abs(p.z) - HZ));
    vec3 mud = earthAlb(p.xz * 0.6) * 0.9;
    mud = mix(mud, vec3(0.30, 0.18, 0.08), near * 0.3 * smoothstep(0.5, 0.7, fbm(p.xz * 2.0, 3)));
    float gmask = smoothstep(0.35, 0.6, fbm(p.xz * 0.35 + 5.0, 4) + 0.35 * (1.0 - near));
    float blade = vnoise(p.xz * 40.0) * vnoise(p.xz * 13.0 + 3.0);
    vec3 grass = mix(vec3(0.035, 0.04, 0.018), vec3(0.09, 0.085, 0.04), blade) * (0.7 + 0.6 * fbm(p.xz * 3.0, 2));
    alb = mix(mud, grass, gmask);
    rough = mix(0.75, 0.95, gmask);
    // stones
    vec2 vo = voronoiEdge(p.xz * 1.6);
    float stone = smoothstep(0.12, 0.2, vo.x) * step(0.86, vo.y) * (1.0 - gmask * 0.6);
    alb = mix(alb, vec3(0.16, 0.15, 0.14) * (0.7 + 0.5 * vnoise(p.xz * 20.0)), stone);
    rough = mix(rough, 0.6, stone);
    // relief: tufts and ruts
    float e = 0.03;
    float h0 = fbm(p.xz * 3.0, 3) + 0.6 * gmask * blade + 0.6 * stone, hx = fbm((p.xz + vec2(e, 0)) * 3.0, 3) + 0.6 * gmask * vnoise((p.xz + vec2(e, 0)) * 40.0) * vnoise((p.xz + vec2(e, 0)) * 13.0 + 3.0) + 0.6 * stone, hz = fbm((p.xz + vec2(0, e)) * 3.0, 3) + 0.6 * gmask * blade + 0.6 * stone;
    float lod = smoothstep(80.0, 10.0, t);
    n = bump(n, vec3(1, 0, 0), vec3(0, 0, 1), (hx - h0) / e * 0.04 * lod, (hz - h0) / e * 0.04 * lod);
    // the mud close to the slipway is wet and a little glossy
    float wet = near * smoothstep(0.5, 0.7, fbm(p.xz * 0.8 + 3.0, 3)) * (1.0 - gmask);
    rough = mix(rough, 0.25, wet); alb *= 1.0 - 0.35 * wet;
  } else if (m < 2.5) {
    if (inside) {
      // the hull's inner face: pitch too (within), duller
      alb = vec3(0.012, 0.01, 0.008); rough = 0.25; f0 = 0.05;
    } else {
      // outside: black pitch over cedar strakes of varied widths, each lapped over the one below so it
      // tilts a little and catches the light its own way; staggered butt joints; drips and runs from the
      // seams; the gloss broken up where the pitch is thin or brushed; cedar showing through at worn
      // edges low down and at the corners
      vec3 an = abs(n);
      bool roof = an.y > 0.3 && an.z > 0.2 && p.y > HW - 0.1;
      float sy = roof ? (HZ - abs(p.z)) * 1.14 : p.y - Y0;
      float sx = an.x > 0.5 ? p.z : p.x;
      vec3 T = an.x > 0.5 ? vec3(0, 0, 1) : vec3(1, 0, 0);
      vec3 B = normalize(cross(n, T)); if (dot(B, roof ? vec3(0.0, 1.0, -sign(p.z) * 0.0) : vec3(0, 1, 0)) < 0.0) B = -B;
      float yy = sy + 0.07 * sin(sy * 3.1) + 0.04 * sin(sy * 7.3 + 1.0);
      float row = floor(yy / 0.3), lap = fract(yy / 0.3);
      float bl = 4.0 + 2.5 * hash11(row * 3.7);
      float bu = (sx + hash11(row) * 9.0) / bl, bi = floor(bu), bf = fract(bu);
      float lod = smoothstep(90.0, 8.0, t);
      // each board tilted and twisted a little (clinker lap, uneven fastening)
      float tilt = 0.05 + 0.04 * hash11(row * 5.1 + bi * 1.3);
      float twist = (hash11(row * 2.3 + bi * 7.1) - 0.5) * 0.06;
      // seams: the lower lip of each strake, and the butt joints
      float seam = smoothstep(0.06, 0.0, lap) + smoothstep(0.012, 0.0, min(bf, 1.0 - bf) * bl) ;
      // runs of pitch from the seams, downward
      float dc = floor(sx * 9.0), dh = hash11(dc * 1.7 + row * 31.0);
      float run = step(0.82, dh) * smoothstep(0.35 * dh, 0.0, 1.0 - lap - 0.0) * smoothstep(0.035, 0.0, abs(fract(sx * 9.0) - 0.5) - 0.02);
      // brush strokes along the boards
      float r0; gLod = lod;
      float e = 0.01;
      float h0 = pitchH(vec2(sx, sy) * 0.6, 7.0 + row, r0), h1 = pitchH(vec2(sx + e, sy) * 0.6, 7.0 + row, r0), h2 = pitchH(vec2(sx, sy + e) * 0.6, 7.0 + row, r0);
      float dU = (h1 - h0) / e * 0.25 + twist * lod * 0.0 + (fract(sx * 9.0) - 0.5) * run * 0.8 * lod;
      float dV = (h2 - h0) / e * 0.25 - tilt * lod - seam * 0.5 * lod + twist * (bf - 0.5) * lod;
      n = bump(n, T, B, dU, dV);
      alb = vec3(0.02, 0.016, 0.012);
      // gloss: wet and thick in most places, satin where thin or dusty
      float sat2 = smoothstep(0.45, 0.75, fbm(vec2(sx, sy) * 0.35 + row * 0.1, 4));
      rough = mix(r0 * 0.8 + 0.03, 0.32, sat2) + seam * 0.3;
      f0 = 0.05;
      // worn edges: cedar showing through
      float wear = smoothstep(0.7, 0.78, fbm(vec2(sx, sy) * 2.5, 4) + 0.12 * smoothstep(1.0, 0.0, sy) + 0.3 * smoothstep(0.8, 0.0, HX - abs(p.x)) + 0.15 * seam) * lod;
      if (wear > 0.0) { alb = mix(alb, cedarAlb(vec2(sx, sy), row) * 0.7, wear); rough = mix(rough, 0.75, wear); }
      // the cut edge of the cutaway: raw cedar in section
      if (abs(n.x) > 0.6 && p.x < uCut + 0.05 && p.x > uCut - 1.0 && p.z > HZ - TH - 0.05 && p.y < HW) {
        // a plank end in section: end grain, the pitch a thin black skin on its outer face
        float row = floor((p.y - Y0) / 0.3);
        alb = cedarEnd(vec2(p.z - HZ + TH * 0.5, fract((p.y - Y0) / 0.3) * 0.3 - 0.15), row) * 0.9;
        alb *= smoothstep(0.0, 0.03, fract((p.y - Y0) / 0.3)) * 0.5 + 0.5;
        if (p.z > HZ - 0.035) alb = vec3(0.01);
        rough = 0.8; f0 = 0.03;
      }
    }
  } else if (m < 3.5) {
    // the window: warm light from within, through a lattice
    // a lattice of laths, the lamplit hold seen through it (brighter toward the lamps, warmer low)
    float lat = smoothstep(0.012, 0.0, abs(fract(p.x / 0.15) - 0.5) - 0.38) * 0.6 + 0.4 * smoothstep(0.012, 0.0, abs(fract((p.y - YR) / (CU / 3.0)) - 0.5) - 0.42);
    float vy = (p.y - YR) / CU;
    float lamp = 0.6 + 0.4 * pow(sat(1.0 - abs(fract((p.x + 63.0) / 6.0) - 0.5) * 2.0), 3.0);
    emit = mix(vec3(1.0, 0.55, 0.25), WINC, vy) * winGlow(p.x) * 9.0 * lamp * (1.0 - 0.8 * sat(lat));
    alb = vec3(0.0);
  } else if (m < 4.5 || m > 4.5 && m < 6.5) {
    // cedar: trim, the door leaf's inner face, the ramp
    vec2 g = m < 5.5 ? (abs(n.y) > 0.5 ? p.xz : (abs(n.z) > 0.5 ? vec2(p.x, p.y) : vec2(p.z, p.y))) : vec2(p.z * 1.1, p.x);
    if (m > 3.5 && m < 4.5 && abs(n.x) < 0.5 && abs(p.x) > HX - 0.3) g = vec2(p.y, p.x + p.z);
    alb = cedarAlb(g, m) * 0.85;
    rough = 0.65;
    if (m > 4.5 && m < 5.5) { float b = fract(p.x / 0.3); alb *= 0.65 + 0.35 * smoothstep(0.0, 0.06, b) * smoothstep(1.0, 0.94, b); g = vec2(p.y, p.x); alb = cedarAlb(g, 9.0) * 0.85 * (0.65 + 0.35 * smoothstep(0.0, 0.06, b)); }
  } else if (m < 7.5) {
    alb = cedarAlb(vec2(p.z, p.y + p.x), 4.0) * 0.45; rough = 0.85;
  } else if (m < 8.5) {
    alb = vec3(0.08, 0.05, 0.035) * (0.6 + 0.6 * fbm(vec2(p.y * 2.0, atan(p.z, p.x) * 6.0), 3)); rough = 0.9;
  } else if (m < 9.5) {
    alb = vec3(0.025, 0.04, 0.025) * (0.5 + 0.8 * fbm(p.xz * 1.5 + p.y, 3)); rough = 0.9;
  } else if (m < 10.5) {
    alb = vec3(0.12, 0.07, 0.04); rough = 0.8;
  } else if (m < 11.5) {
    // the rod: pale cedar with a cubit notched every 0.457 m
    alb = cedarAlb(vec2(p.x, p.z * 4.0), 21.0) * 1.1;
    float nt = abs(fract((p.x - 90.0) / CU + 0.5) - 0.5);
    alb *= 0.45 + 0.55 * smoothstep(0.0, 0.03, nt);
    rough = 0.55;
  } else if (m < 12.5) {
    alb = vec3(0.32, 0.26, 0.17) * (0.8 + 0.3 * sin(atan(p.z - 31.85, p.x - 90.6) * 60.0)); rough = 0.95;
  } else if (m < 30.5) {
    // deck planks
    alb = cedarAlb(vec2(p.x + hash11(floor(p.z / 0.3)) * 40.0, fract(p.z / 0.3) * 0.3), 5.0) * 0.8;
    float gz = fract(p.z / 0.3); alb *= 0.6 + 0.4 * smoothstep(0.0, 0.05, min(gz, 1.0 - gz));
    if (abs(n.y) < 0.5) alb = cedarAlb(vec2(p.x, p.y * 4.0), 6.0) * 0.8;
    rough = 0.7;
  } else if (m < 31.5) {
    alb = cedarAlb(vec2(p.y, p.x + p.z), 11.0) * 0.8; rough = 0.7;
    if (abs(n.y) > 0.5 || abs(n.z) > 0.5 && abs(fract((p.x + 1.5) / 6.0) - 0.5) > 0.1) alb = cedarAlb(vec2(p.x, p.y + p.z), 12.0) * 0.8;
  } else if (m < 32.5) {
    alb = cedarAlb(vec2(p.y + p.x, p.z), 13.0) * 0.85; rough = 0.7;
  } else if (m < 33.5) {
    alb = vec3(0.55, 0.42, 0.18) * (0.6 + 0.6 * fbm(p.xz * 14.0 + p.y * 8.0, 3)); rough = 0.95;
  } else if (m < 34.5) {
    alb = clayAlb(p) * 1.2; rough = 0.6;
  } else if (m > 35.5 && m < 36.5) {
    alb = cedarAlb(vec2(p.y, p.x + p.z), floor(p.x / 1.5) + 40.0) * 0.8; rough = 0.75;
    if (abs(n.x) > 0.6 && p.x < uCut + 0.2) alb = cedarEnd(vec2(p.z, p.y) * 0.5, floor(p.y)) * 0.9;
  } else if (m > 36.5) {
    alb = vec3(0.42, 0.34, 0.22) * (0.7 + 0.4 * fbm(p.xz * 30.0 + p.y * 20.0, 3)); rough = 0.95;
  } else {
    alb = clayAlb(p); rough = 0.7;
  }
  vec3 col = lightArk(p, n, v, alb, rough, f0, inside || m > 29.5) + emit;
  if (m < 9.5 || m > 29.5) {
    float ao = calcAO(p, n, m > 29.5 ? 0.8 : 1.5);
    col *= 0.45 + 0.55 * ao;
  }
  // glossy pitch reflects the sky and the window strip
  if (m > 1.5 && m < 2.5 && !inside) {
    vec3 rr = reflect(-v, n);
    float F = schlick(0.06, dot(n, v));
    vec3 env = nightSky(rr) * 2.5;
    // the window strip mirrored in the wet pitch (analytic: hit the strip's plane on this side)
    float zs = sign(p.z + 1e-4) * ZC;
    if (abs(p.z) > ZC && rr.z * sign(p.z) < -1e-4 && p.y < YW + 0.5) {
      float tw = (zs - p.z) / rr.z;
      vec3 w = p + rr * tw;
      if (tw > 0.0 && w.y > YR && w.y < YW && abs(w.x) < HX - 0.5) {
        float lat = smoothstep(0.02, 0.0, abs(fract(w.x / 0.4) - 0.5) - 0.42);
        float mull = step(abs(mod(w.x, 1.6) - 0.8), 0.11);
        env = WINC * winGlow(w.x) * 1.0 * (1.0 - 0.4 * lat) * (1.0 - 0.7 * mull) * sat(1.0 - rough * 4.0);
      }
    }
    // the lamps' flames, small and sharp in it
    for (int i = 0; i < NO; i++) env += lensGlow(p, rr, outLamp(i), outCol(i), 1e4, 0.002, 0.01) * 0.3;
    col += env * F * sat(1.0 - rough * 2.5);
  }
  return col;
}

// the far plain under the hill: dark land with the valley cities' fires
vec3 farLand(vec3 ro, vec3 rd) {
  float t = (-70.0 - ro.y) / min(rd.y, -0.004);
  t = min(t, 40000.0);
  vec3 p = ro + rd * t;
  vec3 c = vec3(0.006, 0.006, 0.008) * (0.6 + 0.8 * fbm(p.xz * 0.002, 4));
  // fires: clusters of embers to the south-east
  vec2 q = p.xz * 0.004;
  vec2 cell = floor(q * 6.0);
  float h = hash12(cell);
  vec2 o = (cell + hash22(cell)) / 6.0;
  float dd = length(q - o) * 1000.0;
  float region = smoothstep(0.3, 0.9, cos(atan(p.x, p.z) - 2.3));
  c += vec3(1.0, 0.35, 0.08) * step(0.6, h) * region * 0.08 / (1.0 + dd * dd * 0.02) * (0.7 + 0.3 * vnoise(vec2(uTime * 3.0, h * 50.0)));
  return mix(c, vec3(0.03, 0.03, 0.045), 1.0 - exp(-t * 0.0012));
}

vec3 arkScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float m; float t = march(ro, rd, m);
  vec3 col; float depth = 2000.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t; depth = t;
    vec3 n = calcN(p, 0.0006 * max(t, 1.0));
    col = shadeArk(p, n, -rd, m, t);
    col = mix(col, vec3(0.02, 0.02, 0.03), 1.0 - exp(-t * 0.0022));
  } else {
    col = nightSky(rd);
    if (rd.y < 0.0) col = mix(farLand(ro, rd), col, smoothstep(-0.03, 0.0, rd.y));
  }
  // lamps: flames and their haze
  for (int i = 0; i < NO; i++) {
    vec3 L = outLamp(i);
    col += flameAt(ro, rd, L - vec3(0.0, 0.0, 0.0), 0.12, float(i) * 7.0, depth, flick(float(i) * 3.1 + 40.0));
    col += hazeGlow(ro, rd, L + vec3(0, 0.05, 0), outCol(i), depth, 0.0007);
    col += lensGlow(ro, rd, L + vec3(0, 0.05, 0), outCol(i), depth, 0.0006, 0.004) * 0.15;
  }
  // the window strip and the door breathe light into the night air
  {
    col += hazeGlow(ro, rd, vec3(DX, (DB + DT) * 0.5, HZ + 1.5), vec3(1.0, 0.7, 0.4) * 12.0, depth, 0.0015);
  }
  {
    // the window strip breathes light into the air on both sides of the ridge
    for (int sd = 0; sd < 2; sd++) {
      vec3 a = vec3(-HX, (YR + YW) * 0.5, sd == 0 ? ZC : -ZC), b = vec3(HX, (YR + YW) * 0.5, sd == 0 ? ZC : -ZC);
      float sp, tq; segRay(ro, rd, a, b, sp, tq);
      if (tq > 0.0 && tq < depth + 3.0) {
        vec3 q = a + (b - a) * sp;
        float h = length(ro + rd * tq - q);
        col += WINC * 0.8 * 0.06 / (1.0 + h * h * 0.8) * (sd == 0 ? 1.0 : 0.5);
      }
    }
  }
  if (uInside > 0.5) {
    int k0 = int(clamp(floor((uCamPos.x - 34.0 + 63.0) / 6.0), 0.0, 21.0));
    int k1 = int(clamp(ceil((uCamPos.x + 30.0 + 63.0) / 6.0), 0.0, 21.0));
    for (int dk = 0; dk < 3; dk++) for (int k = 0; k < 22; k++) {
      if (k < k0 || k > k1) continue;
      vec3 L = inLamp(dk, k); float lit = deckLit(dk, L.x);
      if (lit < 0.01) continue;
      col += flameAt(ro, rd, L, 0.06, float(dk * 30 + k), depth, lit * flick(float(dk * 30 + k) * 1.7));
      col += hazeGlow(ro, rd, L + vec3(0, 0.03, 0), inCol(dk, k) * lit, depth, 0.0008);
    }
  }
  // the measure lines: a hot thread of light with a soft halo, and tick marks every ten cubits
  vec3 LC = vec3(1.0, 0.86, 0.62);
  for (int s = 0; s < 3; s++) {
    float k = s == 0 ? uLine.x : (s == 1 ? uLine.y : uLine.z);
    if (k <= 0.0) continue;
    vec3 a = s == 0 ? LA0 : (s == 1 ? LB0 : LC0);
    vec3 b0 = s == 0 ? LA1 : (s == 1 ? LB1 : LC1);
    vec3 b = mix(a, b0, k);
    float sp, tq; segRay(ro, rd, a, b, sp, tq);
    vec3 q = a + (b - a) * sp; float bb = dot(b - a, b - a);
    if (tq > 0.0 && tq < depth + 1.0) {
      float h = length(ro + rd * tq - q) / tq;   // angular distance
      float core = exp(-h * h / (0.0006 * 0.0006));
      float halo = 0.03 / (1.0 + h * h / (0.004 * 0.004));
      // ticks: every ten cubits along the line
      float L = sqrt(bb) / max(k, 1e-3);
      float along = sp * sqrt(bb);
      float tick = smoothstep(0.35, 0.0, abs(mod(along + 2.286, 10.0 * CU) - 2.286)) ;
      float tickw = exp(-h * h / (0.0035 * 0.0035)) * tick * 0.7;
      // the drawing tip burns brighter
      float tip = exp(-pow((1.0 - sp) * sqrt(bb) / 2.0, 2.0)) * (k < 0.999 ? 1.0 : 0.0);
      col += LC * (core * 6.0 + halo + tickw * 2.0) * (1.0 + 3.0 * tip) * uLineGlow;
    }
  }
  // the cubit mark at the window (s30)
  if (uCubit > 0.0) {
    vec3 a = vec3(-HX + 1.2, YR, ZC + 0.12), b = vec3(-HX + 1.2, YR + CU * uCubit, ZC + 0.12);
    float sp, tq; segRay(ro, rd, a, b, sp, tq);
    vec3 q = a + (b - a) * sp;
    if (tq > 0.0 && tq < depth + 0.5) {
      float h = length(ro + rd * tq - q) / tq;
      col += LC * (exp(-h * h / (0.0012 * 0.0012)) * 6.0 + 0.04 / (1.0 + h * h / (0.006 * 0.006))) * min(uCubit * 3.0, 1.0);
    }
    // the two ends of the cubit as short crossbars
    for (int e2 = 0; e2 < 2; e2++) {
      vec3 c = e2 == 0 ? a : b;
      vec3 a2 = c - vec3(0.25, 0.0, 0.0), b2 = c + vec3(0.25, 0.0, 0.0);
      float sp2, tq; segRay(ro, rd, a2, b2, sp2, tq);
      vec3 q = a2 + (b2 - a2) * sp2;
      if (tq > 0.0 && tq < depth + 0.5) { float h = length(ro + rd * tq - q) / tq; col += LC * exp(-h * h / (0.0012 * 0.0012)) * 5.0 * sat(uCubit * 3.0 - float(e2) * 2.0); }
    }
  }
  return col;
}
`;
export const ARK_FRAG = ARK_GLSL + 'vec3 shade(vec2 fc) { vec3 c = arkScene(fc); return (c.x == c.x && c.y == c.y && c.z == c.z) ? min(c, vec3(6e4)) : vec3(0.0); }';
