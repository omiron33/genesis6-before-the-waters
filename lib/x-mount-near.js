// Close things on the holy mountain, in metres around their own origins: the rough stone altar on the
// crest with its coals and its thin smoke (which the wind can bend and tear away), the stone ledge at
// the cliff edge with its row of small clay lamps, lamps carried down the path (the bearers unseen)
// and lamps set down at the foot of the path. Included by lib/x-mount.js (which defines ground(),
// PATHV, KEY and the lights of the valley).
export const NEAR_UNIFORMS = {
  uAltar: [0, 1, 1],      // on (0/1), coals (0..1.5), smoke amount (0..1)
  uSmokeBend: 0.0,        // 0 straight .. 1 torn away by the wind
  uLedge: [0.9, 0.0, 1],  // ledge x, z offset from the crest (km), on
  uLampMode: 0,           // 0 none, 1 carried on the path, 2 the ledge row, 3 set down at the foot
  uSetS: [0, 0, 0, 0, 0, 0], // set-down lamps: km along the path (0 = unused)
  uLampHalo: 1.0,
  uGateOn: 0, uGateFlare: 0, uDoorOpen: 1.2,   // the bronze gate of the first city: shown, pale flare 0..1, leaves open (rad)
  // the fallen ones as cold burning lights: per light x, y, z (km), brightness, trail x, y, z (km,
  // pointing back along the way it came), wings 0..1
  uWat: new Array(64).fill(0), uWatN: 0, uWatSize: 1.0,
};

