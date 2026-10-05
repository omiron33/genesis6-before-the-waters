// The holy mountain and the great valley of Cain (scenes s00, s01, s03, s04, s05, s08, s10, s11, s23).
// Units are kilometres, y up. The mountain of Seth is a long steep granite ridge whose crest runs along
// x near z = 0; its front face drops ~1.2 km to the river plain, which runs away to +z for 50 km to
// a far hazy range. A stone altar stands on the crest at x = 0, and a switchback path runs from it down
// the front face to the north gate of the first walled city (C0) at its foot. The plain holds walled
// cities of mud-brick inside cyclopean walls, villages, torch-lit roads, forges and hearth smoke.
// Close things (the altar, the clay lamps, the smoke) are in lib/x-mount-near.js, in metres.
//
// Every frame is a pure function of uTime and the uniforms the scenes set.
import { NEAR_GLSL, NEAR_UNIFORMS } from '/song/lib/x-mount-near.js';

// the path from the altar to the gate of C0 (km, x/z)
export const PATH = [
  [0.0, 0.056], [0.13, 0.16], [-0.1, 0.33], [0.15, 0.54], [-0.12, 0.79], [0.17, 1.05], [-0.1, 1.34],
  [0.19, 1.64], [-0.06, 1.97], [0.22, 2.28], [0.08, 2.6], [0.27, 2.97],
];
export const CITIES = [
  // x, z, radius, kindle order (0..1)
  [0.3, 3.4, 0.42, 0.0], [-5.5, 6.5, 0.55, 0.15], [5.0, 7.0, 0.6, 0.1], [-1.5, 20.0, 0.95, 0.05],
  [8.5, 21.0, 0.5, 0.35], [-10.0, 18.0, 0.55, 0.45], [3.5, 26.5, 0.7, 0.25], [-7.0, 28.0, 0.6, 0.55],
  [12.0, 9.0, 0.45, 0.6], [-12.0, 6.5, 0.45, 0.7],
];
const NC = CITIES.length;
// path arc length table (for lamps): s in km along the polyline
const segLen = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
export const PATH_LEN = segLen.reduce((a, b) => a + b, 0);
export function pathXZ(s) {
  s = Math.max(0, Math.min(PATH_LEN, s));
  for (let i = 0; i < segLen.length; i++) {
    if (s <= segLen[i] || i === segLen.length - 1) { const k = Math.min(1, s / segLen[i]); return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k]; }
    s -= segLen[i];
  }
}

export const MOUNT_UNIFORMS = {
  ...NEAR_UNIFORMS,
  uFocus: 1.0, uAper: 0.0,
  uKeyDir: [0.72, 0.3, 0.5], uKeyCol: [1.25, 1.38, 1.7],
  uNight: 0.0,           // 0 dusk .. 1 full night
  uKindle: 1.0,          // how much of the valley's lights burn (0..1)
  uSpread: [0, 0, -1],   // fire contagion: source x, z, radius (km); radius < 0 = none
  uDeck: 0.0,            // 1 = the thick cloud deck (aerial shots)
  uHole: [0.0, 14.0, 3.0], // the break in the deck: x, z, radius
  uShaft: [0.0, 14.0, 0.0], // a shaft of pale light through the break: x, z, strength
  uFlash: [0.0, 0.0, 0.0], // lightning inside the cloud: x, z, strength
  uCloudY: 3.0,          // bottom of the deck (km)
  uHaze: 1.0,            // amount of valley smoke
  uWindT: 0.0,           // wind clock for drifting cloud and smoke
  uLampN: 0.0, uLampS0: 0.0, uLampGap: 0.03,  // carried lamps on the path: count, head position (km along), spacing
  uLampLen: PATH_LEN,
};

const vec2s = (a) => a.map((p) => `vec2(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`).join(', ');

