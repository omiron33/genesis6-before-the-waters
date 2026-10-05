// s27's world: Noe's timber yard on the hill at night. One clay oil lamp hangs from a post over a
// squared cedar beam lying on two trestles; the beam's top and side are dressed with the adze (shallow
// scalloped facets), curls of shaving lie on it and on the ground, an adze and a mallet rest where they
// were set down. Behind, a stack of squared beams with their cut ends; far off, the keel of the ark on
// its slipway with its first frames standing up into the storm sky, small lamps at their feet.
// Ground y = 0, beam along x. uFar fades the far lamps up after the opening (the one lamp in darkness).
import { YARD_COMMON, YARD_MARCH, YARD_UNIFORMS, lampsGLSL } from './x-yard.js';

export const LAMP = [-0.24, 1.665, 0.55];          // the hanging lamp's flame base
export const FAR_LAMPS = [[17.5, 1.25, -2.0, 1.0, 1], [24.0, 1.25, -9.0, 0.8, 2], [33.0, 1.25, -2.4, 0.9, 3], [46.0, 1.25, -8.0, 0.8, 4], [60.0, 1.25, -2.8, 0.8, 5], [75.0, 1.25, -9.5, 0.8, 6]];

export const BEAM_UNIFORMS = { ...YARD_UNIFORMS, uFar: 0.0 };

