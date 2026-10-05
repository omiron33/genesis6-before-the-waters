// The ark-builders' world, shared GLSL: Noe's hill at night by lamplight. Lens, night storm sky, lamps
// (clay oil lamps with real flame shape, flicker, haze glow and sphere-light highlights), and the two
// materials the ark is made of: honey cedar (grain, adze facets, end grain) and wet black pitch
// (brush strokes with bristle ridges, very low roughness, lamp highlights). Every scene of the ark world
// (s27..s31) prefixes its own map with YARD_COMMON and appends YARD_MARCH after its map.
// Everything is a pure function of uTime.

// lamps: [x, y, z, power, seed]; glsl const arrays from a JS list
export function lampsGLSL(lamps, name = 'L') {
  const n = lamps.length;
  const P = lamps.map((l) => `vec3(${l[0].toFixed(3)}, ${l[1].toFixed(3)}, ${l[2].toFixed(3)})`).join(', ');
  const I = lamps.map((l) => (l[3] ?? 1).toFixed(3)).join(', ');
  return `
#define ${name}N ${n}
const vec3 ${name}P[${n}] = vec3[${n}](${P});
const float ${name}I[${n}] = float[${n}](${I});
`;
}

export const YARD_UNIFORMS = { uFocus: 3.0, uAper: 0.0, uMoon: [-0.5, 0.55, -0.65] };