export const MOUNT_GLSL = /* glsl */ `
uniform float uFocus, uAper, uNight, uKindle, uDeck, uCloudY, uHaze, uWindT;
uniform vec3 uKeyDir, uKeyCol, uSpread, uHole, uShaft, uFlash;
uniform float uLampN, uLampS0, uLampGap, uLampLen;
uniform float uGateOn;
#define KEY normalize(uKeyDir)
const int NPATH = ${PATH.length};
const vec2 PATHV[NPATH] = vec2[](${vec2s(PATH)});
const int NC = ${NC};
const vec4 CITY[NC] = vec4[](${CITIES.map((c) => `vec4(${c.map((v) => v.toFixed(3)).join(', ')})`).join(', ')});
const vec2 ALTXZ = vec2(0.0, 0.042);
const vec3 FORGE = vec3(1.0, 0.36, 0.08);

// ---------------- the land ----------------
float erodedN(vec2 p, int oct) {
  vec2 q = p * 0.9;
  float a = 0.0, b = 1.0; vec2 d = vec2(0);
  for (int i = 0; i < 16; i++) {
    if (i >= oct) break;
    vec3 n = vnoised(q);
    d += n.yz;
    a += b * n.x / (1.0 + dot(d, d));
    b *= 0.5; q = M2 * q * 2.0;
  }
  return a;
}
float crestZ(float x) { return 0.08 * sin(x * 0.35) + 0.05 * sin(x * 0.9 + 1.0); }
float massif(vec2 p, out float m) {
  float dz = p.y - crestZ(p.x);
  float hc = 1.2 + 0.22 * sin(p.x * 0.45 + 0.8) + 0.12 * sin(p.x * 1.3 + 2.0);
  hc = mix(0.35, hc, smoothstep(16.0, 7.0, abs(p.x)));
  float front = pow(sat(1.0 - dz / 2.75), 1.65);
  float back = exp(-dz * dz / 7.0);
  m = dz > 0.0 ? front : back;
  return hc * m;
}
float riverZ(float x) { return 13.0 + 2.5 * sin(x * 0.13) + 1.2 * sin(x * 0.37 + 1.3); }
// the natural ground (no path, no cities)
float ground(vec2 p, int oct) {
  float m; float h = massif(p, m);
  float n = erodedN(p, oct);
  h += (n - 0.45) * (0.04 + 0.32 * m);
  // ribs and gullies running down the faces
  if (m > 0.0 && m < 1.0) {
    float rb = fbm(vec2(p.x * 5.5, p.y * 1.4) + n * 0.8, 3);
    h += (0.5 - abs(2.0 * rb - 1.0)) * 0.11 * m * (1.0 - m) * 2.0;
  }
  // the plain: long low swells; the far range
  h += 0.006 * (fbm(p * 0.35, 3) - 0.5);
  float dr0 = abs(p.y - riverZ(p.x));
  if (m < 1.0 && p.y > 2.0 && dr0 > 0.6) h += 0.045 * smoothstep(0.45, 0.8, fbm(p * 0.28 + 7.0, 3)) * (1.0 - m) * smoothstep(0.6, 2.0, dr0) * smoothstep(2.0, 4.0, p.y);
  if (p.y > 30.0) h += smoothstep(30.0, 56.0, p.y) * (0.55 + 0.35 * n);
  // the river bed
  float dr = abs(p.y - riverZ(p.x));
  h -= 0.006 * smoothstep(0.5, 0.25, dr) * (1.0 - m);
  return h;
}
// distance to the path polyline (km) and the nearest point on it
float pathDist(vec2 p, out vec2 near) {
  float best = 1e9; near = PATHV[0];
  for (int i = 0; i < NPATH - 1; i++) {
    vec2 a = PATHV[i], b = PATHV[i + 1], pa = p - a, ba = b - a;
    float h = sat(dot(pa, ba) / dot(ba, ba));
    vec2 c = a + ba * h; float d = length(p - c);
    if (d < best) { best = d; near = c; }
  }
  return best;
}
// the walls and houses of a city (height above the plain, km); id 1 wall, 2 house, 3 citadel, 0 none
float cityR(int ci, float a) {
  vec2 cs = vec2(cos(a), sin(a));
  return CITY[ci].z * (1.0 + 0.18 * cs.x * cs.x - 0.1 + 0.45 * (vnoise(cs * 1.7 + float(ci) * 5.3) - 0.5) + 0.1 * (vnoise(cs * 5.0 + float(ci) * 2.1) - 0.5));
}
vec2 cityGate(int ci) { return CITY[ci].xy + vec2(0.0, -cityR(ci, -1.5708)); }
float cityH(vec2 p, int ci, out int id) {
  vec4 c = CITY[ci];
  vec2 q = p - c.xy; float r = length(q);
  float a = atan(q.y, q.x);
  float R = cityR(ci, a);
  id = 0;
  if (r > R + 0.02) return 0.0;
  float h = 0.0;
  // the gate faces the mountain (-z)
  float gate = abs(a + 1.5708) * R;
  // cyclopean wall with towers
  float wd = abs(r - R);
  float N = floor(R * 70.0);
  float ta = fract(a / 6.2831853 * N) - 0.5;
  float tower = smoothstep(0.16, 0.12, abs(ta)) * smoothstep(0.012, 0.009, wd);
  float wall = smoothstep(0.0065, 0.0045, wd);
  float wallH = 0.024 * wall + 0.012 * tower;
  // the gateway: two great towers, the opening between them
  float gt = smoothstep(0.016, 0.012, abs(gate - 0.02)) * smoothstep(0.012, 0.009, wd);
  wallH = max(wallH, 0.042 * gt);
  wallH *= smoothstep(0.006, 0.009, gate);
  if (uGateOn > 0.5 && ci == 0) wallH *= smoothstep(0.118, 0.121, gate);
  if (wallH > 0.0) { h = wallH; id = 1; }
  if (r < R - 0.012) {
    // houses: flat roofs on a grid, streets between
    vec2 g = q / 0.013; vec2 cell = floor(g), f = fract(g) - 0.5;
    float hs = hash12(cell + float(ci) * 17.0);
    float fp = max(abs(f.x), abs(f.y));
    float bh = 0.004 + 0.009 * hs * hs + 0.006 * smoothstep(R * 0.7, 0.0, r);
    // the main street from the gate to the citadel stays open
    float street = smoothstep(0.006, 0.004, abs(q.x)) * step(q.y, 0.0);
    // a grid of streets every fourth block, bending a little with the ground
    vec2 sc = floor((q + 0.004 * sin(q.yx * 40.0)) / 0.013);
    street = max(street, (mod(sc.x, 4.0) == 0.0 || mod(sc.y, 4.0) == 0.0) ? 1.0 : 0.0);
    float house = smoothstep(0.42, 0.36, fp) * (1.0 - street) * step(0.12, hs);
    if (house * bh > h) { h = house * bh; id = 2; }
    // the citadel: a stepped tower of the giants in the middle
    float zr = max(abs(q.x), abs(q.y));
    float zig = 0.09 * R * 2.0 * sat(1.0 - zr / (0.24 * R));
    zig = floor(zig / 0.012) * 0.012;
    if (zig > h) { h = zig; id = 3; }
  }
  return h;
}
float cityAll(vec2 p, out int id, out int ci) {
  id = 0; ci = -1;
  for (int i = 0; i < NC; i++) {
    vec2 d = p - CITY[i].xy;
    if (dot(d, d) > (CITY[i].z * 1.2 + 0.03) * (CITY[i].z * 1.2 + 0.03)) continue;
    int k; float h = cityH(p, i, k);
    if (length(d) < cityR(i, atan(d.y, d.x)) + 0.006) ci = i;
    if (k > 0) { id = k; ci = i; return h; }
    return 0.0;
  }
  return 0.0;
}
// the whole surface: ground, the path's bench, the cities. pathMask > 0 on the path's tread.
float terrain(vec2 p, int oct, out float pathMask, out int cid, out int ci) {
  float h = ground(p, oct);
  pathMask = 0.0; cid = 0; ci = -1;
  if (p.x > -0.32 && p.x < 0.42 && p.y > -0.05 && p.y < 3.05) {
    vec2 nr; float d = pathDist(p, nr);
    if (d < 0.007) {
      float hp = ground(nr, 8) + 0.0002;
      float k = smoothstep(0.007, 0.0018, d);
      h = mix(h, hp, k);
      pathMask = smoothstep(0.0026, 0.0012, d);
    }
  }
  // the altar's level place on the crest
  vec2 da = p - ALTXZ;
  float ra = dot(da, da);
  if (ra < 0.0006) h = mix(h, ground(ALTXZ, 5), smoothstep(0.0006, 0.00008, ra));
  if (p.y > 2.5 && p.y < 30.0) h += cityAll(p, cid, ci);
  return h;
}
float terrainH(vec2 p, int oct) { float pm; int a, b; return terrain(p, oct, pm, a, b); }
// a lamp carried on the path sits on the tread, a little above it
vec3 onPath(vec2 xz, float lift) { return vec3(xz.x, ground(xz, 8) + 0.0002 + lift, xz.y); }

vec2 marchTerrain(vec3 ro, vec3 rd, float tmax, float t0) {
  float t = t0, lh = 0.0, lt = t0;
  for (int i = 0; i < 170; i++) {
    vec3 p = ro + rd * t;
    int oc = t < 3.0 ? 9 : (t < 10.0 ? 7 : 5);
    float h = p.y - terrainH(p.xz, oc);
    if (h < 0.00025 * t) {
      // refine between the last two samples
      float a = lt, b = t;
      for (int j = 0; j < 5; j++) { float m = 0.5 * (a + b); vec3 q = ro + rd * m; if (q.y - terrainH(q.xz, oc) < 0.0) b = m; else a = m; }
      return vec2(b, 1.0);
    }
    lt = t;
    t += max(h * (0.5 + 0.02 * min(t, 10.0)), 0.0004 + 0.0012 * t);
    if (t > tmax || (p.y > 1.85 && rd.y > 0.0)) break;
  }
  return vec2(tmax, 0.0);
}
vec3 terrainNormal(vec2 p, float t) {
  float e = max(0.00012, 0.0007 * t);
  int oct = t < 0.3 ? 12 : (t < 3.0 ? 11 : (t < 8.0 ? 9 : 7));
  float h = terrainH(p, oct);
  return normalize(vec3(h - terrainH(p + vec2(e, 0), oct), e, h - terrainH(p + vec2(0, e), oct)));
}
float terrainShadow(vec3 ro, vec3 L) {
  float res = 1.0, t = 0.002;
  for (int i = 0; i < 20; i++) {
    vec3 p = ro + L * t;
    float h = p.y - terrainH(p.xz, 5);
    res = min(res, 12.0 * h / t);
    t += clamp(h, 0.004, 0.4);
    if (res < 0.0 || p.y > 2.0) break;
  }
  return smoothstep(0.0, 1.0, res);
}

// ---------------- the valley's lights ----------------
float cityKindle(int i) { return smoothstep(CITY[i].w, CITY[i].w + 0.12, uKindle); }
// contagion of fire: 1 where the spreading fire has reached
float spreadAt(vec2 p) {
  if (uSpread.z < 0.0) return 0.0;
  float d = length(p - uSpread.xy) + 1.5 * (fbm(p * 0.35, 3) - 0.5);
  return smoothstep(uSpread.z, uSpread.z - 0.8, d);
}
// a soft field of the valley's light, for the glow it throws up into the smoke and cloud
vec3 glowField(vec2 p) {
  vec3 g = vec3(0);
  for (int i = 0; i < NC; i++) {
    vec2 d = p - CITY[i].xy; float R = CITY[i].z;
    g += FORGE * cityKindle(i) * R * R * 6.0 * exp(-dot(d, d) / (R * R * 2.5));
  }
  g *= 0.35 + 1.1 * vnoise(p * 2.5) * (0.6 + 0.8 * vnoise(p * 5.3 + 2.0)) ;
  // villages and fields of hearths: a faint broad wash
  float v = fbm(p * 0.25 + 5.0, 3);
  g += FORGE * 0.12 * smoothstep(0.4, 0.7, v) * smoothstep(0.0, 0.8, uKindle) * smoothstep(1.0, 4.0, p.y) * smoothstep(40.0, 30.0, p.y);
  float s = spreadAt(p);
  g += vec3(1.0, 0.22, 0.05) * s * 0.5 * (0.3 + 1.2 * smoothstep(0.38, 0.68, fbm(p * 0.9 + 4.0, 3)));
  return g;
}
// small lights on the ground at a point (emission, linear): windows, hearths, forges, torches
vec3 groundLights(vec3 p, vec3 n, int cid, int ci, float pix) {
  vec3 e = vec3(0);
  float fl = 0.75 + 0.5 * vnoise(vec2(uTime * 6.0, p.x * 300.0 + p.z * 170.0));
  if (ci >= 0) {
    vec4 c = CITY[ci];
    vec2 q = p.xz - c.xy;
    float k = cityKindle(ci);
    float r = length(q), a = atan(q.y, q.x), R = cityR(ci, a);
    vec2 g = q / 0.013; vec2 cell = floor(g), f = fract(g) - 0.5;
    float hs = hash12(cell + float(ci) * 17.0 + 3.0);
    vec3 warm = vec3(1.0, 0.5, 0.18);
    if (cid == 1) {
      // torches along the rampart: the wall drawn as a thin outline of fire
      float along = a * R / 0.007;
      float on = step(hash11(floor(along) + float(ci) * 31.0), 0.85 * k);
      float dt = abs(fract(along) - 0.5) * 0.007;
      e += warm * smoothstep(0.0016, 0.0, dt) * smoothstep(0.55, 0.85, n.y) * on * 7.0 * fl;
    } else if (cid == 2) {
      if (n.y < 0.6) {
        float wy = fract(p.y / 0.0032);
        vec2 wx = fract((p.xz) / 0.0024);
        float slot = smoothstep(0.3, 0.2, abs(wy - 0.5)) * smoothstep(0.3, 0.15, abs(max(wx.x, wx.y) - 0.5) - 0.15);
        e += vec3(1.0, 0.55, 0.22) * slot * step(hs, 0.12 * k) * 1.0;
      } else {
        e += vec3(1.0, 0.45, 0.15) * smoothstep(0.1, 0.0, length(f)) * step(hs, 0.025 * k) * 4.0 * fl;
      }
    } else if (cid == 3) {
      // the beacon fire on the top of the ziggurat
      float zr = max(abs(q.x), abs(q.y));
      e += FORGE * smoothstep(0.03 * R, 0.0, zr) * smoothstep(0.7, 0.95, n.y) * 30.0 * k * fl;
    } else if (r < R) {
      // the streets: torches strung along them at intervals
      vec2 sq = q + 0.004 * sin(q.yx * 40.0);
      vec2 sc = floor(sq / 0.013), sf = fract(sq / 0.013) - 0.5;
      float tq = 0.0;
      if (mod(sc.x, 4.0) == 0.0) { float al = sq.y / 0.007; tq = max(tq, smoothstep(0.0018, 0.0, length(vec2(sf.x * 0.013, (fract(al) - 0.5) * 0.007))) * step(hash11(floor(al) + sc.x * 7.0), 0.75 * k)); }
      if (mod(sc.y, 4.0) == 0.0) { float al = sq.x / 0.007; tq = max(tq, smoothstep(0.0018, 0.0, length(vec2(sf.y * 0.013, (fract(al) - 0.5) * 0.007))) * step(hash11(floor(al) + sc.y * 5.0), 0.75 * k)); }
      if (abs(q.x) < 0.006 && q.y < 0.0) { float al = q.y / 0.006; tq = max(tq, smoothstep(0.0018, 0.0, length(vec2(abs(q.x) - 0.004, (fract(al) - 0.5) * 0.006)))); }
      e += warm * tq * 6.0 * fl;
      // forges in the courts
      float forge = step(hash12(cell + 31.0), 0.03) * k;
      e += FORGE * smoothstep(0.42, 0.0, length(f)) * forge * 22.0 * fl;
    }
    if (ci == 0) {
      vec2 gp = cityGate(ci);
      float dg = length(p.xz - gp);
      e += vec3(1.0, 0.3, 0.08) * 6.0 * exp(-dg / 0.006) * k * (p.y < 0.01 ? 1.0 : 0.3);
    }
  } else if (p.y < 0.05 && p.z > 2.6) {
    // villages: a cluster of hearths in some 1.4 km cells
    vec2 cell = floor(p.xz / 1.4);
    float hv = hash12(cell * 1.7 + 9.0);
    vec2 vc = (cell + 0.25 + 0.5 * hash22(cell + 4.0)) * 1.4;
    float dv = length(p.xz - vc);
    if (dv < 0.18 && hv < 0.75) {
      vec2 g = p.xz / 0.016; vec2 c2 = floor(g), f = fract(g) - 0.5;
      float h2 = hash12(c2);
      float on = step(h2, 0.35 * smoothstep(0.18, 0.02, dv)) * step(hv * 0.9, uKindle);
      e += vec3(1.0, 0.5, 0.2) * on * smoothstep(0.22, 0.0, length(f)) * 3.0 * fl;
    }
    // roads of torches between the cities
    for (int i = 0; i < NC - 1; i++) {
      vec2 a = CITY[i].xy, b = CITY[i + 1].xy;
      if (i == 2) { a = CITY[0].xy; b = CITY[3].xy; }
      vec2 pa = p.xz - a, ba = b - a;
      float h = sat(dot(pa, ba) / dot(ba, ba));
      vec2 rr = pa - ba * h;
      float bend = 0.25 * sin(h * 9.0 + float(i));
      float d = abs(length(rr) - 0.0) ;
      vec2 side = normalize(vec2(-ba.y, ba.x));
      d = abs(dot(pa - ba * h, side) - bend * sin(h * 3.14159));
      if (d < 0.004) {
        float along = h * length(ba) / 0.05;
        float dot2 = length(vec2((fract(along) - 0.5) * 0.05, d));
        float on = step(max(CITY[i].w, CITY[i + 1].w) + 0.1, uKindle + 0.1 * hash11(floor(along)));
        e += vec3(1.0, 0.55, 0.25) * smoothstep(0.004, 0.0, dot2) * on * 2.5 * fl;
      }
    }
  }
  // the spreading fires: whole districts burning
  float s = spreadAt(p.xz);
  if (s > 0.0 && p.z > 2.6) {
    // fires in irregular clusters: villages, fields and roads burning, with dark land between
    float cl = smoothstep(0.38, 0.68, fbm(p.xz * 0.9 + 4.0, 4));
    vec2 g = p.xz / 0.045; vec2 c3 = floor(g), f = fract(g);
    for (int j = 0; j < 2; j++) {
      vec2 cc = c3 + vec2(float(j), 0.0) * step(0.5, f.x) - vec2(float(j), 0.0) * step(f.x, 0.5) * 0.0;
      vec2 o = hash22(cc + 11.0);
      float d = length(g - cc - 0.15 - 0.7 * o);
      float h3 = hash12(cc + 77.0);
      float burn = step(h3, 0.12 + 0.6 * cl) * s;
      float size = 0.08 + 0.3 * hash12(cc + 5.0) * hash12(cc + 9.0);
      float bf = 0.5 + 0.9 * vnoise(vec2(uTime * 2.5 + h3 * 20.0, h3 * 50.0));
      float heat = 1.0 + 6.0 * pow(hash12(cc + 3.0), 4.0);
      e += mix(vec3(1.0, 0.18, 0.03), vec3(1.0, 0.5, 0.15), hash12(cc + 2.0)) * burn * smoothstep(size, size * 0.2, d) * 4.0 * bf * heat;
    }
    e += vec3(0.5, 0.06, 0.015) * s * cl * 0.1;
  }
  return e;
}

${NEAR_GLSL}

// ---------------- sky ----------------
vec3 skyBase(vec3 rd) {
  float y = rd.y;
  vec3 west = normalize(vec3(-0.85, 0.0, 0.5));
  float w = pow(max(dot(normalize(vec3(rd.x, 0.0, rd.z)), west), 0.0), 3.0);
  vec3 zen = mix(vec3(0.035, 0.03, 0.065), vec3(0.006, 0.007, 0.016), uNight);
  vec3 mid = mix(vec3(0.11, 0.08, 0.15), vec3(0.012, 0.012, 0.025), uNight);
  vec3 hor = mix(vec3(0.2, 0.13, 0.19) + vec3(0.32, 0.12, 0.13) * w, vec3(0.02, 0.018, 0.03) + vec3(0.04, 0.012, 0.01) * w, uNight);
  vec3 c = mix(hor, mid, smoothstep(0.0, 0.12, y));
  c = mix(c, zen, smoothstep(0.1, 0.6, y));
  return c;
}
// the bruised storm sky: a heavy cloud ceiling, its underside violet, its western edges lit
vec3 skyClouds(vec3 rd, vec3 ro) {
  vec3 c = skyBase(rd);
  if (rd.y <= 0.0) return c;
  vec2 uv = rd.xz / (rd.y + 0.08) * 1.6 + vec2(uWindT * 0.02, uWindT * 0.008);
  vec2 wq = uv * vec2(0.35, 0.8);
  vec2 warp = vec2(fbm(wq * 0.7 + 3.1, 4), fbm(wq * 0.7 + 8.3, 4)) - 0.5;
  float n = fbm(wq + warp * 1.4, 6);
  float n2 = fbm(uv * vec2(1.2, 3.0) + warp * 2.0 + 3.0, 5);
  float cov = smoothstep(0.32, 0.68, n + 0.18 * (n2 - 0.5));
  vec3 west = normalize(vec3(-0.85, 0.08, 0.5));
  float wl = pow(max(dot(rd, west), 0.0), 5.0);
  float edge = smoothstep(0.72, 0.42, n + 0.15 * n2) * cov;
  vec3 under = mix(vec3(0.05, 0.04, 0.075), vec3(0.007, 0.007, 0.012), uNight);
  vec3 lit = mix(vec3(0.42, 0.2, 0.26), vec3(0.03, 0.012, 0.012), uNight) * wl + mix(vec3(0.09, 0.08, 0.12), vec3(0.008), uNight) * n2;
  vec3 cc = under * (0.5 + 0.9 * n2) + lit * edge * 1.4;
  cc = mix(cc, skyBase(rd) * 1.1, exp(-rd.y * 9.0) * 0.6);
  // the valley's fire lights the cloud from below, low in the sky over the plain
  float valley = smoothstep(0.0, 0.6, rd.z) * smoothstep(0.35, 0.02, rd.y);
  cc += FORGE * 0.08 * valley * (0.5 + uNight) * uKindle;
  c = mix(c, cc, cov * smoothstep(0.0, 0.06, rd.y));
  return c;
}

// ---------------- the cloud deck (aerial shots) ----------------
float deckD(vec3 p) {
  float y0 = uCloudY, y1 = uCloudY + 1.8;
  float hgt = sat((p.y - y0) / 0.5) * sat((y1 - p.y) / 0.9);
  if (hgt <= 0.0) return 0.0;
  vec3 q = p * vec3(0.55, 0.9, 0.55) + vec3(uWindT * 0.03, 0.0, uWindT * 0.012);
  float n = fbm(q, 4);
  // the break
  float hd = length(p.xz - uHole.xy) + 2.5 * (fbm(p.xz * 0.25 + 7.0, 3) - 0.5);
  float hole = smoothstep(uHole.z * 0.65, uHole.z * 1.25, hd);
  return sat((n - 0.38 + (hgt - 1.0) * 0.5) * 7.0) * hole;
}
vec4 deck(vec3 ro, vec3 rd, float tHit, float jit) {
  if (uDeck <= 0.0) return vec4(0, 0, 0, 1);
  float y0 = uCloudY - 0.05, y1 = uCloudY + 1.85;
  float ta = (y1 - ro.y) / rd.y, tb = (y0 - ro.y) / rd.y;
  if (ta > tb) { float tt = ta; ta = tb; tb = tt; }
  ta = max(ta, 0.0); tb = min(tb, min(tHit, 60.0));
  if (tb <= ta) return vec4(0, 0, 0, 1);
  const int N = 28;
  float dt = (tb - ta) / float(N);
  vec3 L = vec3(0); float T = 1.0;
  for (int i = 0; i < N; i++) {
    float t = ta + (float(i) + jit) * dt;
    vec3 p = ro + rd * t;
    float d = deckD(p);
    if (d > 0.01) {
      float top = sat((p.y - uCloudY) / 1.8);
      float ds = deckD(p + KEY * 0.25);
      vec3 c = uKeyCol * 0.06 * exp(-ds * 2.5) * (0.3 + 0.7 * top);
      c += mix(vec3(0.012, 0.012, 0.02), vec3(0.003, 0.003, 0.006), uNight) * (0.4 + top);
      // the burning valley lights the underside
      c += glowField(p.xz) * (0.09 * pow(1.0 - top, 2.0) + 0.02 * exp(-d * 2.0));
      // lightning inside
      if (uFlash.z > 0.0) {
        vec3 fp = vec3(uFlash.x, uCloudY + 0.7, uFlash.y);
        float fd = length(p - fp);
        c += vec3(0.75, 0.8, 1.0) * uFlash.z * 3.0 * exp(-fd * 0.9) * exp(-ds * 0.5);
      }
      float a = 1.0 - exp(-d * dt * 16.0);
      L += T * a * c;
      T *= 1.0 - a;
      if (T < 0.01) break;
    }
  }
  return vec4(L, T);
}

// ---------------- smoke and haze over the plain ----------------
vec4 haze(vec3 ro, vec3 rd, float tHit, float jit) {
  float tm = min(tHit, 70.0);
  // only below 0.9 km
  float tlo = 0.0, thi = tm;
  if (ro.y > 0.9) { if (rd.y >= 0.0) return vec4(0, 0, 0, 1); tlo = (ro.y - 0.9) / -rd.y; }
  if (rd.y > 0.0) thi = min(thi, (0.9 - ro.y) / rd.y);
  if (thi <= tlo) return vec4(0, 0, 0, 1);
  const int N = 8;
  float dt = (thi - tlo) / float(N);
  vec3 L = vec3(0); float T = 1.0;
  vec3 amb = mix(vec3(0.07, 0.06, 0.1), vec3(0.006, 0.006, 0.011), uNight);
  for (int i = 0; i < N; i++) {
    float t = tlo + (float(i) + jit) * dt;
    vec3 p = ro + rd * t;
    float y = max(p.y, 0.0);
    float valley = smoothstep(1.5, 4.0, p.z);
    float bands = 0.5 + 1.1 * fbm(vec2(p.x * 0.18 + uWindT * 0.01, p.z * 0.5) + vec2(0.0, y * 2.0), 3);
    float d = (0.025 + 0.12 * uHaze * valley * bands) * exp(-y / 0.22) + 0.006 * exp(-y / 1.2);
    for (int c = 0; c < NC; c++) {
      vec2 dc = p.xz - CITY[c].xy - vec2(0.25, 0.1) * y;        // leaning downwind
      float R = CITY[c].z * (0.5 + 0.6 * y);
      float pl = exp(-dot(dc, dc) / (R * R)) * cityKindle(c);
      if (pl > 0.01) { d += pl * 0.5 * uHaze * mix(smoothstep(0.35, 0.75, fbm(vec2(dc.x * 4.0, y * 3.0 - uWindT * 0.05) + dc.y * 3.0, 4)), 0.4, smoothstep(2.0, 8.0, t)) * exp(-y / 0.5); break; }
    }
    vec3 g = glowField(p.xz) * exp(-y / 0.14) * 0.3;
    vec3 c = amb + g;
    for (int w = 0; w < 8; w++) { if (float(w) >= uWatN) break; vec3 dw = watP(w) - p; c += COLD * watK(w) * 0.00004 / (dot(dw, dw) + 0.0004); }
    // the shaft of pale light through the break
    if (uShaft.z > 0.0) {
      vec3 sp = p - KEY * ((p.y - uCloudY) / KEY.y);
      float sd = length(sp.xz - uShaft.xy);
      c += uKeyCol * 0.3 * uShaft.z * smoothstep(1.4, 0.2, sd) * (0.6 + 0.8 * fbm(sp.xz * 1.5, 3));
    }
    float a = 1.0 - exp(-d * dt);
    L += T * a * c;
    T *= 1.0 - a;
  }
  return vec4(L, T);
}

// ---------------- the lens ----------------
vec3 mountLens(vec2 fc, out vec3 ro, out vec3 rd0) {
  vec3 rd = camRay(fc, ro);
  rd0 = rd;
  if (uAper <= 0.0) return rd;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd * (uFocus / dot(rd, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}

// ---------------- the ground's look ----------------
vec3 shadeGround(vec3 p, vec3 rd, float t, float pathMask, int cid, int ci) {
  vec3 n = terrainNormal(p.xz, t);
  if (t < 0.06) {
    // stones and grit underfoot
    vec2 q = p.xz * 2600.0;
    float e0 = fbm(q, 4), ex = fbm(q + vec2(0.05, 0.0), 4), ez = fbm(q + vec2(0.0, 0.05), 4);
    n = normalize(n + vec3(e0 - ex, 0.0, e0 - ez) * 9.0 * smoothstep(0.06, 0.01, t));
  }
  float m; massif(p.xz, m);
  float slope = 1.0 - n.y;
  float d1 = fbm(p.xz * 900.0, 4), d2 = fbm(p.xz * 60.0, 4);
  // granite: cold grey with a little blue, darker streaks and lichen
  float d3 = fbm(p.xz * 7000.0, 3);
  vec3 granite = mix(vec3(0.075, 0.078, 0.088), vec3(0.24, 0.245, 0.26), d1 * 0.7 + d3 * 0.3);
  granite = mix(granite, vec3(0.05, 0.05, 0.055), smoothstep(0.5, 0.75, d2) * 0.6);
  // pale streaks of scree and weathered bands down the faces
  granite *= 0.75 + 0.5 * fbm(vec2(p.x * 40.0, p.y * 8.0 + p.z * 6.0), 3);
  // cracks and joints in the rock
  float crk = smoothstep(0.03, 0.0, abs(fbm(p.xz * 2500.0 + 9.0, 3) - 0.5));
  granite *= 1.0 - 0.35 * crk * smoothstep(0.4, 0.1, t);
  // scree: paler broken stone on the steep middle slopes
  float scree = smoothstep(0.25, 0.45, slope) * smoothstep(0.75, 0.5, slope) * smoothstep(0.4, 0.6, fbm(p.xz * 25.0, 3));
  granite = mix(granite, vec3(0.27, 0.27, 0.28) * (0.6 + 0.6 * hash12(floor(p.xz * 4000.0))), scree * 0.6);
  // sparse junipers: dark clumps on the gentler ledges
  float jun = smoothstep(0.72, 0.8, fbm(p.xz * 700.0 + 3.0, 3)) * smoothstep(1.5, 0.3, t) * smoothstep(0.45, 0.2, slope) * smoothstep(0.1, 0.3, m);
  granite = mix(granite, vec3(0.025, 0.04, 0.03), jun);
  // the plain: dark grass and fields, mud near the river
  vec2 fq = rot(0.35 + 0.3 * (fbm(p.xz * 0.2, 2) - 0.5)) * p.xz + 0.04 * (vec2(fbm(p.xz * 6.0, 2), fbm(p.xz * 6.0 + 4.0, 2)) - 0.5);
  vec2 fc = floor(fq / vec2(0.11, 0.07));
  float field = hash12(fc);
  vec3 plain = mix(vec3(0.055, 0.06, 0.035), vec3(0.12, 0.11, 0.07), field * 0.6 + 0.4 * d2);
  // ploughed earth, darker groves and orchards
  plain = mix(plain, vec3(0.1, 0.075, 0.055), step(0.78, field) * 0.25);
  plain *= 0.85 + 0.3 * vnoise(vec2(dot(fq, vec2(1.0, 0.2)) * 900.0, field * 40.0)) * smoothstep(1.0, 0.2, t);
  float grove = smoothstep(0.58, 0.68, fbm(p.xz * 2.2 + 13.0, 4));
  plain = mix(plain, vec3(0.025, 0.035, 0.022), grove * 0.85);
  float dr = abs(p.z - riverZ(p.x));
  plain = mix(plain, vec3(0.08, 0.065, 0.05), smoothstep(0.5, 0.15, dr));
  // old snow lying on the ledges and in the gullies of the upper mountain (Hermon keeps its snow)
  float sn = fbm(p.xz * 180.0, 4);
  float snow = smoothstep(0.72, 0.86, n.y + 0.25 * (sn - 0.5)) * smoothstep(1.22, 1.45, p.y + 0.25 * (fbm(p.xz * 9.0, 3) - 0.5));
  granite = mix(granite, vec3(0.62, 0.66, 0.74) * (0.85 + 0.2 * sn), snow);
  vec3 alb = mix(plain, granite, smoothstep(0.02, 0.12, m + 0.1 * slope));
  // the trodden path: pale dust
  alb = mix(alb, vec3(0.24, 0.235, 0.23), pathMask * 0.4);
  if (cid == 1) {
    // cyclopean masonry: huge blocks in rough courses
    vec3 bq = vec3(p.x + p.z, p.y * 1.4, p.z - p.x) / 0.0034;
    bq.x += floor(bq.y) * 0.5;
    vec3 bf = fract(bq) - 0.5;
    float joint = smoothstep(0.47, 0.5, max(abs(bf.x), abs(bf.y)));
    alb = vec3(0.13, 0.12, 0.11) * (0.6 + 0.6 * hash12(floor(bq.xy) + floor(bq.z))) * (0.75 + 0.5 * fbm(p.xz * 3000.0 + p.y * 2000.0, 3));
    alb *= 1.0 - 0.7 * joint * smoothstep(0.5, 0.1, t);
  }            // cyclopean stone
  else if (cid == 2) alb = vec3(0.2, 0.15, 0.11) * (0.6 + 0.6 * hash12(floor(p.xz / 0.013)));                   // mud brick
  else if (cid == 3) alb = vec3(0.16, 0.13, 0.1);
  // light: the cold silver key, the sky, the fire of the valley
  float dif = sat(dot(n, KEY));
  float sh = dif > 0.0 && t < 9.0 ? terrainShadow(p + n * 0.0008, KEY) : (dif > 0.0 ? 1.0 : 0.0);
  vec3 col = alb * uKeyCol * dif * sh * 0.32 * (1.0 - 0.85 * uNight);
  if (uShaft.z > 0.0) {
    float sd = length(p.xz - uShaft.xy) + 0.6 * (fbm(p.xz * 0.8 + uWindT * 0.05, 3) - 0.5);
    col += alb * uKeyCol * dif * 0.3 * uShaft.z * smoothstep(1.6, 0.1, sd);
  }
  vec3 amb = mix(vec3(0.07, 0.065, 0.1), vec3(0.008, 0.008, 0.014), uNight);
  col += alb * amb * (0.5 + 0.5 * n.y) * mix(2.6, 1.3, smoothstep(0.02, 0.15, m));
  vec3 gf = glowField(p.xz);
  col += alb * gf * (0.25 + 0.35 * n.y) * (ci >= 0 ? 0.12 : 0.12);
  // a dull sheen on wet stone and the river's mirror
  if (dr < 0.36 && m < 0.02 && cid == 0) {
    float wv = vnoise(p.xz * 400.0 + uTime * 0.4);
    vec3 r = reflect(rd, normalize(vec3((wv - 0.5) * 0.04, 1.0, 0.0)));
    float fr = 0.03 + 0.97 * pow(1.0 - sat(-rd.y), 5.0);
    float wet = smoothstep(0.34, 0.24, dr + 0.06 * (fbm(p.xz * 8.0, 3) - 0.5));
    col = mix(col, skyClouds(r, p) * 1.15 + glowField(p.xz) * 0.12, wet * (0.6 + 0.4 * fr));
  }
  col += alb * nearLights(p, n);
  col += alb * watcherLit(p, n);
  if (uGateOn > 0.5) { vec3 dg = GATE + vec3(0.0, 0.006, 0.003) - p; col += alb * (COLD * uGateFlare * 2.0 + vec3(1.0, 0.3, 0.08) * 0.6) * 0.00003 / (dot(dg, dg) + 0.00002); }
  float pix = t * 0.0012;
  col += groundLights(p, n, cid, ci, pix);
  return col;
}

// the whole world along one ray; returns colour and the hit distance
vec3 mountWorld(vec3 ro, vec3 rd, float jit, out float depth) {
  // near things first (altar, lamps, ledge): their own short march
  float tn; vec3 nearCol; float nearHit = nearMarch(ro, rd, tn);
  float t0 = 0.0;
  // skip empty sky above the deck quickly
  if (ro.y > 1.85 && rd.y < 0.0) t0 = (ro.y - 1.85) / -rd.y;
  vec2 h = (ro.y > 1.85 && rd.y >= 0.0) ? vec2(80.0, 0.0) : marchTerrain(ro, rd, 75.0, t0);
  vec3 col; float tHit = h.x;
  if (nearHit > 0.5 && tn < h.x) {
    vec3 p = ro + rd * tn;
    col = shadeNear(p, rd, tn);
    tHit = tn;
  } else if (h.y > 0.5) {
    vec3 p = ro + rd * h.x;
    float pm; int cid, ci; terrain(p.xz, 9, pm, cid, ci);
    col = shadeGround(p, rd, h.x, pm, cid, ci);
  } else {
    col = skyClouds(rd, ro);
    tHit = 100.0;
  }
  // distance fog: the cold violet air
  float fogA = tHit < 99.0 ? 1.0 - exp(-tHit * 0.035) : 0.0;
  vec3 fogC = skyBase(normalize(vec3(rd.x, 0.02, rd.z))) * 0.9;
  col = mix(col, fogC, fogA * 0.8);
  vec4 hz = haze(ro, rd, tHit, jit);
  col = col * hz.a + hz.rgb;
  vec4 dk = deck(ro, rd, tHit, jit);
  col = col * dk.a + dk.rgb;
  // air glows: the lamps, the altar's coals and smoke
  col = nearAir(ro, rd, tHit, col, jit);
  depth = tHit;
  return col;
}
vec3 mountShade(vec2 fc) {
  vec3 ro, rd0; vec3 rd = mountLens(fc, ro, rd0);
  RD0 = rd0;
  float jit = hash12(fc + fract(uTime * 7.31 + uJitter.x) * 57.0);
  float depth;
  return mountWorld(ro, rd, jit, depth);
}
`;