export const BEAM_GLSL = YARD_COMMON + lampsGLSL(FAR_LAMPS, 'F') + /* glsl */ `
uniform float uFar;
const vec3 LAMP = vec3(${LAMP.join(', ')});
vec3 lampPos() { return LAMP + vec3(0.0, 0.03, 0.0); }

float sdTrap(vec3 p, vec3 a, vec3 b, float r) { return sdCapsule(p, a, b, r); }
// a curl of shaving: a thin ribbon wound in a loose spiral (about one and a half turns) round local y,
// tapering in width toward its outer end
float sdCurl(vec3 p, float R, float w, float open) {
  float ang = atan(p.z, p.x) + PI + open;
  ang = mod(ang, 2.0 * PI);
  float r = length(p.xz);
  float d = 1e9;
  for (int n = 0; n < 2; n++) {
    float a = ang + 2.0 * PI * float(n);
    if (a > 9.0) continue;                         // ~1.45 turns
    float rr = R * (0.55 + 0.11 * a);              // the spiral opens outward
    float ww = w * (1.0 - 0.05 * a);               // tapering
    vec2 q = vec2(r - rr, p.y + 0.002 * sin(a * 3.0));
    d = min(d, length(max(abs(q) - vec2(0.00035, ww), 0.0)) - 0.0002);
  }
  return d;
}
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, s, 0, -s, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0, -s, c, 0, 0, 0, 1); }

const vec3 BC = vec3(0.0, 0.84, 0.0), BH = vec3(3.0, 0.16, 0.17);

float ground(vec3 p) { float r = length(p.xz - vec2(10.0, 0.0)); return p.y + 0.02 * fbm(p.xz * 0.8, 3) + max(r - 70.0, 0.0) * 0.12; }

float mapM(vec3 p, out float m) {
  float d = ground(p); m = 1.0;
  // the beam
  float b = sdBox(p - BC, BH) - 0.004;
  if (b < d) { d = b; m = 2.0; }
  // trestles: a cross bar and two splayed pairs of legs each
  for (int k = 0; k < 2; k++) {
    float x = k == 0 ? -2.2 : 2.25;
    float bar = sdBox(p - vec3(x, 0.63, 0.0), vec3(0.06, 0.045, 0.42)) - 0.006;
    float lg = 1e9;
    for (int s = 0; s < 2; s++) {
      float z = s == 0 ? -0.33 : 0.33;
      lg = min(lg, sdCapsule(p, vec3(x - 0.32, 0.0, z), vec3(x - 0.03, 0.6, z), 0.035));
      lg = min(lg, sdCapsule(p, vec3(x + 0.32, 0.0, z), vec3(x + 0.03, 0.6, z), 0.035));
    }
    float tr = min(bar, lg);
    if (tr < d) { d = tr; m = 3.0; }
  }
  // near things only when near the beam top
  if (p.y < 1.25 && abs(p.x) < 3.5 && abs(p.z) < 0.9) {
    // the adze, lying on the beam: ash handle and a bronze blade bent at right angles
    vec3 q = rotY(0.5) * (p - vec3(0.62, 1.0 + 0.019, 0.02));
    float hd = sdCapsule(q, vec3(-0.27, 0.0, 0.0), vec3(0.22, 0.0, 0.0), 0.017);
    if (hd < d) { d = hd; m = 5.0; }
    vec3 qb = q - vec3(0.25, -0.004, 0.0);
    float bl = sdBox(qb - vec3(0.0, 0.0, 0.055), vec3(0.028 - 0.012 * sat((qb.z - 0.05) / 0.08), 0.009 + 0.004 * sat(-qb.z * 8.0), 0.075)) - 0.003;
    float sock = sdBox(qb, vec3(0.034, 0.018, 0.022)) - 0.004;
    float ad = min(bl, sock);
    if (ad < d) { d = ad; m = 4.0; }
    // the mallet: a turned head and a handle, head lying on its side
    vec3 qm = rotY(-0.35) * (p - vec3(1.42, 1.0 + 0.068, -0.02));
    vec2 hc = vec2(length(qm.xy) - 0.058, abs(qm.z) - 0.1);
    float head = min(max(hc.x, hc.y), 0.0) + length(max(hc, 0.0)) - 0.007;
    float hand = sdCapsule(qm, vec3(0.0, -0.048, 0.0), vec3(-0.36, -0.05, 0.0), 0.016);
    float ml = min(head, hand);
    if (ml < d) { d = ml; m = 6.0; }
    // curls of shaving on the beam top
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      vec3 c = vec3(-1.6 + fi * 0.33 + 0.12 * hash11(fi * 3.3), 1.0 + 0.02, -0.08 + 0.16 * hash11(fi * 5.1));
      vec3 qc = rotX(1.45) * rotY(hash11(fi * 9.1) * 6.28) * (p - c);
      float sh = sdCurl(qc, 0.018 + 0.008 * hash11(fi), 0.011, hash11(fi * 2.0) * 6.28);
      if (sh < d) { d = sh; m = 7.0; }
    }
  }
  // curls on the ground under the beam (cells)
  if (p.y < 0.08 && abs(p.x) < 3.6 && abs(p.z) < 1.3) {
    vec2 cc = floor(p.xz / 0.16);
    float hsh = hash12(cc * 1.7 + 4.0);
    if (hsh > 0.8) {
      vec2 o = (cc + 0.3 + 0.4 * hash22(cc)) * 0.16;
      vec3 qc = rotX(1.2 + 0.4 * hash12(cc + 9.0)) * rotY(hsh * 30.0) * (p - vec3(o.x, 0.012, o.y));
      float sh = sdCurl(qc, 0.015 + 0.01 * hash12(cc + 3.0), 0.01, hsh * 40.0);
      if (sh < d) { d = sh; m = 7.0; }
    }
  }
  // the stack of squared beams behind
  {
    vec3 q = p - vec3(-0.6, 0.0, -2.2);
    if (abs(q.z) < 1.0 && q.y < 1.0) {
      float zi = clamp(floor(q.z / 0.31 + 0.5), -2.0, 2.0);
      float yi = clamp(floor(q.y / 0.3), 0.0, 2.0);
      if (yi > 1.5 && abs(zi) > 1.5) yi = 1.0;
      vec3 c = vec3(0.15 * hash11(zi * 3.0 + yi), yi * 0.3 + 0.145, zi * 0.31);
      float sb = sdBox(q - c, vec3(3.2, 0.14, 0.145)) - 0.006;
      if (sb < d) { d = sb; m = 8.0; }
    } else d = min(d, max(sdBox(q - vec3(0.0, 0.5, 0.0), vec3(3.5, 0.5, 0.85)), 0.05));
  }
  // the post, its arm and the lamp hanging from it
  {
    float po = sdBox(p - vec3(-0.3, 1.18, -0.78), vec3(0.06, 1.18, 0.06)) - 0.005;
    po = min(po, sdBox(p - vec3(-0.3, 2.27, -0.12), vec3(0.04, 0.04, 0.72)) - 0.004);
    po = min(po, sdCapsule(p, vec3(-0.3, 1.95, -0.75), vec3(-0.3, 2.24, -0.38), 0.025));   // a brace
    if (po < d) { d = po; m = 9.0; }
    float cord = sdCapsule(p, vec3(-0.3, 2.23, 0.55), vec3(-0.3, 1.66, 0.55), 0.0035);
    if (cord < d) { d = cord; m = 11.0; }
    vec3 ql = p - vec3(-0.3, 1.635, 0.55);
    float bowl = sdEllipsoid(ql, vec3(0.075, 0.032, 0.06));
    bowl = max(bowl, ql.y - 0.012);
    float spout = sdCapsule(ql, vec3(0.0, 0.006, 0.0), vec3(0.068, 0.018, 0.0), 0.014);
    float lamp = min(bowl, spout);
    lamp = max(lamp, -sdEllipsoid(ql - vec3(0.0, 0.014, 0.0), vec3(0.06, 0.02, 0.045)));
    if (lamp < d) { d = lamp; m = 10.0; }
  }
  // far: the keel on its slipway and the first frames of the ark
  if (p.x > 12.0) {
    vec3 q = p - vec3(0.0, 0.0, -15.0);
    float keel = sdBox(q - vec3(52.0, 0.75, 0.0), vec3(38.0, 0.3, 0.5));
    float xi = clamp(floor((q.x - 16.0) / 2.6 + 0.5), 0.0, 26.0);
    float x0 = 16.0 + xi * 2.6;
    float h = xi < 9.5 ? 12.4 : 12.4 * sat(1.0 - (xi - 9.0) / 9.0) + 1.0;
    float rib = sdBox(vec3(q.x - x0, q.y - 0.6 - h * 0.5, abs(q.z) - 11.4), vec3(0.16, h * 0.5, 0.18));
    rib = min(rib, sdBox(vec3(q.x - x0, q.y - 0.95, q.z), vec3(0.16, 0.18, 11.4)));
    // blocks of the slipway
    float bk = sdBox(vec3(mod(q.x, 3.0) - 1.5, q.y - 0.25, q.z), vec3(0.3, 0.25, 6.0));
    bk = max(bk, abs(q.x - 52.0) - 38.0);
    float pl = sdBox(vec3(q.x - 32.0, q.y - 0.6 - 1.4, abs(q.z) - 11.55), vec3(16.0, 1.4 - 0.9 * sat((q.x - 22.0) / 26.0), 0.05));
    float a = min(min(keel, rib), min(bk, pl));
    if (a < d) { d = a; m = 12.0; }
  }
  return d;
}
float map(vec3 p) { float m; return mapM(p, m); }
` + YARD_MARCH(140.0, 100) + /* glsl */ `
vec3 farLampCol(int i) { return LAMPC * FI[i] * uFar * flick(float(i) * 3.0 + 20.0) * 1.6; }
vec3 lampCol() { return LAMPC * flick(1.0) * 1.6; }

vec3 shadeHit(vec3 p, vec3 n, vec3 v, float m, float t) {
  vec3 alb = vec3(0.1); float rough = 0.7, f0 = 0.04;
  vec3 emit = vec3(0);
  if (m < 1.5) {
    alb = earthAlb(p.xz);
    rough = 0.95;
  } else if (m < 2.5 || m > 7.5 && m < 8.5) {
    // squared cedar: grain along x; adze facets on the top and sides (shallow scallops in rows)
    vec3 q = m < 2.5 ? p - BC : p;
    float seed = m < 2.5 ? 1.0 : floor((p.z + 2.2) / 0.31 + 0.5) * 3.0 + floor(p.y / 0.3) + 7.0;
    vec2 g;
    vec3 an = abs(n);
    if (an.x > 0.7) {
      // cut end
      alb = cedarEnd(vec2(p.z, p.y) - (m < 2.5 ? BC.zy : vec2(floor((p.z + 2.2) / 0.31 + 0.5) * 0.31 - 2.2, floor(p.y / 0.3) * 0.3 + 0.145)), seed);
      rough = 0.8;
    } else {
      float across = an.y > 0.7 ? p.z : p.y;
      g = vec2(p.x, across);
      alb = cedarAlb(g, seed) * vec3(0.95, 0.9, 0.92);
      // adze facets: irregular shallow scoops, wide across the grain and short along it, overlapping
      // as the blade was swung; only on the dressed top, the sides are hewn smoother
      float sideK = an.y > 0.7 ? 1.0 : 0.3;
      vec2 sq = vec2(p.x * 11.0, across * 3.5) + vec2(0.0, seed * 3.1);
      float e = 0.004;
      float h0 = fbm(sq, 3), hx = fbm(sq + vec2(e * 11.0, 0.0), 3), hy = fbm(sq + vec2(0.0, e * 3.5), 3);
      // the scoops' crisp ridges: a ridged component of the same field
      float r0 = 1.0 - abs(2.0 * vnoise(sq * vec2(1.0, 0.7) + 7.0) - 1.0);
      float r1 = 1.0 - abs(2.0 * vnoise((sq + vec2(e * 11.0, 0.0)) * vec2(1.0, 0.7) + 7.0) - 1.0);
      float dh = ((hx - h0) / e * 0.006 + (r1 - r0) / e * 0.003) * sideK;
      float da = (hy - h0) / e * 0.004 * sideK;
      // fine grain relief running along the beam
      float gr = vnoise(vec2(p.x * 3.0, across * 400.0));
      float gr2 = vnoise(vec2(p.x * 3.0, (across + e) * 400.0));
      da += (gr2 - gr) / e * 0.00006;
      vec3 T = vec3(1, 0, 0);
      vec3 B = an.y > 0.7 ? vec3(0, 0, 1) : vec3(0, 1, 0);
      float k = m < 2.5 ? 1.0 : 0.4;
      n = bump(n, T, B, dh * k, da * k);
      alb *= 0.9 + 0.2 * r0 * sideK;
      // fresh-cut facets: paler at their ridges, darker in the scoops
      rough = 0.72; f0 = 0.03;
    }
  } else if (m < 3.5 || m > 8.5 && m < 9.5) {
    // rough-hewn trestle and post: older, greyer timber
    alb = cedarAlb(vec2(p.y * 3.0 + p.x, p.z + p.x), 5.0) * vec3(0.7, 0.68, 0.66);
    rough = 0.85;
  } else if (m < 4.5) {
    // bronze adze blade: dark patina, a bright honed edge
    alb = vec3(0.55, 0.33, 0.16) * (0.45 + 0.4 * fbm(p.xz * 90.0, 3));
    rough = 0.32; f0 = 0.6;
  } else if (m < 5.5 || m > 5.5 && m < 6.5) {
    // handles and mallet: worn ash, polished by hands
    alb = vec3(0.36, 0.22, 0.11) * (0.8 + 0.3 * fbm(p.xz * 50.0 + p.y * 9.0, 3));
    rough = m < 5.5 ? 0.38 : 0.55;
  } else if (m < 7.5) {
    // fresh shaving: pale honey, fine grain lines, thin enough for the lamp to glow through
    alb = vec3(0.72, 0.44, 0.19) * (0.85 + 0.2 * vnoise(p.xz * 300.0));
    rough = 0.55;
    vec3 Lt = normalize(lampPos() - p);
    float dl2 = dot(lampPos() - p, lampPos() - p);
    emit = vec3(1.0, 0.55, 0.22) * alb * lampCol() * 0.35 * sat(dot(-n, Lt) + 0.2) / (dl2 + 0.02);
  } else if (m < 10.5) {
    alb = clayAlb(p); rough = 0.75;
    // the oil inside the bowl lit by the flame
    if (p.y > LAMP.y - 0.02 && length(p.xz - vec2(-0.3, 0.55)) < 0.055) { alb = vec3(0.04, 0.03, 0.01); rough = 0.1; f0 = 0.05; }
  } else if (m < 11.5) {
    alb = vec3(0.2, 0.17, 0.12); rough = 0.9;
  } else {
    // the frames and first strakes: vertical grain on the ribs, horizontal strakes with dark seams
    bool strake = abs(abs(p.z + 15.0) - 11.55) < 0.07 && p.y < 3.6;
    if (strake) {
      float sy = fract((p.y - 0.6) / 0.31);
      float row = floor((p.y - 0.6) / 0.31);
      alb = cedarAlb(vec2(p.x + row * 7.3, sy * 0.31), row + 9.0) * (0.55 + 0.45 * smoothstep(0.0, 0.05, sy) * smoothstep(1.0, 0.95, sy));
      float bt = fract((p.x + hash11(row) * 4.0) / 4.7);
      alb *= 0.6 + 0.4 * smoothstep(0.0, 0.004, bt);
    } else alb = cedarAlb(vec2(p.y, p.x + p.z), floor(p.x / 2.6) + 9.0) * 0.75;
    rough = 0.8;
  }
  vec3 col = vec3(0);
  // the hanging lamp: key light, with soft shadow
  vec3 lp = lampPos();
  vec3 Lv = lp - p; float dl = length(Lv);
  float sh = 1.0;
  if (dl < 8.0) sh = softShadow(p + n * 0.004, Lv / dl, dl - 0.3, 10.0);
  col += pointLit(p, n, v, alb, rough, f0, lp, lampCol() * 1.6, 0.02) * sh;
  // far lamps at the keel
  for (int i = 0; i < FN; i++) col += pointLit(p, n, v, alb, rough, f0, FP[i], farLampCol(i) * 40.0, 0.1);
  // the night: cool skylight, occluded
  float ao = calcAO(p, n, m > 11.5 ? 2.0 : 0.25);
  col += alb * vec3(0.03, 0.032, 0.05) * (0.45 + 0.55 * n.y) * ao;
  col += emit;
  return col;
}

vec3 yardBeam(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float m; float t = march(ro, rd, m);
  // grazing rays over the yard can run out of steps: finish them on the ground plane
  if (t < 0.0 && rd.y < -0.002) { float tg = -ro.y / rd.y; if (tg < 70.0) { t = tg; m = 1.0; } }
  vec3 col; float depth = 400.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t; depth = t;
    vec3 n = calcN(p, 0.0006 * max(t, 0.5));
    col = shadeHit(p, n, -rd, m, t);
    // night haze
    float fo = 1.0 - exp(-t * 0.006);
    col = mix(col, vec3(0.010, 0.011, 0.017), fo);
  } else {
    col = nightSky(rd);
  }
  // the lamp: flame, the haze it hangs in and the glow round it on the lens
  vec3 lp = LAMP;
  col += flameAt(ro, rd, lp, 0.045, 1.0, depth, flick(1.0));
  col += hazeGlow(ro, rd, lp + vec3(0, 0.02, 0), lampCol(), depth, 0.0016);
  col += lensGlow(ro, rd, lp + vec3(0, 0.02, 0), lampCol(), depth, 0.0035, 0.03) * 0.6;
  col += motes(ro, rd, depth, LAMP + vec3(0.3, -0.35, -0.2), vec3(1.6, 0.7, 0.9), lampCol() * 0.6, 40.0);
  for (int i = 0; i < FN; i++) {
    vec3 c = FP[i];
    col += flameAt(ro, rd, c - vec3(0, 0.06, 0), 0.22, float(i) * 7.0, depth, uFar * FI[i]);
    col += hazeGlow(ro, rd, c, farLampCol(i), depth, 0.012);
  }
  return col;
}
`;

export const BEAM_FRAG = BEAM_GLSL + 'vec3 shade(vec2 fc) { return yardBeam(fc); }';
