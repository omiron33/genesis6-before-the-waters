// s28's world: inside the ark's frame as it rises, at night. A wall of horizontal cedar strakes with the
// ribs standing proud of it every 1.5 m, running up past the planking into the open storm sky; two
// partitions of upright boards make the first rooms (one still half built). The wall is being coated
// within: long brushed strokes of wet black pitch over most of it, the bare honey cedar still showing at
// the right where the work stopped, drips slowly running and beading. On the deck in front, a clay pot of
// pitch steams on a bronze brazier of coals with the brush resting across its rim. A lamp hangs from a
// rib. Wall face at z = 0 facing +z, deck at y = 0.
import { YARD_COMMON, YARD_MARCH, YARD_UNIFORMS } from './x-yard.js';

export const PLAMP = [-1.5, 2.02, 0.42];
export const PLAMP2 = [-4.5, 2.02, 0.42];
export const POT = [-1.55, 0.0, 1.55];
export const PITCH_UNIFORMS = { ...YARD_UNIFORMS };

export const PITCH_GLSL = YARD_COMMON + /* glsl */ `
#define NLP 10
vec3 lampP(int k) { return k == NLP - 1 ? vec3(-0.75, 0.62, 0.62) : vec3(1.5 - 3.0 * float(k), 2.0, 0.5); }
const vec3 POT = vec3(${POT.join(', ')});
const vec3 COALP = POT + vec3(0.0, 0.42, 0.0);

// where the pitch stops on the wall (strokes end raggedly)
float pitchEdge(float y) {
  float band = floor(y / 0.11);
  return 0.55 + 0.5 * hash11(band * 3.7) + 0.08 * sin(y * 9.0) - smoothstep(2.3, 2.8, y) * 1.2;
}
// is wall point (x,y) coated?
float coated(vec2 q) { return step(q.x, pitchEdge(q.y)); }

// drips: a few runs below stroke ends, slowly lengthening
vec4 drip(int i) {   // x, top y, length, radius
  float fi = float(i);
  float x = -3.4 + fi * 0.43 + 0.12 * hash11(fi * 3.1);
  float y = 0.6 + 1.7 * hash11(fi * 7.3);
  float L = 0.04 + 0.16 * hash11(fi * 1.9) + 0.012 * (uTime - 146.0) * (0.5 + hash11(fi * 4.4));
  return vec4(x, y, L, 0.004 + 0.003 * hash11(fi * 2.2));
}

mat3 rotYp(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }

float mapM(vec3 p, out float m) {
  // deck
  float d = p.y; m = 1.0;
  // the wall of strakes, planked up to 2.8 m (each strake a little proud of the one above: clinker)
  {
    float sy = fract(p.y / 0.28);
    float wall = sdBox(p - vec3(-13.5, 1.4, -0.05), vec3(16.5, 1.4, 0.05)) - 0.004 * smoothstep(0.0, 0.05, sy) * 0.0;
    wall += 0.006 * sy;   // clinker lap
    // pitch thickness on the coated part, and the drips
    float co = coated(p.xy);
    float w2 = wall - 0.0025 * co;
    if (w2 < d) { d = w2; m = co > 0.5 ? 5.0 : 2.0; }
    if (p.z < 0.05 && p.z > -0.02 && abs(p.x) < 4.0) {
      for (int i = 0; i < 9; i++) {
        vec4 dr = drip(i);
        if (dr.x > pitchEdge(dr.y) - 0.05) continue;
        float c = sdCapsule(p, vec3(dr.x, dr.y, 0.0), vec3(dr.x, dr.y - dr.z, 0.0), dr.w);
        c = min(c, length(p - vec3(dr.x, dr.y - dr.z, 0.002)) - dr.w * 1.9);
        if (c < d) { d = c; m = 5.0; }
      }
    }
  }
  // ribs: every 1.5 m, standing proud of the wall, rising into the sky
  {
    float xi = clamp(floor(p.x / 1.5 + 0.5), -20.0, 2.0);
    vec3 q = vec3(p.x - xi * 1.5, p.y, p.z);
    float rib = sdBox(q - vec3(0.0, 4.5, 0.12), vec3(0.11, 4.5, 0.12)) - 0.006;
    if (rib < d) { d = rib; m = (q.y < 2.8 && coated(vec2(p.x, p.y)) > 0.5 && xi * 1.5 < 0.4) ? 6.0 : 3.0; }
    // the next frame's top tie far above
    float tie = sdBox(p - vec3(-13.5, 8.9, 0.12), vec3(16.5, 0.11, 0.12));
    if (tie < d) { d = tie; m = 3.0; }
  }
  // the far side of the hull: bare frames standing against the sky
  if (p.z > 15.0) {
    float xi = floor(p.x / 1.5 + 0.5);
    float rib = sdBox(vec3(p.x - xi * 1.5, p.y - 4.5, p.z - 22.7), vec3(0.11, 4.5, 0.12));
    float strake = sdBox(p - vec3(-13.5, 1.0, 22.86), vec3(16.5, 1.0, 0.05));
    float fr = min(rib, strake);
    if (fr < d) { d = fr; m = 3.0; }
  } else d = min(d, p.z < 14.0 ? max(15.0 - p.z, 0.5) : 1e9);
  // partitions of upright boards: the rooms (stalls), every 3 m down the hull, coated within
  if (p.x < -2.0 && p.y < 1.6) {
    float xi = clamp(floor(-p.x / 3.0 + 0.5), 1.0, 9.0);
    float x = -xi * 3.0;
    vec3 q = p - vec3(x, 0.62, 1.4);
    float bd = sdBox(q, vec3(0.035, 0.62, 1.15));
    float bz = fract(p.z / 0.24);
    bd += 0.002 * smoothstep(0.08, 0.0, min(bz, 1.0 - bz));
    float post = sdBox(p - vec3(x, 0.72, 2.6), vec3(0.08, 0.72, 0.08)) - 0.005;
    float top = sdBox(p - vec3(x, 1.27, 1.4), vec3(0.065, 0.045, 1.25)) - 0.004;
    float pa = min(bd, min(post, top));
    if (pa < d) { d = pa; m = 4.0; }
  }
  // the brazier: a flat stone, three bronze legs, a shallow bowl of coals
  {
    vec3 q = p - POT;
    if (length(q.xz) < 0.6 && q.y < 1.1) {
      float st = sdBox(q - vec3(0.0, 0.04, 0.0), vec3(0.42, 0.04, 0.38)) - 0.02;
      if (st < d) { d = st; m = 7.0; }
      float lg = 1e9;
      for (int i = 0; i < 3; i++) { float a = float(i) * 2.094; vec2 o = vec2(cos(a), sin(a)); lg = min(lg, sdCapsule(q, vec3(o.x * 0.26, 0.08, o.y * 0.26), vec3(o.x * 0.2, 0.36, o.y * 0.2), 0.016)); }
      vec3 qb = q - vec3(0.0, 0.42, 0.0);
      float bowl = max(sdSphere(qb + vec3(0.0, -0.16, 0.0), 0.3), qb.y - 0.0);
      bowl = max(bowl, -(sdSphere(qb + vec3(0.0, -0.16, 0.0), 0.285)));
      float br = min(lg, bowl);
      if (br < d) { d = br; m = 8.0; }
      // the coals heaped in it
      float co = max(sdSphere(qb + vec3(0.0, -0.16, 0.0), 0.285), qb.y + 0.02 - 0.03 * vnoise(qb.xz * 30.0));
      if (co < d) { d = co; m = 9.0; }
      // the clay pot standing in the coals
      vec3 qp = q - vec3(0.0, 0.64, 0.0);
      float pot = sdEllipsoid(qp, vec3(0.21, 0.22, 0.21));
      pot = max(pot, qp.y - 0.15);
      float neck = max(length(qp.xz) - 0.15, abs(qp.y - 0.17) - 0.03);
      pot = min(pot, neck - 0.008);
      pot = max(pot, -max(length(qp.xz) - 0.13, 0.04 - qp.y));
      float rim = length(vec2(length(qp.xz) - 0.155, qp.y - 0.2)) - 0.014;
      pot = min(pot, rim);
      if (pot < d) { d = pot; m = 10.0; }
      // the pitch inside, nearly to the rim, slowly heaving
      float surf = max(length(qp.xz) - 0.14, qp.y - 0.17 - 0.004 * sin(uTime * 2.0 + qp.x * 40.0) * sin(uTime * 1.3 + qp.z * 35.0));
      surf = max(surf, -qp.y);
      if (surf < d) { d = surf; m = 5.0; }
      // the brush across the rim: a handle and a head of bristles sunk in the pitch
      vec3 a = vec3(-0.06, 0.13, 0.03), b = vec3(0.42, 0.32, 0.12);
      float hd = sdCapsule(qp, a, b, 0.014);
      if (hd < d) { d = hd; m = 11.0; }
      float bh = sdCapsule(qp, a + (a - b) * 0.04, a - normalize(b - a) * 0.08, 0.03);
      if (bh < d) { d = bh; m = 5.0; }
    }
  }
  // a lamp set down on a block by the wall, where the work stopped
  {
    vec3 L = lampP(NLP - 1);
    float blk = sdBox(p - vec3(L.x - 0.06, 0.27, L.z), vec3(0.16, 0.27, 0.14)) - 0.01;
    if (blk < d) { d = blk; m = 4.0; }
    vec3 ql = p - (L - vec3(0.06, 0.03, 0.0));
    float bowl = max(sdEllipsoid(ql, vec3(0.075, 0.032, 0.06)), ql.y - 0.012);
    float spout = sdCapsule(ql, vec3(0.0, 0.006, 0.0), vec3(0.068, 0.018, 0.0), 0.014);
    float lamp = max(min(bowl, spout), -sdEllipsoid(ql - vec3(0.0, 0.014, 0.0), vec3(0.06, 0.02, 0.045)));
    if (lamp < d) { d = lamp; m = 12.0; }
  }
  // lamps on bronze brackets from every second rib
  if (p.y > 1.6 && p.y < 2.5 && p.z < 0.8) {
    float k = clamp(floor((1.5 - p.x) / 3.0 + 0.5), 0.0, float(NLP - 2));
    vec3 L = lampP(int(k));
    vec3 ql = p - (L - vec3(0.06, 0.03, 0.0));
    float bowl = max(sdEllipsoid(ql, vec3(0.075, 0.032, 0.06)), ql.y - 0.012);
    float spout = sdCapsule(ql, vec3(0.0, 0.006, 0.0), vec3(0.068, 0.018, 0.0), 0.014);
    float lamp = max(min(bowl, spout), -sdEllipsoid(ql - vec3(0.0, 0.014, 0.0), vec3(0.06, 0.02, 0.045)));
    if (lamp < d) { d = lamp; m = 12.0; }
    vec3 b0 = vec3(L.x - 0.06, L.y + 0.3, 0.24), b1 = vec3(L.x - 0.06, L.y + 0.3, L.z);
    float br = min(sdCapsule(p, b0, b1, 0.008), sdCapsule(p, b1, L - vec3(0.06, 0.0, 0.0), 0.003));
    if (br < d) { d = br; m = 8.0; }
  }
  return d;
}
float map(vec3 p) { float m; return mapM(p, m); }
` + YARD_MARCH(40.0, 110) + /* glsl */ `
vec3 coalCol() { return vec3(1.0, 0.32, 0.06) * (0.75 + 0.25 * vnoise(vec2(uTime * 2.3, 5.0)) + 0.15 * vnoise(vec2(uTime * 7.0, 1.0))); }
vec3 lampC(int k) { return LAMPC * flick(float(k) * 2.3 + 1.0) * 4.0; }
#define PL1 lampP(1)
vec3 l1Col() { return lampC(1); }

// light at p from the lamps and the coals (the nearest lamp casts a soft shadow)
vec3 lightAt(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float f0, bool shadows) {
  vec3 col = vec3(0);
  int kn = int(clamp(floor((1.5 - p.x) / 3.0 + 0.5), 0.0, float(NLP - 2)));
  for (int k = 0; k < NLP; k++) {
    vec3 L = lampP(k) + vec3(0, 0.03, 0);
    vec3 Lv = L - p; float d2 = dot(Lv, Lv);
    if (d2 > 60.0) continue;
    float sh = 1.0;
    if (shadows && k == kn) { float dl = sqrt(d2); sh = softShadow(p + n * 0.004, Lv / dl, dl - 0.3, 10.0); }
    col += pointLit(p, n, v, alb, rough, f0, L, lampC(k), 0.025) * sh;
  }
  col += pointLit(p, n, v, alb, max(rough, 0.25), f0, COALP + vec3(0.27, 0.06, 0.05), coalCol() * 0.5, 0.1);
  col += pointLit(p, n, v, alb, max(rough, 0.25), f0, COALP + vec3(-0.2, 0.06, -0.2), coalCol() * 0.5, 0.1);
  col += pointLit(p, n, v, alb, max(rough, 0.25), f0, COALP + vec3(-0.05, 0.06, 0.27), coalCol() * 0.5, 0.1);
  col += alb * vec3(0.03, 0.032, 0.05) * sat(0.3 + 0.7 * n.y) * (shadows ? 1.0 : 0.6);
  return col;
}

vec3 matOf(vec3 p, inout vec3 n, float m, out float rough, out float f0, out vec3 emit) {
  vec3 alb = vec3(0.1); rough = 0.7; f0 = 0.04; emit = vec3(0);
  if (m < 1.5) {
    // deck planks along x
    float pz = floor(p.z / 0.26);
    alb = cedarAlb(vec2(p.x + hash11(pz * 7.1) * 60.0, fract(p.z / 0.26) * 0.26 + hash11(pz) * 5.0), pz) * 0.6;
    float gz = fract(p.z / 0.26);
    alb *= 0.55 + 0.45 * smoothstep(0.0, 0.03, min(gz, 1.0 - gz));
    // dribbles of pitch and sawdust on the deck
    rough = 0.8;
  } else if (m < 2.5 || m > 2.5 && m < 4.5) {
    // bare cedar: strakes along x, ribs and boards up the y axis
    vec2 g = m < 2.5 ? vec2(p.x, p.y) : (m < 3.5 ? vec2(p.y, p.x + p.z) : vec2(p.y, p.z));
    float seed = m < 2.5 ? floor(p.y / 0.28) : (m < 3.5 ? floor(p.x / 1.5 + 0.5) + 20.0 : floor(p.z / 0.24) + 40.0);
    alb = cedarAlb(g, seed);
    if (m < 2.5) { float sy = fract(p.y / 0.28); alb *= 0.6 + 0.4 * smoothstep(0.0, 0.04, sy); }
    rough = 0.7;
  } else if (m < 5.5 || m > 5.5 && m < 6.5) {
    // wet pitch. stroke space: along x on the walls, along the handle on the brush, flat in the pot
    vec2 s; vec3 T, B;
    if (abs(n.z) > 0.6) { s = p.xy; T = vec3(1, 0, 0); B = vec3(0, 1, 0); }
    else if (abs(n.x) > 0.6) { s = vec2(p.z, p.y); T = vec3(0, 0, 1); B = vec3(0, 1, 0); }
    else { s = p.xz * 0.6 + 0.03 * vec2(sin(uTime * 1.3 + p.z * 40.0), cos(uTime * 1.1 + p.x * 37.0)); T = vec3(1, 0, 0); B = vec3(0, 0, 1); }
    float r0, r1, r2;
    float e = 0.0005; gLod = smoothstep(3.5, 0.9, length(p - uCamPos));
    float h0 = pitchH(s, 3.0, r0), hx = pitchH(s + vec2(e, 0), 3.0, r1), hy = pitchH(s + vec2(0, e), 3.0, r2);
    n = bump(n, T, B, (hx - h0) / e, (hy - h0) / e);
    alb = vec3(0.010, 0.008, 0.006); rough = r0; f0 = 0.05;
    // thin at the stroke ends: the cedar glows through a little
    if (abs(n.z) > 0.5) {
      float edge = pitchEdge(p.y) - p.x;
      alb = mix(vec3(0.12, 0.05, 0.015), alb, smoothstep(0.0, 0.08, edge));
    }
  } else if (m < 7.5) {
    alb = vec3(0.09, 0.085, 0.08) * (0.7 + 0.5 * fbm(p.xz * 12.0, 4)); rough = 0.9;
  } else if (m < 8.5) {
    alb = vec3(0.5, 0.3, 0.14) * (0.35 + 0.4 * fbm(p.xz * 40.0 + p.y * 20.0, 3)); rough = 0.4; f0 = 0.55;
  } else if (m < 9.5) {
    // coals: black crust over glowing cracks that breathe
    vec2 vo = voronoiEdge(p.xz * 22.0 + vec2(0.0, uTime * 0.05));
    float crack = smoothstep(0.12, 0.0, vo.x);
    float pulse = 0.6 + 0.4 * sin(uTime * 1.7 + vo.y * 30.0);
    alb = vec3(0.02); rough = 0.9;
    emit = coalCol() * (crack * 9.0 + 0.6 * pulse * (0.3 + vo.y)) * pulse;
  } else if (m < 10.5) {
    alb = clayAlb(p) * 0.9; rough = 0.8;
    // the pot is smeared black where pitch has run down it
    float run = smoothstep(0.55, 0.62, fbm(vec2(atan(p.z - POT.z, p.x - POT.x) * 3.0, p.y * 1.5), 3)) * smoothstep(0.55, 0.8, p.y);
    alb = mix(alb, vec3(0.01), run); rough = mix(rough, 0.12, run); f0 = mix(0.04, 0.05, run);
  } else if (m < 11.5) {
    alb = vec3(0.32, 0.2, 0.1) * (0.8 + 0.3 * fbm(p.xy * 40.0, 2)); rough = 0.45;
  } else if (m < 12.5) {
    alb = clayAlb(p); rough = 0.75;
  } else { alb = vec3(0.2, 0.17, 0.12); rough = 0.9; }
  return alb;
}

vec3 shadeP(vec3 p, vec3 n, vec3 v, float m, bool full) {
  float rough, f0; vec3 emit;
  vec3 alb = matOf(p, n, m, rough, f0, emit);
  vec3 col = lightAt(p, n, v, alb, rough, f0, full) + emit;
  if (full) {
    float ao = calcAO(p, n, 0.3);
    col *= 0.35 + 0.65 * ao;
    // wet pitch mirrors what's around it: one bounce
    if (rough < 0.2) {
      vec3 rr = reflect(-v, n);
      float F = schlick(f0, dot(n, v));
      float mr; float tr = march(p + n * 0.004, rr, mr);
      vec3 rc;
      if (tr > 0.0) {
        vec3 q = p + n * 0.004 + rr * tr; vec3 nq = calcN(q, 0.001);
        float r2, f2; vec3 e2; vec3 a2 = matOf(q, nq, mr, r2, f2, e2);
        rc = lightAt(q, nq, -rr, a2, r2, f2, false) + e2;
      } else rc = nightSky(rr) * 1.5;
      // the flames and the coals themselves in the reflection
      for (int k = 0; k < NLP; k++) {
        vec3 L = lampP(k);
        rc += flameAt(p, rr, L, 0.045, float(k) * 5.0 + 1.0, tr > 0.0 ? tr : 100.0, flick(float(k) * 2.3 + 1.0)) * 0.6;
      }
      col += rc * F * (1.0 - rough * 3.0);
    }
  }
  return col;
}

// steam rising from the pot: a few slices of turbulent density, lit warm from the coals and the lamp
vec4 steam(vec3 ro, vec3 rd, float depth) {
  vec3 c = POT + vec3(0.0, 0.84, 0.0);
  // bounding cylinder r 0.5 from y = c.y to c.y + 1.6
  vec3 acc = vec3(0); float tr = 1.0;
  vec2 oc = ro.xz - c.xz; float b = dot(oc, rd.xz), a = dot(rd.xz, rd.xz), cc = dot(oc, oc) - 0.25;
  float disc = b * b - a * cc; if (disc < 0.0) return vec4(0, 0, 0, 1);
  float t0 = max((-b - sqrt(disc)) / a, 0.0), t1 = min((-b + sqrt(disc)) / a, depth);
  if (t1 <= t0) return vec4(0, 0, 0, 1);
  float dt = (t1 - t0) / 14.0;
  float j = hash12(gl_FragCoord.xy + uJitter * 100.0);
  for (int i = 0; i < 14; i++) {
    float t = t0 + (float(i) + j) * dt;
    vec3 p = ro + rd * t;
    float h = p.y - c.y; if (h < 0.0 || h > 1.6) continue;
    vec3 q = p - c; q.xz -= vec2(0.12, -0.05) * h * h;   // drifts a little in the draught
    float rad = 0.08 + 0.22 * h;
    float den = smoothstep(rad, rad * 0.2, length(q.xz)) * fbm(vec3(q.x * 5.0, q.y * 3.0 - uTime * 0.9, q.z * 5.0), 4);
    den = max(den - 0.26, 0.0) * smoothstep(1.6, 0.3, h) * smoothstep(0.0, 0.1, h) * 2.2;
    vec3 li = coalCol() * 0.05 / (0.3 + h * h * 6.0) + l1Col() * 0.012 + vec3(0.03, 0.032, 0.045);
    acc += tr * den * dt * li * 3.0;
    tr *= exp(-den * dt * 3.0);
  }
  return vec4(acc, tr);
}

vec3 pitchScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float m; float t = march(ro, rd, m);
  vec3 col; float depth = 100.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t; depth = t;
    vec3 n = calcN(p, 0.0005 * max(t, 0.5));
    col = shadeP(p, n, -rd, m, true);
    col = mix(col, vec3(0.012, 0.012, 0.018), 1.0 - exp(-t * 0.02));
  } else col = nightSky(rd);
  vec4 st = steam(ro, rd, depth);
  col = col * st.a + st.rgb;
  for (int k = 0; k < NLP; k++) {
    vec3 L = lampP(k); vec3 lc = lampC(k);
    col += flameAt(ro, rd, L, 0.045, float(k) * 5.0 + 1.0, depth, flick(float(k) + 1.0));
    col += hazeGlow(ro, rd, L + vec3(0, 0.02, 0), lc, depth, 0.0018);
    col += lensGlow(ro, rd, L + vec3(0, 0.02, 0), lc, depth, 0.003, 0.03) * 0.5;
  }
  // the coals' glow in the smoky air, and sparks lifting off them now and then
  col += hazeGlow(ro, rd, COALP + vec3(0, 0.1, 0), coalCol(), depth, 0.0012);
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float per = 1.3 + hash11(fi) * 1.4;
    float ph = fract(uTime / per + hash11(fi * 3.3));
    float cyc = floor(uTime / per + hash11(fi * 3.3));
    vec3 sp = COALP + vec3((hash11(fi + cyc * 7.0) - 0.5) * 0.4, ph * 1.4, (hash11(fi * 5.0 + cyc) - 0.5) * 0.3) + vec3(sin(ph * 6.0 + fi) * 0.06, 0.0, 0.0);
    vec3 oc = sp - ro; float tc = dot(oc, rd);
    if (tc > 0.0 && tc < depth) {
      float h2 = max(dot(oc, oc) - tc * tc, 0.0);   // cancellation can make this slightly negative: 1/(2e-6 + h2) blew up
      col += vec3(1.0, 0.45, 0.1) * (1.0 - ph) * (1.0 - ph) * 0.000004 / (0.000002 + h2) * 0.6;
    }
  }
  return col;
}
`;
export const PITCH_FRAG = PITCH_GLSL + 'vec3 shade(vec2 fc) { return pitchScene(fc); }';