export const NEAR_GLSL = /* glsl */ `
uniform vec3 uAltar, uLedge;
uniform float uSmokeBend, uLampMode, uLampHalo;
uniform float uSetS[6];
uniform float uWat[64];
uniform float uWatN, uWatSize;
uniform float uGateFlare, uDoorOpen;
vec3 GATE;
const vec3 COLD = vec3(0.68, 0.82, 1.0);
vec3 watP(int i) { return vec3(uWat[i * 8], uWat[i * 8 + 1], uWat[i * 8 + 2]); }
float watK(int i) { return uWat[i * 8 + 3] * (0.9 + 0.1 * sin(uTime * 17.0 + float(i) * 2.1) * sin(uTime * 7.3 + float(i))); }
vec3 watT(int i) { return vec3(uWat[i * 8 + 4], uWat[i * 8 + 5], uWat[i * 8 + 6]); }
float watW(int i) { return uWat[i * 8 + 7]; }
// the cold light they throw on the land: soft, bluish, no warmth in it
vec3 watcherLit(vec3 p, vec3 n) {
  vec3 c = vec3(0);
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uWatN) break;
    vec3 L = watP(i) - p; float d2 = dot(L, L);
    c += COLD * watK(i) * 0.00022 * sat(dot(n, L * inversesqrt(d2)) * 0.6 + 0.4) / (d2 + 0.0006);
  }
  return c;
}
// the lights themselves: a small hard white core with a slow cold shimmer, faint six-point spikes,
// a thin trail along the way they came, and a vast, feathered veil of light about them like an aurora
vec3 RD0;   // the pinhole ray: the lights' bokeh is drawn analytically, not by aperture samples
vec3 watcherAir(vec3 roL, vec3 rdL, float tHit) {
  vec3 acc = vec3(0);
  vec3 ro = uCamPos, rd = RD0;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uWatN) break;
    vec3 P = watP(i); float k = watK(i);
    if (k <= 0.0) continue;
    float fi = float(i);
    float shimmer = 0.8 + 0.2 * sin(uTime * 2.3 + fi * 1.9) * sin(uTime * 0.9 + fi) + 0.08 * vnoise(vec2(uTime * 11.0, fi * 7.0));
    vec3 oc = P - ro; float tc = dot(oc, rd);
    float dist = length(oc);
    // the trail: a thin luminous thread back along the way it came, fading
    vec3 T = watT(i);
    float tl = length(T);
    if (tl > 1e-5) {
      vec3 td = T / tl;
      vec3 w0 = ro - P; float b = dot(rd, td), d = dot(rd, w0), e = dot(td, w0);
      float den = max(1.0 - b * b, 1e-6);
      float tcs = clamp((e - b * d) / den, 0.0, tl);
      float sc = max(dot(P + td * tcs - ro, rd), 0.0);
      if (sc < tHit) {
        float dd = length(ro + rd * sc - (P + td * tcs));
        float f = tcs / tl;
        float ang = dd / max(sc, 1e-4);
        float fade = pow(max(1.0 - f, 0.0), 1.6) * (0.75 + 0.25 * vnoise(vec2(f * 30.0 - uTime * 6.0, fi)));
        acc += COLD * k * fade * (exp(-ang / 0.00035) * 1.4 + exp(-ang / 0.003) * 0.05);
      }
    }
    if (tc <= 0.0 || tc > tHit + 0.002) continue;
    vec3 off = oc - rd * tc;
    float a = dot(off, uu) / tc, bb = dot(off, vv) / tc;
    float ang = length(vec2(a, bb));
    float s0 = 0.0006 * uWatSize;           // the core's apparent radius (rad)
    float coc = uAper * abs(1.0 / dist - 1.0 / max(uFocus, 1e-4));   // the lens's blur circle (rad)
    float s = s0 + coc;
    float dim = (s0 * s0) / (s * s);
    acc += vec3(0.9, 0.95, 1.0) * k * shimmer * (coc > s0 ? smoothstep(s, s * 0.85, ang) * 1.3 * max(dim, 0.004) * 30.0 : exp(-pow(ang / s, 2.0)) * 30.0 * dim);
    acc += COLD * k * shimmer * (exp(-ang / (s * 2.0)) * 0.5 + exp(-ang / 0.02) * 0.02);
    // six faint diffraction spikes
    float th = atan(bb, a) + 0.26;
    float spk = pow(abs(cos(th * 3.0)), 300.0);
    acc += COLD * k * shimmer * spk * exp(-ang / (s * 9.0)) * 0.35 * dim;
    // the veil: two vast feathered sweeps of light rising either side, very faint, drifting like an aurora
    float wg = watW(i);
    if (wg > 0.0) {
      float span = 0.11 * uWatSize;
      vec2 q = vec2(a, bb) / span;
      float r = length(q);
      if (r < 1.6) {
        float side = abs(q.x);
        float arc = q.y - 0.55 * side * side + 0.1;                 // upswept
        float aw = arc / (0.12 + 0.25 * side);
        float band = exp(-aw * aw * 0.6);
        float feather = 0.5 + 0.5 * fbm(vec2(side * 7.0 - uTime * 0.25, q.y * 2.0 + fi * 3.0 + uTime * 0.1), 3);
        float curtain = 0.8 + 0.2 * sin(side * 9.0 + fbm(q * 2.0 + uTime * 0.2, 2) * 6.0);
        float env = smoothstep(1.5, 0.3, r) * smoothstep(0.02, 0.2, side);
        acc += mix(COLD, vec3(0.75, 0.9, 1.0), 0.5) * k * wg * band * feather * curtain * env * 0.07;
      }
    }
  }
  return acc;
}

vec3 ALT;            // the altar's foot (km)
vec3 LEDGE;          // the ledge's top centre (km)
vec3 LAMP[24]; float LAMPK[24]; int NLAMP;   // every lamp flame this frame (km), brightness

vec2 pathAt(float s) {
  for (int i = 0; i < NPATH - 1; i++) {
    float l = length(PATHV[i + 1] - PATHV[i]);
    if (s <= l || i == NPATH - 2) return mix(PATHV[i], PATHV[i + 1], sat(s / l));
    s -= l;
  }
  return PATHV[NPATH - 1];
}
vec2 pathDir(float s) { return normalize(pathAt(s + 0.004) - pathAt(s - 0.004)); }

// a small clay oil lamp, its spout toward +x (metres, origin at its foot)
float clayLamp(vec3 q) {
  float body = sdEllipsoid(q - vec3(0.0, 0.026, 0.0), vec3(0.062, 0.03, 0.048));
  body = max(body, q.y - 0.04);
  float bowl = sdEllipsoid(q - vec3(0.0, 0.046, 0.0), vec3(0.046, 0.016, 0.034));
  body = max(body, -bowl);
  float rim = length(vec2(length(q.xz * vec2(1.0, 1.3)) - 0.05, q.y - 0.04)) - 0.006;
  float spout = sdCapsule(q, vec3(0.03, 0.033, 0.0), vec3(0.085, 0.037, 0.0), 0.012);
  spout = max(spout, -sdCapsule(q, vec3(0.04, 0.046, 0.0), vec3(0.09, 0.048, 0.0), 0.005));
  float handle = sdCapsule(q, vec3(-0.055, 0.03, 0.0), vec3(-0.075, 0.045, 0.0), 0.008);
  return min(min(smin(body, rim, 0.006), spout), handle);
}
const vec3 SPOUT = vec3(0.088, 0.05, 0.0);

void nearSetup() {
  { vec2 g = cityGate(0); GATE = vec3(g.x, ground(g, 5), g.y); }
  ALT = vec3(ALTXZ.x, ground(ALTXZ, 5), ALTXZ.y);
  vec2 lx = vec2(uLedge.x, crestZ(uLedge.x) + uLedge.y);
  LEDGE = vec3(lx.x, ground(lx, 5) + 0.0006, lx.y);
  NLAMP = 0;
  if (uLampMode == 1.0) {
    for (int i = 0; i < 24; i++) {
      if (float(i) >= uLampN) break;
      float s = uLampS0 - float(i) * uLampGap * (1.0 + 0.25 * sin(float(i) * 2.3));
      if (s < 0.0 || s > uLampLen) continue;
      vec2 xz = pathAt(s);
      vec2 dir = pathDir(s);
      // carried: held a little to the side, swaying with the stride
      float sw = sin(uTime * 5.5 + float(i) * 1.7);
      xz += vec2(-dir.y, dir.x) * 0.0004 * sin(float(i) * 3.1);
      vec3 p = onPath(xz, 0.0009 + 0.00005 * abs(sw));
      p.xz += dir * 0.00006 * sw;
      LAMP[NLAMP] = p; LAMPK[NLAMP] = 0.9 + 0.2 * hash11(float(i));
      NLAMP++;
    }
  } else if (uLampMode == 2.0) {
    for (int i = 0; i < 7; i++) {
      vec3 lp = LEDGE + vec3((float(i) - 3.0) * 0.00028 + 0.00004 * sin(float(i) * 5.0), 0.0, 0.00012 * sin(float(i) * 2.7) - 0.0001);
      LAMP[NLAMP] = lp + SPOUT * 0.001; LAMPK[NLAMP] = 1.0;
      NLAMP++;
    }
  } else if (uLampMode == 3.0) {
    for (int i = 0; i < 6; i++) {
      float s = uSetS[i];
      if (s <= 0.0) continue;
      vec2 xz = pathAt(s);
      vec2 dir = pathDir(s);
      xz += vec2(-dir.y, dir.x) * 0.0011 * (mod(float(i), 2.0) * 2.0 - 1.0) * (0.6 + 0.4 * hash11(float(i) * 3.3));
      vec3 p = onPath(xz, 0.0);
      LAMP[NLAMP] = p + SPOUT * 0.001; LAMPK[NLAMP] = 1.0;
      NLAMP++;
    }
  }
}
float flick(int i) { return 0.85 + 0.15 * vnoise(vec2(uTime * 9.0, float(i) * 13.0)) + 0.08 * sin(uTime * 23.0 + float(i)); }

// ---------------- the altar and the ledge (metres) ----------------
float rough(vec3 q, float k) { return k * (fbm(q * 4.5, 4) - 0.5) + 0.15 * k * (vnoise(q * 24.0) - 0.5); }
float altarSD(vec3 q) {
  // unhewn stones laid in rough courses: each course a row of blocks of uneven size, set a little askew
  float d = 1e9;
  for (int c = 0; c < 3; c++) {
    float fc = float(c);
    float y0 = fc == 0.0 ? 0.0 : (fc == 1.0 ? 0.42 : 0.76);
    float hh = fc == 0.0 ? 0.21 : (fc == 1.0 ? 0.17 : 0.11);
    float wx = 0.78 - 0.1 * fc, wz = 0.56 - 0.07 * fc;
    vec3 p = q - vec3(0.03 * sin(fc * 2.1), y0 + hh, 0.02 * cos(fc * 1.7));
    p.xz = rot(0.05 * sin(fc * 3.0 + 1.0)) * p.xz;
    float n = fc == 2.0 ? 1.0 : 3.0;
    float cw = 2.0 * wx / n;
    float k = clamp(floor((p.x + wx) / cw), 0.0, n - 1.0);
    for (int j = -1; j <= 1; j++) {
      float kk = clamp(k + float(j), 0.0, n - 1.0);
      float cx = -wx + (kk + 0.5) * cw;
      float hs = hash11(kk * 7.0 + fc * 13.0);
      vec3 bp = p - vec3(cx, (hs - 0.5) * 0.04, (hs - 0.5) * 0.06);
      float bd = sdBox(bp, vec3(cw * 0.5 - 0.025, hh - 0.02 + 0.02 * hs, wz - 0.03 * hs)) - 0.045;
      d = min(d, bd);
    }
  }
  d += rough(q, 0.09);
  // loose stones at its foot
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.37 + 0.5;
    vec3 c = vec3(cos(a) * (1.05 + 0.25 * hash11(float(i))), 0.07, sin(a) * 0.9);
    d = min(d, sdEllipsoid(q - c, vec3(0.22, 0.1, 0.15) * (0.6 + 0.6 * hash11(float(i) * 7.0))) + rough(q * 1.7, 0.09));
  }
  return d;
}
float ledgeSD(vec3 q) {
  // a slab of granite jutting from the slope, its top weathered flat
  float d = sdBox(q - vec3(0.0, -0.4, 0.15), vec3(1.6, 0.4, 0.75)) - 0.04;
  d += rough(q * 0.7, 0.08) * smoothstep(-0.02, -0.15, q.y) + 0.004 * (fbm(q.xz * 40.0, 3) - 0.5);
  return d;
}
// the gateway of the first city (metres, origin at the gate on the ground, the city toward +z): the
// cyclopean wall bending away on either side, two great battered towers, a stone lintel, and the two
// bronze leaves standing open inward
float gateWallD;
float gateSD(vec3 q) {
  float R = cityR(0, -1.5708) * 1000.0;
  vec2 C = vec2(0.0, R);
  float b = length(q - vec3(0.0, 20.0, 10.0)) - 150.0;
  if (b > 2.0) { gateWallD = 1e9; return b; }
  float rr = length(q.xz - C) - R;
  float wall = max(abs(rr) - 4.0, q.y - 24.0 - 0.6 * floor(fract(q.x / 3.0) * 2.0));    // crenels
  wall = max(wall, abs(q.x) - 125.0);
  // towers: battered (wider at the foot), crenellated
  vec3 tq = vec3(abs(q.x) - 15.0, q.y, q.z - 1.0);
  float tw = 8.5 - 0.06 * q.y;
  float tower = max(sdBox(tq - vec3(0.0, 20.0, 0.0), vec3(tw, 20.0, tw + 1.0)), q.y - 40.0 - 0.8 * floor(fract(q.z / 2.5) * 2.0));
  wall = min(wall, tower);
  // the gateway: an opening 13 m wide and 17 m high, under a massive lintel
  float open = sdBox(q - vec3(0.0, 8.5, 0.0), vec3(6.5, 8.5, 12.0));
  wall = max(wall, -open);
  float lintel = sdBox(q - vec3(0.0, 19.5, 0.5), vec3(9.0, 2.5, 5.0));
  wall = min(wall, lintel);
  // rough stone
  wall += 0.25 * (vnoise(q * 0.7) - 0.5);
  gateWallD = wall;
  float g = 1e9;
  for (int s = -1; s <= 1; s += 2) {
    float fs = float(s);
    vec3 h = vec3(fs * 6.4, 0.0, 2.0);
    float ang = uDoorOpen;
    vec2 dir = vec2(-fs * cos(ang), sin(ang));
    vec3 r = q - h;
    vec2 lq = vec2(dot(r.xz, dir), dot(r.xz, vec2(-dir.y, dir.x)));
    float leaf = sdBox(vec3(lq.x - 3.2, r.y - 8.4, lq.y), vec3(3.2, 8.4, 0.28));
    float band = sdBox(vec3(lq.x - 3.2, mod(r.y, 2.8) - 1.4, lq.y), vec3(3.25, 0.12, 0.36));
    float stud = length(vec3(mod(lq.x, 0.9) - 0.45, mod(r.y, 0.9) - 0.45, abs(lq.y) - 0.3)) - 0.09;
    leaf = min(leaf, max(band, leaf - 0.1));
    leaf = min(leaf, max(stud, leaf - 0.12));
    g = min(g, leaf);
  }
  return min(wall, g);
}
// the nearest near-thing (km) and which: 1 altar, 2 ledge, 3 lamp, 4 bronze, 5 the gate's stone
float nearSD(vec3 p, out int id) {
  float d = 1e9; id = 0;
  if (uAltar.x > 0.5) {
    vec3 q = (p - ALT) * 1000.0;
    float b = length(q - vec3(0, 0.6, 0)) - 2.2;
    float a = b > 0.3 ? b : altarSD(q);
    a = max(a, -q.y - 0.4);
    if (a * 0.001 < d) { d = a * 0.001; id = 1; }
  }
  if (uLampMode == 2.0) {
    vec3 q = (p - LEDGE) * 1000.0;
    float b = length(q * vec3(0.5, 1.0, 1.0)) - 1.6;
    float l = b > 0.3 ? b : ledgeSD(q);
    if (l * 0.001 < d) { d = l * 0.001; id = 2; }
  }
  if (uLampMode >= 2.0) {
    for (int i = 0; i < 7; i++) {
      if (i >= NLAMP) break;
      vec3 q = (p - (LAMP[i] - SPOUT * 0.001)) * 1000.0;
      float b = length(q) - 0.15;
      float l = b > 0.05 ? b : clayLamp(q);
      if (l * 0.001 < d) { d = l * 0.001; id = 3; }
    }
  }
  if (uGateOn > 0.5) {
    vec3 q = (p - GATE) * 1000.0;
    float g = gateSD(q);
    if (g * 0.001 < d) { d = g * 0.001; id = g == gateWallD ? 5 : 4; }
  }
  return d;
}
float nearBound(vec3 ro, vec3 rd, vec3 c, float r, out float tin) {
  vec3 oc = ro - c; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + r * r;
  if (h < 0.0) { tin = -1.0; return -1.0; }
  h = sqrt(h); tin = max(-b - h, 0.0); return -b + h;
}
float nearMarch(vec3 ro, vec3 rd, out float tn) {
  nearSetup();
  tn = 1e9;
  // bound everything near in one sphere span
  float t0 = 1e9, t1 = -1.0, a, b;
  if (uAltar.x > 0.5) { b = nearBound(ro, rd, ALT + vec3(0, 0.0006, 0), 0.0035, a); if (b > 0.0) { t0 = min(t0, a); t1 = max(t1, b); } }
  if (uLampMode == 2.0) { b = nearBound(ro, rd, LEDGE, 0.0032, a); if (b > 0.0) { t0 = min(t0, a); t1 = max(t1, b); } }
  if (uGateOn > 0.5) { b = nearBound(ro, rd, GATE + vec3(0, 0.02, 0.01), 0.15, a); if (b > 0.0) { t0 = min(t0, a); t1 = max(t1, b); } }
  if (uLampMode == 3.0) for (int i = 0; i < 6; i++) { if (i >= NLAMP) break; b = nearBound(ro, rd, LAMP[i], 0.0002, a); if (b > 0.0) { t0 = min(t0, a); t1 = max(t1, b); } }
  if (t1 < 0.0) return 0.0;
  float t = t0; int id;
  for (int i = 0; i < 140; i++) {
    float d = nearSD(ro + rd * t, id);
    if (d < 0.0000015 + t * 0.0002) { tn = t; return 1.0; }
    t += d * 0.85;
    if (t > t1) break;
  }
  return 0.0;
}
vec3 nearNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0000015; int i;
  return normalize(e.xyy * nearSD(p + e.xyy, i) + e.yyx * nearSD(p + e.yyx, i) + e.yxy * nearSD(p + e.yxy, i) + e.xxx * nearSD(p + e.xxx, i));
}
// the warm lights near a point: coals and lamp flames (km)
vec3 coalPos() { return ALT + vec3(0.0, 0.00104, 0.0); }
vec3 nearLights(vec3 p, vec3 n) {
  vec3 c = vec3(0);
  if (uAltar.x > 0.5 && uAltar.y > 0.0) {
    vec3 L = coalPos() - p; float d2 = dot(L, L) * 1e6;
    c += vec3(1.0, 0.38, 0.1) * uAltar.y * (0.8 + 0.2 * vnoise(vec2(uTime * 3.0, 1.0))) * 5.0 * sat(dot(n, normalize(L)) * 0.7 + 0.3) / (d2 + 0.4);
  }
  if (uGateOn > 0.5) {
    // two great fire-baskets flanking the gateway
    for (int s = -1; s <= 1; s += 2) {
      vec3 L = GATE + vec3(float(s) * 0.0092, 0.0125, -0.0092) - p; float d2 = dot(L, L) * 1e6;
      c += vec3(1.0, 0.42, 0.12) * (0.8 + 0.2 * vnoise(vec2(uTime * 5.0, float(s)))) * 160.0 * sat(dot(n, normalize(L)) * 0.8 + 0.2) / (d2 + 6.0);
    }
  }
  for (int i = 0; i < 24; i++) {
    if (i >= NLAMP) break;
    vec3 L = LAMP[i] + vec3(0.0, 0.00002, 0.0) - p; float d2 = dot(L, L) * 1e6;
    c += vec3(1.0, 0.55, 0.22) * LAMPK[i] * flick(i) * 0.05 * sat(dot(n, normalize(L)) * 0.8 + 0.2) / (d2 + 0.003);
  }
  return c;
}
vec3 shadeNear(vec3 p, vec3 rd, float t) {
  vec3 col0 = vec3(0);
  int id; nearSD(p, id);
  vec3 n = nearNormal(p);
  vec3 alb; float rgh = 0.8; vec3 emit = vec3(0);
  if (id == 1) {
    vec3 q = (p - ALT) * 1000.0;
    alb = mix(vec3(0.09, 0.09, 0.095), vec3(0.24, 0.23, 0.22), fbm(q * 3.0, 4));
    alb = mix(alb, vec3(0.16, 0.17, 0.12), smoothstep(0.6, 0.75, fbm(q * 7.0 + 3.0, 3)) * 0.5);   // lichen
    alb = mix(alb, vec3(0.06, 0.05, 0.045), smoothstep(0.75, 1.0, q.y) * 0.7);   // soot near the top
    alb *= 0.8 + 0.3 * vnoise(q * 40.0);
    // the coals on the top slab
    float top = smoothstep(0.9, 0.98, q.y) * smoothstep(0.5, 0.2, length(q.xz * vec2(0.9, 1.1)));
    float cn = fbm(q.xz * 14.0 + vec2(0.0, uTime * 0.15), 4);
    float crack = smoothstep(0.45, 0.7, cn);
    emit = vec3(1.0, 0.28, 0.05) * top * crack * uAltar.y * 9.0 * (0.7 + 0.5 * vnoise(vec2(uTime * 2.0, cn * 9.0)));
    alb = mix(alb, vec3(0.03, 0.025, 0.02), top);
  } else if (id == 2) {
    vec3 q = (p - LEDGE) * 1000.0;
    alb = mix(vec3(0.17, 0.17, 0.18), vec3(0.36, 0.36, 0.37), fbm(q * 5.0, 4));
    alb = mix(alb, vec3(0.2, 0.22, 0.14), smoothstep(0.65, 0.8, fbm(q.xz * 7.0 + 2.0, 3)) * 0.5);   // lichen
    alb *= 0.8 + 0.3 * vnoise(q * 60.0);
  } else if (id == 5) {
    // cyclopean masonry: huge polygonal blocks fitted without mortar, weathered and soot-streaked
    vec3 q = (p - GATE) * 1000.0;
    vec3 an = abs(n);
    vec2 uv = an.x > an.z ? q.zy : q.xy;
    uv.y *= 1.25;
    vec2 v = voronoiEdge(uv / 3.4);
    float joint = smoothstep(0.06, 0.0, v.x);
    alb = vec3(0.16, 0.145, 0.13) * (0.55 + 0.7 * v.y) * (0.7 + 0.5 * fbm(q.xy * 0.6 + q.z * 0.3, 4));
    alb *= 1.0 - 0.8 * joint;
    alb *= 0.65 + 0.35 * smoothstep(0.0, 6.0, q.y);                                   // grime at the foot
    alb *= 0.85 + 0.25 * fbm(vec2(uv.x * 2.0, uv.y * 0.15), 3);                        // rain streaks
    // each block bulges a little: tilt the normal by its distance from the joints
    n = normalize(n + (n.x * n.x > 0.5 ? vec3(0) : vec3(0.0, 0.35, 0.0)) * smoothstep(0.0, 0.25, v.x) * (v.y - 0.5));
    rgh = 0.9;
  } else if (id == 4) {
    // bronze, dark with age, burnished where hands have pushed it
    vec3 q = (p - GATE) * 1000.0;
    alb = vec3(0.55, 0.33, 0.14) * (0.55 + 0.45 * fbm(q.xy * 2.0 + q.z, 4));
    rgh = 0.35;
    // the inner faces catch the red of the city; the pale flare washes them
    emit = vec3(0.0);
    vec3 r = reflect(rd, n);
    col0 = alb * (vec3(1.0, 0.28, 0.08) * 0.6 * smoothstep(-0.2, 0.6, r.z) + COLD * uGateFlare * 4.0 * (0.4 + 0.6 * pow(sat(1.0 - abs(dot(n, rd))), 2.0))) * 0.6;
  } else {
    // fired clay, a little worn; dark oil in the bowl
    alb = vec3(0.42, 0.24, 0.14) * (0.85 + 0.25 * fbm(p * 60000.0, 3));
    rgh = 0.6;
  }
  float dif = sat(dot(n, KEY));
  vec3 col = alb * uKeyCol * dif * 0.32 * (1.0 - 0.85 * uNight) * (id == 1 || id == 2 ? terrainShadow(p + n * 0.0003, KEY) : 1.0);
  vec3 amb = mix(vec3(0.07, 0.065, 0.1), vec3(0.008, 0.008, 0.014), uNight);
  col += alb * amb * (0.55 + 0.45 * n.y) * 2.0;
  col += alb * glowField(p.xz) * 0.08 * sat(0.3 - n.y * 0.2 + n.z);
  col += alb * nearLights(p, n);
  // a cold sheen on the top of stone
  vec3 h = normalize(KEY - rd);
  col += uKeyCol * 0.04 * pow(sat(dot(n, h)), 30.0) * (1.0 - rgh) * (1.0 - uNight);
  col += alb * watcherLit(p, n) * 1.5;
  if (id == 4) col += alb * vec3(1.0, 0.3, 0.08) * 0.5 * sat(n.z * 0.5 + 0.5);
  return col + emit + col0;
}

// ---------------- in the air: the smoke, the flames, the lamps' halos ----------------
// the smoke's centre at height y (m) above the altar top; it leans and frays as the wind takes it
vec3 smokeAxis(float y) {
  float b = uSmokeBend;
  float lean = b * (0.8 * y + 0.012 * y * y);
  float wob = (1.0 - 0.6 * b) * 0.15 * sin(y * 0.25 - uTime * 0.7) * min(y * 0.08, 1.0);
  return vec3(lean + wob, y, 0.25 * b * y * 0.2);
}
float smokeD(vec3 q) {
  // q: metres from the altar top. A thin column that meanders as it climbs; the wind bends it over,
  // shears it into streaks and tears it away from the altar.
  if (q.y < -0.05) return 0.0;
  float b = uSmokeBend;
  float y = max(q.y, 0.0);
  float rise = uTime * 1.3;
  // the meander: slow warps that grow with height
  vec3 wq = vec3(q.x * 0.12, y * 0.12 - uTime * 0.18, q.z * 0.12);
  vec2 warp = vec2(fbm(wq, 3), fbm(wq + vec3(5.2, 1.3, 7.7), 3)) - 0.5;
  float lean = b * (1.1 * y + 0.018 * y * y);
  vec2 axis = vec2(lean, 0.15 * b * y) + warp * (0.25 + 0.09 * y) * (1.0 + 3.0 * b);
  float w = 0.06 + 0.03 * y + 0.08 * b * y;
  vec2 dd = (q.xz - axis) / w;
  float r2 = dot(dd, dd);
  if (r2 > 9.0) return 0.0;
  float core = exp(-r2 * 1.4);
  // fine turbulence, stretched downwind as the wind rises
  vec3 nq = vec3((q.x - axis.x) * mix(2.4, 0.7, b), (y - rise) * mix(0.9, 1.6, b), (q.z - axis.y) * 2.4);
  float n = fbm(nq + vec3(uTime * 0.3, 0.0, 0.0), 5);
  float d = core * smoothstep(0.3, 0.8, n) * 2.0 + exp(-r2 * 0.5) * 0.08 * n;
  // tearing: as the wind rises the column breaks into shreds that are carried off
  float tear = fbm(vec3(y * 0.08 - uTime * 0.8 * b, 2.0, 3.0), 3);
  d *= 1.0 - b * smoothstep(0.38, 0.6, tear);
  // fades with height; once the smoke thins at the altar the column is cut from below
  d *= smoothstep(0.0, 0.5, y) * exp(-y * (0.028 + 0.03 * b));
  d *= smoothstep(1.0 - uAltar.z, 1.0 - uAltar.z + 0.15, 1.0 - y * 0.012 * (1.0 - uAltar.z) * 4.0) * uAltar.z;
  return d;
}
vec3 flameAt(vec3 ro, vec3 rd, vec3 b, float h, float k, float seed, float depth) {
  // ro/b in metres
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dd > 1e-6 ? dot(b.xz - ro.xz, dxz) / dd : 0.0;
  if (t <= 0.0 || t > depth + 0.01) return vec3(0);
  vec3 q = ro + rd * t - b;
  float hh = h * k * (0.9 + 0.2 * vnoise(vec2(uTime * 7.0 + seed, 1.0)));
  float y = q.y / hh;
  if (y < -0.4 || y > 1.5) return vec3(0);
  float sw = (vnoise(vec2(uTime * 1.7 + seed, 3.0)) - 0.5) * 0.6;
  vec2 rr = q.xz - normalize(vec2(-rd.z, rd.x) + 1e-5) * sw * hh * 0.25 * y * y;
  float x = length(rr) / (hh * 0.22);
  float yy = clamp(y, 0.0, 1.0);
  float prof = pow(yy, 0.5) * pow(1.0 - yy, 0.75) * 1.9 + 0.08;
  float body = smoothstep(1.0, 0.55, x / prof) * smoothstep(-0.15, 0.08, y) * smoothstep(1.15, 0.85, y);
  float core = smoothstep(0.55, 0.15, x / prof) * smoothstep(0.0, 0.2, y) * smoothstep(0.75, 0.35, y);
  float root = smoothstep(0.9, 0.3, x / prof) * smoothstep(0.25, 0.0, y) * smoothstep(-0.25, 0.0, y);
  vec3 c = vec3(1.0, 0.55, 0.22) * body * 6.0 + vec3(1.0, 0.88, 0.66) * core * 22.0 + vec3(0.15, 0.3, 1.0) * root * 1.5;
  return c * k;
}
vec3 nearAir(vec3 ro, vec3 rd, float tHit, vec3 col, float jit) {
  col += watcherAir(ro, rd, tHit);
  if (uGateOn > 0.5) {
    // the red of the city pouring out of the gateway, and the pale flare as the lights pass in
    vec3 gc = GATE + vec3(0.0, 0.007, 0.006);
    vec3 oc = gc - ro; float tc = dot(oc, rd);
    if (tc > 0.0) {
      float h = length(oc - rd * tc) * 1000.0;
      float vis = tc < tHit + 0.004 ? 1.0 : 0.25;
      col += (vec3(1.0, 0.25, 0.06) * 0.25 + COLD * uGateFlare * 0.5) * exp(-h / 5.0) * vis;
      col += (vec3(1.0, 0.3, 0.08) * 0.015 + COLD * uGateFlare * 0.04) * exp(-h / 25.0);
    }
    for (int s = -1; s <= 1; s += 2) {
      vec3 fb = (GATE + vec3(float(s) * 0.0092, 0.0122, -0.0092)) * 1000.0;
      col += flameAt(ro * 1000.0, rd, fb, 2.6, 1.0, float(s) * 3.0, tHit * 1000.0) * 0.8;
      vec3 o2 = fb - ro * 1000.0; float t2 = dot(o2, rd);
      if (t2 > 0.0) { float h2 = length(o2 - rd * t2); col += vec3(1.0, 0.45, 0.15) * (0.25 * exp(-h2 / 1.2) + 0.03 * exp(-h2 / 8.0)); }
    }
  }
  // the altar's smoke
  if (uAltar.x > 0.5 && uAltar.z > 0.0) {
    vec3 top = coalPos();
    // bound: a box above the altar, wider on the lee side as it bends
    vec3 bmin = top + vec3(-0.006, -0.0001, -0.006), bmax = top + vec3(0.006 + 0.11 * uSmokeBend, 0.08, 0.006 + 0.015 * uSmokeBend);
    vec3 inv = 1.0 / rd;
    vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
    vec3 tmn = min(t0, t1), tmx = max(t0, t1);
    float ta = max(max(tmn.x, tmn.y), max(tmn.z, 0.0)), tb = min(min(tmx.x, tmx.y), min(tmx.z, tHit));
    if (tb > ta) {
      const int N = 64;
      float dt = (tb - ta) / float(N);
      vec3 L = vec3(0); float T = 1.0;
      for (int i = 0; i < N; i++) {
        float t = ta + (float(i) + jit) * dt;
        vec3 p = ro + rd * t;
        vec3 q = (p - top) * 1000.0;
        float d = smokeD(q);
        if (d > 0.002) {
          float ds = smokeD(q + KEY * 0.6);
          vec3 c = uKeyCol * 0.09 * exp(-ds * 1.5) * (1.0 - 0.8 * uNight) + mix(vec3(0.05, 0.045, 0.07), vec3(0.006), uNight);
          c += vec3(1.0, 0.35, 0.08) * uAltar.y * 0.6 * exp(-q.y * 0.6);
          float a = 1.0 - exp(-d * dt * 1000.0 * 1.8);
          L += T * a * c; T *= 1.0 - a;
          if (T < 0.02) break;
        }
      }
      col = col * T + L;
    }
  }
  // the lamps
  for (int i = 0; i < 24; i++) {
    if (i >= NLAMP) break;
    vec3 c = LAMP[i];
    vec3 oc = c - ro; float tc = dot(oc, rd);
    if (tc < 0.0 || tc > tHit + 0.0003) continue;
    float k = LAMPK[i] * flick(i);
    float dist = length(oc);
    if (dist < 0.02) {
      // close: a real flame
      col += flameAt(ro * 1000.0, rd, c * 1000.0, 0.035, k, float(i) * 7.1, tHit * 1000.0);
    }
    // the glow a lens sees round a flame, and a point when far
    float h = length(oc - rd * tc) * 1000.0;           // metres off the ray
    float ang = h / (dist * 1000.0);
    col += vec3(1.0, 0.62, 0.3) * k * uLampHalo * (0.35 * exp(-h / 0.012) + 0.03 * exp(-h / 0.06));
    col += vec3(1.0, 0.6, 0.28) * k * uLampHalo * (exp(-ang * ang * 2.0e7) * 3.5 + exp(-ang * 900.0) * 0.06) * smoothstep(0.01, 0.05, dist);
  }
  return col;
}
`;