export const YARD_COMMON = /* glsl */ `
uniform float uFocus, uAper;
uniform vec3 uMoon;   // toward the moon behind the cloud deck (normalised in use)

// thin lens: the eye moves across the aperture and keeps looking at the focus plane
vec3 lensRay(vec2 fc, out vec3 ro, out vec3 rdPin) {
  vec3 rd0 = camRay(fc, ro); rdPin = rd0;
  if (uAper <= 0.0) return rd0;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}

// ---------------- light ----------------
const vec3 FLAMEC = vec3(1.0, 0.56, 0.22);
const vec3 LAMPC = vec3(1.0, 0.66, 0.36);    // the light a lamp throws (warmer-white than its flame's edge)
float flick(float s) { return 0.84 + 0.1 * vnoise(vec2(uTime * 7.3, s * 13.0)) + 0.06 * vnoise(vec2(uTime * 17.0, s * 7.0)); }

// GGX highlight from a sphere light of radius rl at distance dl (Karis' widening), already times n.l
float ggxSphere(vec3 n, vec3 L, vec3 v, float rough, float rl, float dl) {
  vec3 h = normalize(L + v);
  float nh = sat(dot(n, h)), nl = sat(dot(n, L)), nv = max(dot(n, v), 1e-3);
  float a = max(0.02, rough * rough);
  float a2r = sat(a + rl / (2.0 * dl));
  float norm = (a / a2r) * (a / a2r);
  float a2 = a2r * a2r;
  float d = nh * nh * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * d * d);
  float k = a2r * 0.5;
  float G = nl / (nl * (1.0 - k) + k) * nv / (nv * (1.0 - k) + k);
  return D * G * norm / (4.0 * nv);
}
float schlick(float f0, float c) { return f0 + (1.0 - f0) * pow(1.0 - sat(c), 5.0); }

// one point light: diffuse + specular contribution
vec3 pointLit(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float f0, vec3 lp, vec3 lc, float rl) {
  vec3 L = lp - p; float d2 = dot(L, L); float dl = sqrt(d2); L /= dl;
  float nl = sat(dot(n, L));
  vec3 E = lc / (d2 + 0.02);
  float F = schlick(f0, dot(normalize(L + v), v));
  // a broad second lobe gives glossy things their sheen round the hot spot
  float sp = ggxSphere(n, L, v, rough, rl, dl) + (rough < 0.2 ? 0.22 * ggxSphere(n, L, v, 0.3, rl, dl) + 0.06 * ggxSphere(n, L, v, 0.55, rl, dl) : 0.0);
  return E * (nl * alb * (1.0 - F) / PI + F * sp);
}

// haze glow of a light hanging in the air along the ray (analytic in-scatter of a point source)
vec3 hazeGlow(vec3 ro, vec3 rd, vec3 c, vec3 col, float depth, float k) {
  vec3 oc = c - ro; float tc = dot(oc, rd); float h2 = max(dot(oc, oc) - tc * tc, 1e-6); float h = sqrt(h2);
  float g = (atan((depth - tc) / h) + atan(tc / h)) / h;
  return col * g * k;
}
// what the lens sees round a bright flame (only where the flame itself is not hidden)
vec3 lensGlow(vec3 ro, vec3 rd, vec3 c, vec3 col, float depth, float r0, float r1) {
  vec3 oc = c - ro; float tc = dot(oc, rd);
  if (tc <= 0.0 || tc > depth + 0.05) return vec3(0);
  float hg = sqrt(max(dot(oc, oc) - tc * tc, 0.0)) / tc;   // angular
  return col * (0.5 * exp(-hg / r0) + 0.05 * exp(-hg / r1));
}

// an oil-lamp flame standing at b (base of the flame), height h, where the ray passes its axis
vec3 flameAt(vec3 ro, vec3 rd, vec3 b, float h, float seed, float depth, float amt) {
  if (amt <= 0.001) return vec3(0);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dd > 1e-6 ? dot(b.xz - ro.xz, dxz) / dd : 0.0;
  if (t <= 0.0 || t > depth + 0.01) return vec3(0);
  vec3 q = ro + rd * t - b;
  float hh = h * (0.88 + 0.24 * vnoise(vec2(uTime * 6.0 + seed, 1.0)));
  float y = q.y / hh;
  if (y < -0.4 || y > 1.5) return vec3(0);
  float sw = (vnoise(vec2(uTime * 1.9 + seed, 3.0)) - 0.5) * 0.7 + 0.25 * (vnoise(vec2(uTime * 9.0 + seed, 5.0)) - 0.5);
  vec2 rr = q.xz - normalize(vec2(-rd.z, rd.x) + 1e-5) * sw * hh * 0.3 * y * y;
  float x = length(rr) / (hh * 0.24);
  float yy = clamp(y, 0.0, 1.0);
  float prof = pow(yy, 0.45) * pow(1.0 - yy, 0.8) * 1.9 + 0.08;
  float body = smoothstep(1.0, 0.55, x / prof) * smoothstep(-0.15, 0.08, y) * smoothstep(1.15, 0.85, y);
  float core = smoothstep(0.55, 0.15, x / prof) * smoothstep(0.0, 0.2, y) * smoothstep(0.75, 0.35, y);
  float root = smoothstep(0.9, 0.3, x / prof) * smoothstep(0.25, 0.0, y) * smoothstep(-0.25, 0.0, y);
  vec3 c = FLAMEC * body * 6.0 + vec3(1.0, 0.86, 0.62) * core * 22.0 + vec3(0.15, 0.3, 1.0) * root * 1.2;
  return c * amt;
}

// dust and sawdust motes drifting in lamplight inside a box (centre c, half size hs), drawn as soft
// discs that blur with the lens (circle of confusion from uFocus/uAper)
vec3 motes(vec3 ro, vec3 rd, float depth, vec3 c, vec3 hs, vec3 lc, float k) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 48; i++) {
    float fi = float(i);
    vec3 h = hash33(vec3(fi, fi * 1.7, 3.3));
    vec3 mp = c + (h * 2.0 - 1.0) * hs;
    mp += vec3(sin(uTime * 0.31 + fi), 0.6 * sin(uTime * 0.23 + fi * 2.1) + 0.12 * uTime * (h.y - 0.3), cos(uTime * 0.27 + fi * 1.3)) * 0.12;
    mp.y = c.y - hs.y + mod(mp.y - (c.y - hs.y), 2.0 * hs.y);
    vec3 oc = mp - ro; float tc = dot(oc, rd);
    if (tc <= 0.9 || tc > depth) continue;
    float hh = sqrt(max(dot(oc, oc) - tc * tc, 0.0));
    float coc = 0.0006 + uAper * abs(tc - uFocus) / max(uFocus, 0.1);
    float r = max(min(coc, 0.0025), 0.0006 * tc / 1.5);
    float a = smoothstep(r, r * 0.6, hh) * (0.0008 * 0.0008) / (r * r);
    float tw = 0.5 + 0.5 * sin(uTime * 3.0 + fi * 5.0);
    acc += lc * vec3(1.0, 0.7, 0.4) * a * (0.4 + 0.6 * tw) * k * 0.6 / max(dot(mp - c, mp - c) + 0.3, 0.3);
  }
  return acc;
}

// ---------------- the night sky ----------------
// bruised storm cloud at night, faintly moonlit from behind the cloud deck, the far storm flickering
float flash(float t) {
  float k = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float per = 2.3 + fi * 1.1;
    float c = floor(t / per), x = t - c * per - per * hash11(c * 3.1 + fi);
    k += step(0.0, x) * exp(-x * 14.0) * (0.6 + 0.6 * sin(x * 70.0)) * step(0.55, hash11(c * 7.7 + fi * 3.0));
  }
  return k;
}
vec3 nightSky(vec3 rd) {
  float y = rd.y;
  vec3 hor = vec3(0.034, 0.036, 0.050), zen = vec3(0.012, 0.011, 0.022);
  vec3 c = mix(hor, zen, sat(y * 2.2));
  // cloud deck: slab lit from above-behind by a hidden moon
  vec2 uv = rd.xz / max(y + 0.12, 0.05);
  vec2 dr = vec2(uTime * 0.018, uTime * 0.006);
  float f = fbm(uv * 0.55 + dr, 5);
  float g = fbm(uv * 1.6 - dr * 1.7 + 4.0, 4);
  float cl = smoothstep(0.35, 0.8, f * 0.75 + g * 0.35);
  vec3 moonDir = normalize(uMoon);
  float m = pow(sat(dot(rd, moonDir)), 6.0);
  vec3 lit = vec3(0.075, 0.072, 0.115) * (0.5 + 1.6 * m) * (0.6 + 0.8 * g);
  vec3 dark = vec3(0.016, 0.014, 0.026);
  c = mix(c, mix(dark, lit, smoothstep(0.45, 0.85, g)), cl * smoothstep(-0.05, 0.12, y));
  // thin moon-edges of the clouds (silver lining)
  c += vec3(0.05, 0.055, 0.08) * m * smoothstep(0.55, 0.62, f) * smoothstep(0.75, 0.62, f) * 1.5;
  // far valley fires: a faint ember band low in the south-east
  float az = atan(rd.x, rd.z);
  c += vec3(0.05, 0.012, 0.003) * exp(-max(y, 0.0) * 30.0) * smoothstep(0.6, 1.0, cos(az - 2.3)) * 0.6;
  // the storm wall on the far horizon (north), lit from within now and then
  float sw = smoothstep(0.3, 0.0, y) * smoothstep(0.2, 0.9, cos(az + 0.5));
  c += vec3(0.30, 0.32, 0.45) * flash(uTime) * sw * (0.3 + 0.7 * fbm(uv * 1.3 + 9.0, 3)) * 0.35;
  return c;
}

// ---------------- materials ----------------
// honey cedar. g.x along the grain (metres), g.y across it; returns albedo (linear)
vec3 cedarAlb(vec2 g, float seed) {
  float w = fbm(vec2(g.x * 0.35, g.y * 9.0) + seed * 7.0, 4);
  float lines = sin((g.y + 0.04 * fbm(vec2(g.x * 0.8, seed), 3)) * 160.0 + w * 14.0) * 0.5 + 0.5;
  vec3 a = mix(vec3(0.30, 0.135, 0.050), vec3(0.62, 0.32, 0.12), w);
  a *= 0.78 + 0.22 * pow(lines, 3.0);
  // a knot now and then
  vec2 kc = vec2(floor(g.x / 0.9) * 0.9 + 0.45, 0.0);
  float kk = hash11(floor(g.x / 0.9) + seed * 31.0);
  if (kk > 0.82) { float r = length((g - vec2(kc.x, (kk - 0.9) * 0.6)) * vec2(0.6, 2.0)); a *= mix(0.5, 1.0, smoothstep(0.008, 0.03, r)); }
  return a;
}
// cedar end grain (the cut face of a squared beam): growth rings round an off-centre pith
vec3 cedarEnd(vec2 q, float seed) {
  vec2 c = (hash22(vec2(seed, 3.0)) - 0.5) * 0.12;
  float r = length(q - c) + 0.01 * fbm(q * 30.0 + seed, 3);
  float ring = sin(r * 230.0) * 0.5 + 0.5;
  vec3 a = mix(vec3(0.55, 0.28, 0.10), vec3(0.36, 0.16, 0.06), pow(ring, 2.0));
  a *= 0.85 + 0.15 * fbm(q * 80.0, 2);
  // radial checks (drying cracks)
  float ang = atan(q.y - c.y, q.x - c.x);
  float ck = smoothstep(0.985, 1.0, sin(ang * 3.0 + seed * 5.0)) * smoothstep(0.03, 0.12, r);
  return a * (1.0 - 0.7 * ck);
}

// wet pitch over a surface. s = stroke-space coords (x along the brushing direction, y across);
// returns height (for bump), roughness out
float gLod = 1.0;   // fades the finest relief with distance (set by the caller)
float pitchH(vec2 s, float seed, out float rough) {
  // strokes: bands across, each with its own offset along and slight wander
  float band = floor(s.y / 0.11 + 0.3 * fbm(vec2(s.x * 0.7, seed), 2));
  float bs = hash11(band * 7.3 + seed);
  float yy = fract(s.y / 0.11 + 0.3 * fbm(vec2(s.x * 0.7, seed), 2));
  // bristle ridges along the stroke
  // bristle ridges: shallow, broken, a few per stroke (not a fine hairline texture)
  float br = vnoise(vec2(s.x * 9.0 + bs * 10.0, yy * 9.0 + band * 40.0));
  float br2 = vnoise(vec2(s.x * 22.0, yy * 20.0 + band * 13.0));
  // stroke edges pile up a ridge of pitch
  float edge = smoothstep(0.75, 1.0, yy) + smoothstep(0.2, 0.0, yy);
  // slow sag (the pitch is still flowing)
  float sag = vnoise(vec2(s.x * 1.4 + bs * 5.0, s.y * 2.0 - uTime * 0.03)) * 0.6;
  rough = 0.05 + 0.04 * br2 * gLod + 0.05 * vnoise(vec2(s.x * 2.0, s.y * 3.0) + 11.0) + 0.04 * (1.0 - gLod);
  return (0.0005 * br + 0.00012 * br2) * gLod + 0.0009 * edge + 0.004 * sag;
}

// bump a normal by a height field h(u,v) given its finite-difference slopes (dh/du, dh/dv) and the
// surface tangent frame T,B
vec3 bump(vec3 n, vec3 T, vec3 B, float dhdu, float dhdv) { return normalize(n - T * dhdu - B * dhdv); }

// clay (lamp bodies, pots)
vec3 clayAlb(vec3 p) { return vec3(0.30, 0.14, 0.07) * (0.75 + 0.35 * fbm(p.xz * 40.0 + p.y * 30.0, 3)); }
// packed earth with sawdust and chips
vec3 earthAlb(vec2 q) {
  float f = fbm(q * 1.3, 4), g = fbm(q * 9.0 + 3.0, 3);
  vec3 a = mix(vec3(0.050, 0.038, 0.028), vec3(0.11, 0.08, 0.05), f);
  float dust = smoothstep(0.55, 0.75, fbm(q * 3.0 + 7.0, 3));
  a = mix(a, vec3(0.30, 0.18, 0.08), dust * 0.55);
  float chip = smoothstep(0.82, 0.9, hash12(floor(q * 28.0)));
  a = mix(a, vec3(0.42, 0.24, 0.10), chip * 0.6 * g);
  return a;
}
`;

