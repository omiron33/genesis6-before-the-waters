// The ember world (s12): a bed of charcoal in macro, in the dark. Small, irregular, chipped pieces
// of charred wood lie on a bed of glowing crumbs and ash. Each is black char split into the
// alligator checking of burnt wood, and the fissures glow orange-red from inside; the piece's edges
// and feet glow softly from beneath; a white-grey skin of ash flakes over the tops. A few tiny
// flames lick and waver. The heat breathes like a heart on the song's pulse; sparks rise through a
// heat shimmer; at the end the coals go down under ash. Metres; the bed's floor is near y = -0.012.
import { STORM_COMMON } from './x-storm.js';

export const EMBER_UNIFORMS = { uFocus: 0.22, uAper: 0.0035, uDim: 0, uBeats: new Array(8).fill(-100) };

export const EMBER_GLSL = STORM_COMMON + /* glsl */ `
uniform float uDim;          // 0..1: the coals going down under the ash at the end
uniform float uBeats[8];

// the heart: a lub-dub swell of heat on each pair of beats
float heart() {
  float s = 0.0;
  for (int i = 0; i < 8; i++) {
    float x = uTime - uBeats[i];
    s += exp(-pow((x - 0.06) / 0.12, 2.0)) + 0.55 * exp(-pow((x - 0.36) / 0.14, 2.0));
    s += x > 0.0 ? 0.25 * exp(-x / 0.6) * smoothstep(0.0, 0.05, x) : 0.0;
  }
  return s;
}
float HB;   // heart this frame

float heat(vec2 xz) {
  float n = vnoise(xz * 4.0 + vec2(0.0, uTime * 0.03)) * 0.65 + 0.35 * vnoise(xz * 9.0 + 3.0);
  return sat(smoothstep(0.25, 0.7, n) * (0.68 + 0.32 * HB) * (1.0 - 0.75 * uDim));
}
vec3 blackbody(float T) {
  vec3 c = mix(vec3(0.0), vec3(0.42, 0.035, 0.004), smoothstep(0.0, 0.3, T));
  c = mix(c, vec3(1.8, 0.55, 0.1), smoothstep(0.3, 0.65, T));
  c = mix(c, vec3(3.6, 1.9, 0.7), smoothstep(0.65, 1.0, T));
  return c;
}
// a cheap one-pass cellular edge: (F2 - F1) / 2
vec2 cellEdge(vec2 x) {
  vec2 n = floor(x), f = fract(x);
  float d1 = 8.0, d2 = 8.0; vec2 c1 = vec2(0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(i, j), r = g + hash22(n + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; c1 = n + g; } else if (d < d2) d2 = d;
  }
  return vec2((sqrt(d2) - sqrt(d1)) * 0.5, hash12(c1));
}

const float CS = 0.04;   // cell size of the piece grid
void chunk(vec2 c, out vec3 ctr, out vec3 hs, out float pres, out float seed) {
  seed = hash12(c * 1.37 + 4.1);
  vec2 j = hash22(c + 11.3) - 0.5;
  hs = vec3(0.009 + 0.013 * hash12(c + 3.3), 0.006 + 0.008 * hash12(c + 5.9), 0.008 + 0.012 * hash12(c + 8.1));
  ctr = vec3((c.x + 0.5 + j.x * 0.4) * CS, -0.012 + hs.y * 0.7 + 0.003 * (hash12(c + 2.2) - 0.5), (c.y + 0.5 + j.y * 0.4) * CS);
  pres = step(0.12, hash12(c + 21.0));
}
float chunksSD(vec3 p, out vec3 lq, out vec3 lhs, out float sd) {
  vec2 c0 = floor(p.xz / CS);
  float d = 1e9; lq = vec3(0); lhs = vec3(0.01); sd = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = c0 + vec2(i, j);
    vec3 ctr, hs; float pres, seed;
    chunk(c, ctr, hs, pres, seed);
    if (pres < 0.5) continue;
    vec3 q = p - ctr;
    if (dot(q, q) > 0.0012) continue;
    q.xz = rot(seed * 6.2831) * q.xz;
    q.xy = rot((seed - 0.5) * 0.8) * q.xy;
    q.yz = rot((hash12(c + 31.0) - 0.5) * 0.6) * q.yz;
    float b = sdBox(q, hs - 0.003) - 0.003;
    // chipped and broken: two corners sheared off by random planes
    vec3 n1 = normalize(hash33(vec3(c, 1.0)) - 0.5 + vec3(0.0, 0.4, 0.0));
    vec3 n2 = normalize(hash33(vec3(c, 7.0)) - 0.5);
    b = max(b, dot(q, n1) - 0.75 * length(hs));
    b = max(b, dot(q, n2) - 0.8 * length(hs));
    if (b < d) { d = b; lq = q; lhs = hs; sd = seed; }
  }
  return d;
}
float floorH(vec2 xz) { return -0.012 + 0.003 * vnoise(xz * 40.0) + 0.0012 * vnoise(xz * 95.0); }
float mapE(vec3 p, out int id, out vec3 lq, out vec3 lhs, out float sd) {
  float d = chunksSD(p, lq, lhs, sd);
  if (d < 0.006) d += 0.0035 * (vnoise(lq * 120.0 + sd * 30.0) - 0.5) + 0.0012 * (vnoise(lq * 380.0) - 0.5) + 0.0004 * (vnoise(lq * 900.0) - 0.5);
  float f = p.y - floorH(p.xz);
  id = 1;
  if (f < d) { id = 0; return f; }
  return d;
}
float mapES(vec3 p) { int i; vec3 l, h; float s; return mapE(p, i, l, h, s); }
vec3 normE(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.0002 + 0.0002 * t);
  return normalize(e.xyy * mapES(p + e.xyy) + e.yyx * mapES(p + e.yyx) + e.yxy * mapES(p + e.yxy) + e.xxx * mapES(p + e.xxx));
}
float marchE(vec3 ro, vec3 rd) {
  float t = 0.01;
  for (int i = 0; i < 110; i++) {
    vec3 p = ro + rd * t;
    float d = mapES(p);
    if (d < 0.00012 * t + 0.00003) return t;
    t += d * 0.9;
    if (t > 2.0 || p.y > 0.1) break;
  }
  return -1.0;
}

// the alligator checking of char, triplanar in a piece's own coordinates: x = crack, y = cell id
vec2 checks(vec3 q, vec3 nl, float seed) {
  vec3 w = pow(abs(nl), vec3(4.0)); w /= dot(w, vec3(1));
  // project on the dominant axis only (one cellular lookup)
  vec2 uv = w.x > w.y && w.x > w.z ? q.zy * vec2(150.0, 230.0) + seed * 17.0 : (w.y > w.z ? q.xz * 150.0 + seed * 23.0 : q.xy * vec2(150.0, 230.0) + seed * 31.0);
  vec2 a = cellEdge(uv);
  float e = a.x; float id = a.y;
  return vec2(1.0 - smoothstep(0.015, 0.06, e), id);
}

// tiny flames licking off a few pieces (after the candle flames of faith-of-the-apostles s06)
vec3 flameAt(vec3 ro, vec3 rd, vec3 b, float h, float seed, float depth) {
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dd > 1e-6 ? dot(b.xz - ro.xz, dxz) / dd : 0.0;
  if (t <= 0.0 || t > depth + 0.004) return vec3(0);
  vec3 q = ro + rd * t - b;
  float hh = h * (0.7 + 0.6 * vnoise(vec2(uTime * 5.0 + seed, 1.0))) * (0.75 + 0.35 * HB);
  float y = q.y / hh;
  if (y < -0.3 || y > 1.6) return vec3(0);
  float sw = (vnoise(vec2(uTime * 3.1 + seed, 3.0)) - 0.5) * 0.9;
  vec2 rr = q.xz - normalize(vec2(-rd.z, rd.x) + 1e-5) * sw * hh * 0.35 * y * y;
  float x = length(rr) / (hh * 0.3);
  float yy = clamp(y, 0.0, 1.0);
  float prof = pow(yy, 0.4) * pow(1.0 - yy, 0.9) * 1.8 + 0.06;
  // ragged licks: the top breaks into tongues
  float tongue = 0.6 + 0.6 * vnoise(vec2(x * 3.0 + seed, y * 2.5 - uTime * 6.0));
  float body = smoothstep(1.0, 0.4, x / (prof * tongue)) * smoothstep(-0.1, 0.1, y) * smoothstep(1.3, 0.6, y);
  float core = smoothstep(0.5, 0.1, x / prof) * smoothstep(0.0, 0.2, y) * smoothstep(0.6, 0.25, y);
  return (vec3(1.0, 0.42, 0.1) * body * 2.2 + vec3(1.0, 0.7, 0.35) * core * 4.0) * (1.0 - uDim);
}

vec3 sparks(vec3 ro, vec3 rd, float depth) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 28; i++) {
    float fi = float(i);
    float life = 2.2 + 1.6 * hash11(fi * 3.1);
    float t0 = hash11(fi * 7.7) * life;
    float k = mod(uTime + t0, life);
    float cyc = floor((uTime + t0) / life);
    vec2 o = (hash22(vec2(fi, cyc)) - 0.5) * vec2(0.5, 0.6);
    vec3 p = vec3(o.x, 0.005 + k * (0.035 + 0.03 * hash11(fi + cyc)), o.y + 0.12);
    p.x += 0.02 * sin(k * 2.0 + fi) + 0.03 * k;
    p.z += 0.01 * cos(k * 1.7 + fi);
    float b = smoothstep(0.0, 0.2, k) * exp(-k * 0.9) * (0.7 + 0.3 * sin(uTime * 30.0 + fi * 5.0));
    acc += vec3(1.0, 0.45, 0.1) * pointGlow(ro, rd, p, 0.00045, depth) * b * 0.9;
  }
  return acc;
}

vec3 embers(vec2 fc) {
  HB = heart();
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  vec2 sp = fc / uRes.y;
  vec2 sh = vec2(vnoise(vec2(sp.x * 9.0, sp.y * 7.0 - uTime * 2.2)), vnoise(vec2(sp.x * 9.0 + 5.0, sp.y * 7.0 - uTime * 2.6))) - 0.5;
  rd = normalize(rd + vec3(sh.x, sh.y, 0.0) * 0.003 * (1.0 - 0.5 * uDim));
  float t = marchE(ro, rd);
  vec3 col = vec3(0.0);
  float depth = 10.0;
  float hb2 = 0.7 + 0.3 * HB;
  if (t > 0.0) {
    vec3 p = ro + rd * t;
    depth = t;
    int id; vec3 lq, lhs; float seed;
    mapE(p, id, lq, lhs, seed);
    vec3 n = normE(p, t);
    vec3 v = -rd;
    float T = heat(p.xz);
    vec3 E = vec3(0), alb;
    float ash = 0.0, sheen = 0.0;
    float low = exp(-max(p.y - floorH(p.xz), 0.0) / 0.003);
    if (id == 0) {
      // the bed: ember crumbs glowing between drifts of ash
      vec2 cr = cellEdge(p.xz * 420.0);
      float crumbs = (1.0 - smoothstep(0.0, 0.25, cr.x)) * (0.4 + 0.6 * cr.y);
      ash = smoothstep(0.42 - 0.25 * uDim, 0.6 - 0.25 * uDim, vnoise(p.xz * 60.0 + 3.0) * 0.7 + 0.3 * vnoise(p.xz * 150.0));
      E = blackbody(sat(T * (0.25 + 0.75 * crumbs) * (1.0 - 0.92 * ash))) * 0.6;
      alb = mix(vec3(0.025, 0.022, 0.02), vec3(0.5, 0.49, 0.5), ash);
    } else {
      // charcoal: black, faintly silvery char split into checks; fissures glowing from within
      float Tc = T * (0.5 + 0.5 * seed) * (0.75 + 0.25 * HB);
      vec3 nl = normalize(lq / max(lhs, vec3(1e-4)));
      vec2 ck = checks(lq, nl, seed);
      // only some fissures run hot; the rest are dark splits in the char
      float fiss = ck.x * smoothstep(0.35, 0.7, vnoise(lq * 120.0 + seed * 40.0) + 0.3 * HB * T);
      float split = ck.x;
      // the edges and the foot of each piece glow from beneath (subsurface)
      vec3 ve = lhs - abs(lq);
      float mid = max(min(ve.x, ve.y), min(max(ve.x, ve.y), ve.z));
      float edge = 1.0 - smoothstep(0.0, 0.0025, min(min(ve.x + ve.y, ve.y + ve.z), ve.x + ve.z) * 0.5);
      float bottom = smoothstep(-0.2, -0.8, n.y) + low;
      // a skin of white-grey ash flaking over the tops, curling up at its flake edges
      float top = smoothstep(0.15, 0.6, n.y);
      vec2 fl = cellEdge(lq.xz * 300.0 + seed * 9.0);
      float flake = smoothstep(0.02, 0.06, fl.x);
      ash = top * flake * smoothstep(0.22, 0.34, vnoise(lq.xz * 60.0 + seed * 5.0) * 0.7 + 0.3 * fl.y + 0.3 * uDim + 0.15 * (1.0 - seed));
      float glow = max(fiss * (0.45 + 0.55 * Tc) * (1.0 - 0.9 * ash), bottom * 0.6 * Tc);
      E = blackbody(sat(glow * Tc * 1.4 + fiss * 0.1 * T));
      // ash over a hot piece is lit through, a pale warm glow
      E += vec3(1.0, 0.5, 0.25) * ash * Tc * 0.12 * (0.6 + 0.4 * HB);
      // char between the fissures: very dark with a bluish metallic sheen; ash pale
      alb = mix(vec3(0.016, 0.015, 0.015) * (0.7 + 0.6 * ck.y) * (1.0 - 0.7 * split), vec3(0.7, 0.68, 0.68) * (0.8 + 0.3 * fl.y), ash);
      sheen = (1.0 - ash) * (1.0 - fiss);
    }
    float side = 1.0 - smoothstep(0.2, 0.8, n.y);
    vec3 glowL = vec3(1.0, 0.34, 0.07) * T * hb2 * (0.2 + 0.8 * side) * (0.25 + 0.75 * exp(-max(p.y + 0.012, 0.0) / 0.01)) * 0.5;
    vec3 amb = vec3(1.0, 0.6, 0.4) * 0.3 * (0.4 + 0.6 * heat(p.xz * 0.35)) * hb2 * (1.0 - 0.2 * uDim) + vec3(0.05, 0.045, 0.045) * uDim;
    // the glow of the whole bed from beyond, catching the tops and far faces
    vec3 sky = vec3(0.09, 0.035, 0.012) * hb2 * sat(dot(n, normalize(vec3(0.2, 0.6, 0.8)))) * (1.0 - 0.5 * uDim);
    float fres = pow(1.0 - sat(dot(n, v)), 4.0);
    vec3 spec = (vec3(1.0, 0.45, 0.15) * T * hb2 + vec3(0.02, 0.025, 0.035)) * (0.05 + 0.7 * fres) * sheen * 0.35;
    col = E + alb * (glowL + amb + sky) + spec;
    col *= exp(-max(t - 0.45, 0.0) * 1.6);
    col += vec3(0.04, 0.01, 0.003) * (1.0 - exp(-max(t - 0.45, 0.0) * 1.6)) * hb2 * (1.0 - uDim);
  } else {
    float y = rd0.y;
    float sm = vnoise(vec2(rd0.x * 4.0, y * 3.0 - uTime * 0.12)) * 0.6 + 0.4 * vnoise(vec2(rd0.x * 9.0, y * 7.0 - uTime * 0.2));
    col = vec3(0.022, 0.006, 0.002) * exp(-max(y, 0.0) * 9.0) * (0.4 + 0.8 * sm) * hb2 * (1.0 - 0.6 * uDim);
  }
  // the little flames
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec3 b = vec3(-0.06 + 0.05 * fi + 0.02 * hash11(fi * 3.3), -0.006 + 0.004 * hash11(fi * 5.1), 0.12 + 0.22 * hash11(fi * 7.9));
    float on = smoothstep(0.2, 0.6, vnoise(vec2(uTime * 0.7, fi * 13.0)));
    col += flameAt(ro, rd, b, 0.012 + 0.012 * hash11(fi * 2.7), fi * 9.1, depth) * on;
  }
  // smoke drifting through the shot, lit warm from beneath
  float smk = vnoise(vec2(fc.x / uRes.y * 2.5 + uTime * 0.04, fc.y / uRes.y * 3.0 - uTime * 0.15)) * 0.7 + 0.3 * vnoise(fc / uRes.y * 7.0 - vec2(0.0, uTime * 0.3));
  col += vec3(0.03, 0.009, 0.003) * smoothstep(0.45, 0.85, smk) * hb2 * (1.0 - 0.6 * uDim) * 0.6;
  col += sparks(ro, rd, depth) * (1.0 - 0.8 * uDim);
  return col;
}
`;
