// The storm wall (s32): God's foretelling of the flood, seen as a vision. A towering front of black
// cloud and rain rolls across the open plain toward the camera: a shelf cloud with a tiered lip, a
// curtain of rain hanging under it to the ground, lightning inside it and bolts to the plain on the
// drum hits, the grass beneath flattened in streaks by the outflow wind. It arrives and swallows the
// frame. The scene opens out of a full-frame white flash. Metres; ground y = 0; the front advances
// toward -z. Graded near-monochrome ash by the scene.
import { STORM_COMMON } from './x-storm.js';

export const WALL_UNIFORMS = {
  uFocus: 400, uAper: 0.0, uFront: 3000, uWhite: 0, uFlash: [0, 0, 0, 0], uBolt: [0, 0, 0, 0], uBoltX: [0, 0, 0, 0], uRainNear: 0,
};

export const WALL_GLSL = STORM_COMMON + /* glsl */ `
uniform float uFront;      // z of the shelf cloud's leading edge at the ground
uniform float uWhite;      // the opening white flash 0..1
uniform vec4 uFlash;       // four lightning sources' brightness
uniform vec4 uBolt;        // four visible bolts' brightness
uniform vec4 uBoltX;       // their x positions (metres) and seeds
uniform float uRainNear;   // rain close to the lens as the front arrives

float groundH(vec2 xz) { return 1.5 * fbm(xz * 0.004, 3) + 0.3 * fbm(xz * 0.05, 2); }

// the shelf cloud: a leaning wedge with tiers along its lip
float shelf(vec3 p) {
  float z = p.z - uFront;
  // two or three tiers, irregular: their heights, depths and overhangs all wander along the front
  float v1 = vnoise(vec2(p.x * 0.0009, 3.0)), v2 = vnoise(vec2(p.x * 0.0021, 7.0)), v3 = vnoise(vec2(p.x * 0.0006, 11.0));
  float h1 = 300.0 + 120.0 * v1;                    // the lowest lip
  float h2 = h1 + 260.0 + 260.0 * v2;               // the second, sometimes high, sometimes merged
  float d1 = 260.0 + 260.0 * v3;                    // how far the low lip juts out ahead of the second
  float d2 = 120.0 + 260.0 * v2 * v1;
  // the face: forward at the low lip, stepping back above each tier, rolling back at the top
  float back = d1 * smoothstep(h1 - 20.0, h1 + 140.0, p.y) + d2 * smoothstep(h2 - 30.0, h2 + 160.0, p.y);
  // the lips bulge out a little, rounded
  float lip = 90.0 * exp(-pow((p.y - h1 - 40.0) / 70.0, 2.0)) * (0.6 + 0.8 * v2) + 70.0 * exp(-pow((p.y - h2 - 40.0) / 90.0, 2.0)) * v3;
  float lean = z - back + lip + 0.0001 * pow(max(p.y - 1300.0, 0.0), 2.0);
  float face = lean - 300.0 * (fbm(vec2(p.x * 0.0011, p.y * 0.0016 + 0.5), 4) - 0.5);
  // a lumpy underside, lowest just behind the lip, rising toward the rain
  float base = h1 - 40.0 + 0.1 * max(z, 0.0) + 90.0 * (fbm(vec2(p.x * 0.006, z * 0.006), 3) - 0.5);
  return max(-face, base - p.y);
}
// ragged scud hanging under the shelf's lip
float scud(vec3 p) {
  float z = p.z - uFront;
  float zone = smoothstep(-140.0, 20.0, z) * smoothstep(420.0, 160.0, z);
  float top = 300.0 + 120.0 * vnoise(vec2(p.x * 0.0009, 3.0));
  float band = smoothstep(top - 260.0, top - 120.0, p.y) * smoothstep(top + 20.0, top - 60.0, p.y);
  float n = cloudFbm(p * vec3(0.006, 0.012, 0.006) + vec3(uTime * 0.3, 0.0, uTime * 0.4), 3);
  return zone * band * smoothstep(0.52, 0.7, n) * 1.2;
}
// the rain curtain under the shelf: grey, streaked, to the ground
float wallRain(vec3 p) {
  float z = p.z - uFront;
  float rainZone = smoothstep(0.0, 260.0, z - 0.15 * p.y) * smoothstep(380.0, 200.0, p.y);
  float streak = 0.5 + 0.5 * vnoise(vec3(p.x * 0.04, p.y * 0.003 + uTime * 1.2, z * 0.015));
  float sheets = fbm(vec2(p.x * 0.006 + z * 0.002, uTime * 0.2), 3);
  return rainZone * (0.45 + 0.55 * streak * smoothstep(0.25, 0.7, sheets)) * 0.9;
}
// dust and ash thrown ahead of the front along the ground by its outflow
float wallDust(vec3 p) {
  float z = p.z - uFront;
  float zone = smoothstep(-380.0, -120.0, z) * smoothstep(120.0, -20.0, z);
  float h = 60.0 + 50.0 * vnoise(vec2(p.x * 0.004, uTime * 0.3)) + 0.3 * max(z + 380.0, 0.0);
  float n = vnoise(vec3(p.x * 0.012, p.y * 0.02, z * 0.012 + uTime * 1.2)) * 0.6 + 0.4 * vnoise(p * 0.04 + vec3(0.0, 0.0, uTime * 3.0));
  return zone * smoothstep(h, h * 0.3, p.y) * smoothstep(0.35, 0.7, n) * 0.5;
}
float wallDensity(vec3 p, int oct) {
  if (p.y > 2700.0) return 0.0;
  float dust = p.y < 260.0 ? wallDust(p) : 0.0;
  float sd = shelf(p);
  if (sd > 180.0) return max(max(wallRain(p), dust), p.y < 450.0 ? scud(p) : 0.0);
  vec3 np = p * vec3(0.0025, 0.004, 0.0025) + vec3(uTime * 0.02, -uTime * 0.04, uTime * 0.06);
  float n = cloudFbm(np, oct);
  // rolling billows along the lip: the cloud turns over on itself as it comes
  float roll = sin(p.y * 0.02 - (p.z - uFront) * 0.012 + uTime * 0.8 + 3.0 * n);
  // rounded lobes (folded noise) along the lips, finer turbulence on them, churning
  float lob = oct > 2 ? 1.0 - pow(vnoise(p * vec3(0.009, 0.014, 0.009) + vec3(uTime * 0.15, 0.0, uTime * 0.3)) * 2.0 - 1.0, 2.0) : 0.5;
  float fine = oct > 3 ? vnoise(p * 0.035 + vec3(0.0, -uTime * 0.4, uTime * 0.6)) - 0.5 : 0.0;
  float d = sat((-sd + 40.0 + 200.0 * (n - 0.5) + 25.0 * roll + 60.0 * (lob - 0.55) + 35.0 * fine) * 0.012);
  // the top of the wall, cauliflowered, with the night sky above it
  d *= smoothstep(2500.0, 2000.0, p.y + 600.0 * (n - 0.5));
  return max(max(max(d, wallRain(p)), dust), scud(p));
}

// a bolt on a plane in the front: a jagged main channel with forked, jagged branches
float jagged(vec2 q, vec2 a, vec2 dir, float len, float seed, int n) {
  float d = 1e9;
  vec2 side = vec2(-dir.y, dir.x);
  for (int i = 0; i < 10; i++) {
    if (i >= n) break;
    float fi = float(i);
    vec2 b = a + dir * (len / float(n)) + side * (hash11(seed + fi * 3.1) - 0.5) * len * 0.22;
    vec2 pa = q - a, ba = b - a;
    float h = sat(dot(pa, ba) / dot(ba, ba));
    d = min(d, length(pa - ba * h));
    a = b;
  }
  return d;
}
float boltD(vec2 q, float seed, float top, out float br) {
  float d = 1e9; br = 1e9;
  vec2 a = vec2(0.0, top);
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    vec2 b = a + vec2((hash11(seed + fi * 3.1) - 0.5) * 55.0 + 12.0 * (vnoise(vec2(fi * 3.0, seed)) - 0.5), -top / 12.0);
    vec2 pa = q - a, ba = b - a;
    float h = sat(dot(pa, ba) / dot(ba, ba));
    d = min(d, length(pa - ba * h));
    // forks: jagged branches leaving the channel downward and out, thinner, fading
    if (hash11(seed + fi * 7.7) > 0.55 && i < 9) {
      float sg = hash11(seed + fi * 5.3) > 0.5 ? 1.0 : -1.0;
      vec2 dir = normalize(vec2(sg * (0.6 + 0.6 * hash11(seed + fi * 2.1)), -1.0));
      br = min(br, jagged(q, a, dir, top * (0.12 + 0.18 * hash11(seed + fi * 9.9)), seed + fi * 13.0, 6));
    }
    a = b;
  }
  return d;
}

vec3 wallScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float flashAll = dot(uFlash, vec4(1.0));
  // ground
  float tg = 1e6;
  if (rd.y < 0.0) {
    tg = -ro.y / rd.y;
    for (int i = 0; i < 4; i++) { vec3 p = ro + rd * tg; tg = (groundH(p.xz) - ro.y) / rd.y; }
  }
  // sky above and behind the front: a low, dark, smooth deck
  vec3 sky = mix(vec3(0.05, 0.052, 0.058), vec3(0.018, 0.019, 0.022), sat(rd.y * 1.6));
  // high above and behind the front, a break of thinner, paler cloud for the wall to stand against
  sky += vec3(0.1, 0.105, 0.12) * smoothstep(0.05, 0.4, rd.y) * smoothstep(0.3, 0.7, fbm(rd.xy / max(rd.z, 0.2) * 2.5 + vec2(uTime * 0.03, 0.0), 4));
  sky *= 0.8 + 0.4 * fbm(rd.xy / max(rd.z, 0.1) * 3.0 + vec2(0.0, uTime * 0.05), 4);
  sky += vec3(0.6, 0.65, 0.75) * flashAll * 0.05 * (0.4 + 0.6 * sat(1.0 - rd.y * 2.0));
  vec3 col = sky;
  if (tg < 1e5) {
    vec3 p = ro + rd * tg;
    // grass flattened in streaks by the outflow, rippling toward us
    float streak = fbm(vec2(p.x * 0.15, p.z * 0.015 + uTime * 1.6), 4);
    float ripple = 0.5 + 0.5 * sin(p.z * 0.25 + uTime * 9.0 + 4.0 * streak);
    // blades combed flat toward us: fine streaks along z, shimmering as the gusts pass
    float comb = fbm(vec2(p.x * 3.0, p.z * 0.25 + uTime * 2.0), 3);
    vec3 alb = vec3(0.22, 0.2, 0.15) * (0.55 + 0.5 * streak) * (0.75 + 0.35 * ripple) * (0.7 + 0.6 * comb);
    // the land darkens under the shadow of the front
    float under = smoothstep(-200.0, 200.0, p.z - uFront);
    vec3 lit = vec3(0.12, 0.125, 0.14) * (1.0 - 0.75 * under) + vec3(0.7, 0.75, 0.85) * flashAll * 0.12;
    col = alb * lit;
    col = mix(col, vec3(0.045, 0.048, 0.053) * (1.0 - 0.6 * under), 1.0 - exp(-tg * 0.0012));
  }
  // the wall: march through it
  vec3 scat = vec3(0); float T = 1.0;
  {
    // only the slab of space the front occupies
    float za = uFront - 420.0, zb = uFront + 1600.0;
    float t0 = rd.z > 0.0 ? max((za - ro.z) / rd.z, 2.0) : 2.0;
    float t1 = min(tg, rd.z > 0.0 ? (zb - ro.z) / rd.z : 6000.0);
    t1 = min(t1, rd.y > 0.0 ? (2600.0 - ro.y) / rd.y : 1e5);
    float jit = hash12(fc + uJitter * 29.0 + fract(uTime * 5.0) * 9.0);
    float tt = t0 + jit * 20.0;
    for (int i = 0; i < 110; i++) {
      if (tt > t1) break;
      vec3 p = ro + rd * tt;
      float sd = shelf(p);
      float z = p.z - uFront;
      float dt = max(10.0, (t1 - t0) / 90.0);
      
      float den = wallDensity(p, 5);
      if (den > 0.002) {
        float sig = den * 0.08;
        // the wall's faces turned toward us and down catch the dim ash light of the open sky behind
        // the camera; each billow shades the ones behind it, so the tiers and lobes read
        // light from below and in front (the flashes reflected off the plain): undersides of each
        // tier's lip catch it, the faces above stay dark
        vec3 Lf = normalize(vec3(0.1, -1.0, -0.45));
        float Tf = exp(-wallDensity(p + Lf * 80.0, 2) * 3.2);
        float amb = 0.1 * (0.04 + 0.96 * Tf * Tf) * (0.45 + 1.1 * vnoise(p * vec3(0.004, 0.008, 0.004) + vec3(0.0, 0.0, uTime * 0.1))) * (0.4 + 0.6 * smoothstep(1800.0, 300.0, p.y));
        // lightning: a global flicker across the whole front plus the strokes' local blaze
        vec3 S = vec3(0.86, 0.9, 1.0) * amb;
        // small strokes flickering here and there inside, each lighting only its own part of the wall
        for (int k = 0; k < 3; k++) {
          float slot = floor(uTime * 7.0 + float(k) * 0.37);
          float ph = fract(uTime * 7.0 + float(k) * 0.37);
          vec2 hh = hash22(vec2(slot, float(k) * 7.0));
          float on = step(0.5, hash12(vec2(slot * 1.3, float(k)))) * exp(-ph * 4.0);
          vec3 sp = vec3((hh.x - 0.5) * 3000.0, 400.0 + 700.0 * hh.y, uFront + 300.0 + 400.0 * hash11(slot + float(k)));
          S += vec3(0.6, 0.65, 0.85) * on * 0.25 * exp(-length(p - sp) / 300.0);
        }
        for (int k = 0; k < 4; k++) {
          if (uFlash[k] < 0.01) continue;
          vec3 sp = vec3(uBoltX[k], 330.0 + 260.0 * float(k % 2), uFront + 260.0 + 120.0 * float(k));
          vec3 ld = sp - p; float d = length(ld); ld /= d;
          float Tl = exp(-wallDensity(p + ld * 70.0, 2) * 2.5);
          S += vec3(0.75, 0.8, 0.95) * uFlash[k] * 1.1 * exp(-d / 260.0) * (0.15 + 0.85 * Tl);
        }
        float a = exp(-sig * dt);
        scat += T * S * (1.0 - a);
        T *= a;
        if (T < 0.01) break;
      }
      tt += dt;
    }
  }
  col = col * T + scat;
  // the bolts, standing in the rain under the shelf
  for (int k = 0; k < 4; k++) {
    if (uBolt[k] < 0.01) continue;
    float zb = uFront + 260.0 + 120.0 * float(k);
    float tb = (zb - ro.z) / rd.z;
    if (tb <= 0.0) continue;
    vec3 p = ro + rd * tb;
    float br;
    float d = boltD(vec2(p.x - uBoltX[k], p.y), uBoltX[k] * 0.37 + float(k) * 11.0, 420.0, br);
    float pw = tb * 2.0 * tan(radians(uFov) * 0.5) / uRes.y;
    float core = sat((pw * 0.8 + 0.6 - d) / pw);
    float bcore = sat((pw * 0.6 + 0.2 - br) / pw) * 0.6;
    float glow = exp(-d / 60.0) * 0.12 + exp(-d / 18.0) * 0.35 + exp(-br / 15.0) * 0.12;
    col += vec3(0.85, 0.9, 1.0) * uBolt[k] * ((core + bcore) * 6.0 + glow) * step(0.0, p.y);
  }
  // rain close to the lens: fast slanting streaks
  if (uRainNear > 0.001) {
    vec2 uv = fc / uRes.y;
    float acc = 0.0;
    for (int L = 0; L < 3; L++) {
      float sc = 30.0 + 25.0 * float(L);
      vec2 g = vec2(uv.x * sc + uv.y * sc * 0.18, uv.y * sc * 0.08 + uTime * (3.0 + float(L)));
      vec2 cell = floor(g);
      vec2 f = fract(g) - 0.5;
      float h = hash12(cell + float(L) * 7.0);
      float s = step(0.6, h) * smoothstep(0.06, 0.0, abs(f.x + (h - 0.5) * 0.5)) * smoothstep(0.5, 0.1, abs(f.y));
      acc += s * (0.4 + 0.3 * float(L));
    }
    // inside the front: a churning grey murk of rain, lit by the flashes
    float murk = fbm(vec2(uv.x * 2.0 + uTime * 0.6, uv.y * 1.5 + uTime * 2.5), 4);
    vec3 grey = vec3(0.05, 0.053, 0.058) * (0.6 + 0.8 * murk) * (1.0 + 0.6 * smoothstep(0.2, 0.8, uv.y)) + vec3(0.25) * flashAll * 0.15;
    col = mix(col, grey, uRainNear * 0.7);
    col += vec3(0.1, 0.105, 0.11) * acc * uRainNear * (1.0 + 4.0 * flashAll);
  }
  // the doorway into the vision: a full-frame white flash
  // (full white for the first frames, then a quick fall through bright haze into the vision)
  col = uWhite >= 0.999 ? vec3(30.0) : col + vec3(1.4, 1.45, 1.5) * uWhite * uWhite;
  return col;
}
`;