// march helpers: need the scene's float map(vec3 p) and float mapM(vec3 p, out float m)
export const YARD_MARCH = (maxT = 80.0, steps = 140) => /* glsl */ `
vec3 calcN(vec3 p, float eps) {
  const vec2 e = vec2(1.0, -1.0);
  return normalize(e.xyy * map(p + e.xyy * eps) + e.yyx * map(p + e.yyx * eps) + e.yxy * map(p + e.yxy * eps) + e.xxx * map(p + e.xxx * eps));
}
float march(vec3 ro, vec3 rd, out float m) {
  // a per-pixel jitter of the step breaks the banding of slow, grazing marches
  float jit = hash12(gl_FragCoord.xy + uJitter * 97.0);
  float t = 0.01 + 0.004 * jit; m = -1.0;
  for (int i = 0; i < ${steps}; i++) {
    vec3 p = ro + rd * t;
    float d = mapM(p, m);
    if (abs(d) < 0.0004 * t + 0.0002) return t;
    t += d * (0.78 + 0.14 * jit);
    if (t > ${maxT.toFixed(1)}) break;
  }
  m = -1.0; return -1.0;
}
float softShadow(vec3 p, vec3 L, float maxd, float k) {
  float res = 1.0, t = 0.03;
  for (int i = 0; i < 32; i++) {
    float h = map(p + L * t);
    res = min(res, k * h / t);
    t += clamp(h, 0.015, 0.35);
    if (res < 0.01 || t > maxd) break;
  }
  return sat(res);
}
float calcAO(vec3 p, vec3 n, float s) {
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = s * float(i) / 5.0; o += w * (h - map(p + n * h)); w *= 0.6; }
  return sat(1.0 - 2.2 * o / s);
}
`;
