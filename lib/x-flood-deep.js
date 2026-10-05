// The flood foretold (God's vision of what will come, s33 and s34).
// cityScene: the empty valley city of Cain at night in rain falling in sheets: a colossal cyclopean
//   wall with two towers and a great gate, water pouring off its parapet in falls, the street a river
//   running toward the camera, bronze braziers whose fires hiss out one after another under steam.
// deepScene: the open plain: the fountains of the great deep break open, columns of water burst up
//   through the cracked ground, the flood rises over the land (and at last over the lens), lightning.
// Everything is a pure function of uTime and the uniforms.
import { SKY_GLSL, SKY_UNIFORMS } from './x-flood-sky.js';

// the vision's look: cold ash, near monochrome, a little softer, a heavier vignette
export const FORETOLD = { saturation: 0.16, contrast: 1.02, vignette: 0.68, bloom: 0.2, threshold: 0.8, grain: 0.02 };

export const DEEP_UNIFORMS = {
  ...SKY_UNIFORMS,
  uLevel: 0.5,                      // water level (m)
  uFlow: 3.0,                       // speed of the flood's current toward the camera (m/s)
  uFire: [1, 1, 1, 1],              // the three braziers and the gate fire, 0 out .. 1 burning
  uOut: [1e4, 1e4, 1e4, 1e4],       // when each went out (for its steam)
  uFount: new Array(24).fill(0),    // fountains: (x, z, start, height) x 6
};

export const DEEP_GLSL = SKY_GLSL + /* glsl */ `
uniform float uLevel, uFlow;
uniform vec4 uFire, uOut;
uniform float uFount[24];

const vec3 FIRE = vec3(1.0, 0.45, 0.14);

// ---------- water ----------
float waterH(vec2 xz) {
  vec2 f = vec2(xz.x, xz.y - uTime * uFlow);
  float h = (vnoise(f * vec2(0.35, 0.18)) - 0.5) * 0.3 + (vnoise(f * vec2(1.2, 0.6) + 3.0) - 0.5) * 0.12 + (vnoise(f * 3.1 + 7.0) - 0.5) * 0.04;
  return h;
}
vec3 waterN(vec3 p, float t) {
  float e = 0.05 + t * 0.002;
  float h = waterH(p.xz);
  vec3 n = normalize(vec3(h - waterH(p.xz + vec2(e, 0.0)), e, h - waterH(p.xz + vec2(0.0, e))));
  // rain rings
  if (uRain > 0.0 && t < 40.0) {
    vec2 q = p.xz * 2.2; vec2 cell = floor(q); vec2 f = fract(q) - 0.5 - (hash22(cell) - 0.5) * 0.5;
    float ph = fract(uTime * 1.7 + hash12(cell));
    float r = length(f) - ph * 0.5;
    float ring = sin(r * 50.0) * exp(-ph * 3.5) * smoothstep(0.08, 0.0, abs(r));
    n = normalize(n + vec3(f.x, 0.0, f.y) * ring * 0.6 * uRain * smoothstep(40.0, 5.0, t));
  }
  return n;
}
float foamAt(vec2 xz) {
  vec2 f = vec2(xz.x, xz.y - uTime * uFlow * 1.1);
  return smoothstep(0.55, 0.85, fbm(f * vec2(0.5, 0.15), 3)) * 0.8 + smoothstep(0.7, 0.9, vnoise(f * vec2(2.0, 0.6))) * 0.4;
}

// ---------- the city ----------
float merlons(vec3 p) { float mx = mod(p.x, 5.0) - 2.5; return sdBox(vec3(mx, p.y - 39.2, p.z + 3.0), vec3(1.6, 1.4, 3.2)); }
float citySD(vec3 p, out int id) {
  id = 1;
  float wall = sdBox(p - vec3(0.0, 17.5, -4.0), vec3(80.0, 20.0, 4.0));
  wall = min(wall, max(merlons(p), abs(p.x) - 80.0));
  // towers
  vec3 tq = vec3(abs(p.x) - 24.0, p.y - 22.0, p.z + 1.0);
  float tower = sdBox(tq, vec3(6.0, 25.0, 7.0));
  float tm = sdBox(vec3(mod(tq.x + 1.5, 3.0) - 1.5, tq.y - 26.2, tq.z), vec3(1.0, 1.4, 7.0));
  tower = min(tower, max(tm, max(abs(tq.x) - 6.0, abs(tq.z) - 7.0)));
  wall = min(wall, tower);
  // the great gate: a tall arch cut through the wall
  vec2 g = vec2(abs(p.x), p.y);
  float arch = min(sdBox(vec3(g.x, g.y - 7.0, 0.0), vec3(5.0, 9.0, 100.0)), length(vec2(g.x, g.y - 16.0)) - 5.0);
  arch = max(arch, abs(p.z + 4.0) - 4.3);
  wall = max(wall, -arch);
  float d = wall;
  // the far side of the gate: the inner court's glow
  float back = sdBox(p - vec3(0.0, 10.0, -11.0), vec3(12.0, 12.0, 0.5));
  if (back < d) { d = back; id = 2; }
  // braziers: bronze bowls on stone pedestals
  for (int i = 0; i < 3; i++) {
    vec3 b = i == 0 ? vec3(-13.0, 0.0, 13.0) : i == 1 ? vec3(-3.0, 0.0, 8.0) : vec3(10.0, 0.0, 15.0);
    vec3 q = p - b;
    float ped = sdBox(q - vec3(0.0, 1.0, 0.0), vec3(0.7, 1.6, 0.7)) - 0.05;
    float bowl = max(length(q - vec3(0.0, 3.6, 0.0)) - 1.6, q.y - 3.5);
    bowl = max(bowl, -(length(q - vec3(0.0, 3.8, 0.0)) - 1.45));
    float pd = min(ped, bowl);
    if (pd < d) { d = pd; id = bowl < ped ? 4 : 3; }
  }
  return d;
}
float cityD(vec3 p) { int i; return citySD(p, i); }

// water falling off the parapet and from the tower drains: x, width, top
vec3 fallOf(int i) {
  if (i == 0) return vec3(-41.0, 3.5, 38.0);
  if (i == 1) return vec3(-31.0, 2.0, 30.0);
  if (i == 2) return vec3(-12.0, 4.5, 38.0);
  if (i == 3) return vec3(14.0, 3.0, 38.0);
  if (i == 4) return vec3(31.5, 2.0, 34.0);
  return vec3(46.0, 5.0, 38.0);
}
// a fall sheet, a little out from the wall face: returns hit t (or -1) and the sheet coords
float fallHit(vec3 ro, vec3 rd, int i, out vec2 uv) {
  vec3 f = fallOf(i);
  float zf = (i == 1 || i == 4) ? 7.4 : 0.8;
  float t = (zf - ro.z) / rd.z;
  if (t < 0.0) return -1.0;
  vec3 p = ro + rd * t;
  float drop = f.z - p.y;
  float x = p.x - f.x;
  // the sheet spreads and frays as it falls
  float w = f.y * (1.0 + drop * 0.02) * (0.8 + 0.35 * vnoise(vec2(p.y * 0.15 - uTime * 2.0, float(i))));
  if (drop < 0.0 || p.y < uLevel - 0.2 || abs(x) > w) return -1.0;
  uv = vec2(x / w, drop);
  return t;
}

float fireFlick(int i) { return 0.8 + 0.2 * vnoise(vec2(uTime * 9.0, float(i) * 7.0)) + 0.1 * sin(uTime * 23.0 + float(i)); }
vec3 brazierTop(int i) { return (i == 0 ? vec3(-13.0, 0.0, 13.0) : i == 1 ? vec3(-3.0, 0.0, 8.0) : vec3(10.0, 0.0, 15.0)) + vec3(0.0, 3.7, 0.0); }
float fireK(int i) { return i == 0 ? uFire.x : i == 1 ? uFire.y : i == 2 ? uFire.z : uFire.w; }
float outT(int i) { return i == 0 ? uOut.x : i == 1 ? uOut.y : i == 2 ? uOut.z : uOut.w; }

vec3 cityLight(vec3 p, vec3 n, vec3 v, vec3 alb, float rough) {
  vec3 col = alb * vec3(0.10, 0.11, 0.14) * (0.45 + 0.55 * n.y);
  vec3 ml = normalize(vec3(0.3, 0.6, 0.75));
  col += vec3(0.16, 0.17, 0.22) * alb * sat(dot(n, ml)) / PI * 2.0;
  if (uFlash > 0.01) col += vec3(0.6, 0.65, 0.85) * uFlash * alb * (sat(dot(n, normalize(uLightDir))) * 0.9 + 0.15);
  for (int i = 0; i < 3; i++) {
    float k = fireK(i); if (k <= 0.0) continue;
    vec3 L = brazierTop(i) + vec3(0.0, 1.0, 0.0) - p; float d2 = dot(L, L); vec3 l = L * inversesqrt(d2);
    vec3 lc = FIRE * k * fireFlick(i) * 60.0 / (d2 + 2.0);
    vec3 h = normalize(l + v); float nh = sat(dot(n, h)); float a = rough * rough; float dd = nh * nh * (a * a - 1.0) + 1.0;
    col += lc * sat(dot(n, l)) * (alb / PI + 0.04 * a * a / (PI * dd * dd));
  }
  // the gate fire
  if (uFire.w > 0.0) {
    vec3 L = vec3(0.0, 6.0, -6.0) - p; float d2 = dot(L, L); vec3 l = L * inversesqrt(d2);
    col += FIRE * uFire.w * 90.0 / (d2 + 6.0) * sat(dot(n, l)) * alb / PI;
  }
  return col;
}

// a fire in a bowl: a big ragged flame drawn where the ray passes its axis, and the steam after
// a fire in a bronze bowl, drawn on a plane through its axis facing the camera: ragged tongues of
// flame torn upward and leaning in the wind, hottest low in the bowl; smoke rolling off the top;
// rain hissing to steam over it; sparks. When it is drowned, the steam boils up and drifts away.
float flameTemp(vec2 q, float hh, float k, float seed) {
  float y = q.y / hh;
  if (y < -0.15 || y > 1.5) return 0.0;
  // the wind bends the flame and tears it into tongues
  float lean = 0.35 * y * y * hh;
  float n1 = fbm(vec2(q.x * 1.3 + seed, q.y * 1.1 - uTime * 4.2), 4);
  float n2 = fbm(vec2(q.x * 3.1 - seed, q.y * 2.6 - uTime * 7.5), 3);
  float x = q.x - lean + (n1 - 0.5) * 0.9 * y * hh * 0.4;
  float w = 1.6 * max(k, 0.25) * pow(sat(1.0 - y * 0.85), 0.55);
  float F = (1.0 - abs(x) / max(w, 0.05)) * 1.1 - y * 0.75 + (n2 - 0.5) * 1.3 + (n1 - 0.5) * 0.6;
  return sat(F) * smoothstep(-0.15, 0.08, y);
}
vec3 fireRamp(float T) {
  // deep red at the ragged tips, through orange, to a small yellow-white core
  vec3 c = mix(vec3(0.5, 0.06, 0.01), vec3(1.0, 0.32, 0.05), smoothstep(0.0, 0.35, T));
  c = mix(c, vec3(1.0, 0.62, 0.22), smoothstep(0.3, 0.65, T));
  c = mix(c, vec3(1.0, 0.86, 0.6), smoothstep(0.65, 0.95, T));
  return c * (0.25 + 2.6 * T * T);
}
void bowlFire(vec3 ro, vec3 rd, int i, float depth, inout vec3 col) {
  vec3 b = brazierTop(i);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dot(b.xz - ro.xz, dxz) / max(dd, 1e-6);
  if (t <= 0.0 || t > depth + 1.0) return;
  vec3 q3 = ro + rd * t - b;
  vec2 q = vec2(dot(q3.xz, normalize(vec2(-rd.z, rd.x))), q3.y);
  float k = fireK(i);
  float seed = float(i) * 7.3;
  float fl = fireFlick(i);
  // smoke: a dark rolling plume above the flames, thinning as it rises and drifts with the wind
  if (k > 0.01) {
    float sy = q.y - 2.0 * k;
    if (sy > -1.0 && sy < 14.0) {
      float sx = q.x - 0.45 * max(sy, 0.0) - 0.02 * sy * sy;
      float sw = 0.9 + 0.35 * max(sy, 0.0);
      float sm = smoothstep(sw, sw * 0.2, abs(sx + (fbm(vec2(sy * 0.3 - uTime * 0.8, seed), 3) - 0.5) * sw)) * smoothstep(-1.0, 1.0, sy) * smoothstep(14.0, 5.0, sy);
      sm *= 0.4 + 0.8 * fbm(vec2(sx * 0.7 + seed, sy * 0.5 - uTime * 1.6), 4);
      col = mix(col, vec3(0.03, 0.03, 0.032) + FIRE * k * 0.12 * exp(-max(sy, 0.0) * 0.4), sat(sm * 0.75 * k));
    }
  }
  if (k > 0.001) {
    float hh = 4.2 * k * (0.85 + 0.25 * vnoise(vec2(uTime * 3.0, seed)));
    float T = flameTemp(q, hh, k, seed);
    if (T > 0.0) col += fireRamp(T) * min(k * 1.4, 1.0) * fl * 1.6;
    // sparks thrown up and blown off
    for (int s = 0; s < 6; s++) {
      float fs = float(s);
      float ph = fract(uTime * (0.7 + 0.3 * hash11(fs + seed)) + hash11(fs * 3.7 + seed));
      vec2 sp = vec2((hash11(fs * 1.3 + seed) - 0.5) * 1.2 + ph * ph * 2.5, ph * 5.0 * k + 0.3);
      float dsp = length(q - sp);
      col += vec3(1.0, 0.55, 0.2) * k * (1.0 - ph) * 2.5 * exp(-dsp / (0.03 + t * 0.0008));
    }
    // the hot glow round the bowl, lit from above
    float h = length(q - vec2(0.0, 0.9));
    col += FIRE * k * fl * 0.18 * exp(-h / 1.6);
    // rain hissing to steam in the heat: pale wisps flicking up over the flames
    float wy = q.y - hh * 0.75;
    if (wy > -0.5 && wy < 4.0) {
      float wsp = fbm(vec2(q.x * 1.8 + seed, wy * 1.2 - uTime * 5.0), 3);
      float wisp = smoothstep(0.6, 0.85, wsp) * smoothstep(1.6, 0.2, abs(q.x - 0.3 * wy)) * smoothstep(-0.5, 0.5, wy) * smoothstep(4.0, 1.0, wy);
      col += vec3(0.2, 0.2, 0.21) * wisp * uRain * 0.5;
    }
  }
  // drowned: the steam boils up white and is torn away
  float st = uTime - outT(i);
  if (st > -0.4 && st < 5.0) {
    float s = sat((st + 0.4) / 0.5) * exp(-max(st, 0.0) * 0.5);
    float y = q.y;
    vec2 w = vec2(q.x - y * 0.4 - max(st, 0.0) * 0.8, y);
    float plume = smoothstep(1.3 + y * 0.4, 0.0, abs(w.x)) * smoothstep(-0.3, 0.6, y) * smoothstep(12.0, 3.0, y);
    plume *= 0.4 + 0.9 * fbm(vec2(w.x * 0.7, y * 0.6 - uTime * 2.8) + seed, 4);
    col = mix(col, vec3(0.32, 0.33, 0.35), sat(plume * s * 0.8));
  }
}

vec3 cityScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  // march the city
  int id = -1; float t = 0.05; bool hit = false;
  for (int i = 0; i < 150; i++) {
    vec3 p = ro + rd * t;
    float d = citySD(p, id);
    if (d < 0.002 * t) { hit = true; break; }
    t += d * 0.9;
    if (t > 600.0) break;
  }
  // the water surface
  float tw = rd.y < 0.0 ? (uLevel - ro.y) / rd.y : 1e5;
  vec3 sky = stormSky(rd);
  vec3 col; float depth;
  if (hit && t < tw) {
    vec3 p = ro + rd * t; depth = t;
    vec2 e = vec2(0.003 * t + 0.002, 0.0);
    vec3 n = normalize(vec3(cityD(p + e.xyy) - cityD(p - e.xyy), cityD(p + e.yxy) - cityD(p - e.yxy), cityD(p + e.yyx) - cityD(p - e.yyx)));
    vec3 alb; float rough = 0.6;
    if (id == 1) {
      // colossal cyclopean blocks: irregular polygons, deep joints, streaming wet
      vec2 sp = abs(n.z) > 0.5 ? p.xy : vec2(p.z, p.y);
      vec2 vo = voronoiEdge(sp * vec2(0.16, 0.21) + (vec2(vnoise(sp * 0.5), vnoise(sp * 0.5 + 4.0)) - 0.5) * 0.25);
      float joint = smoothstep(0.035, 0.0, vo.x) * (0.6 + 0.4 * vnoise(sp * 2.0));
      alb = vec3(0.26, 0.24, 0.22) * (0.7 + 0.5 * vo.y) * (0.75 + 0.5 * fbm(sp * 0.8, 3));
      alb *= 1.0 - joint * 0.8;
      // wet streaks running down the face
      float wetS = smoothstep(0.4, 0.8, vnoise(vec2(sp.x * 1.5, sp.y * 0.05 + uTime * 0.2)));
      alb *= 1.0 - 0.45 * wetS * uRain;
      rough = mix(0.8, 0.45, wetS * uRain);
      n = normalize(n + vec3(0.0, 0.0, 0.0) + (vec3(vnoise(sp * 3.0), vnoise(sp * 3.0 + 5.0), 0.0) - 0.5) * 0.3 * (1.0 - joint));
    } else if (id == 2) {
      alb = vec3(0.04);
    } else if (id == 3) {
      alb = vec3(0.2, 0.19, 0.18) * (0.8 + 0.4 * fbm(p.xy * 2.0, 3));
    } else {
      alb = vec3(0.35, 0.22, 0.1) * (0.6 + 0.5 * fbm(p.xz * 3.0, 3)); rough = 0.35;
    }
    col = cityLight(p, n, -rd, alb, rough);
    // fire light shining out of the gate
    if (id == 2) col += FIRE * uFire.w * (0.15 + 0.5 * smoothstep(18.0, 2.0, p.y)) * (0.7 + 0.3 * vnoise(vec2(uTime * 5.0, p.x * 0.3 + p.y * 0.2)));
  } else if (tw < 1e4) {
    // the river in the street
    vec3 p = ro + rd * tw; depth = tw;
    vec3 n = waterN(p, tw);
    vec3 r = reflect(rd, n);
    float fr = 0.03 + 0.97 * pow(1.0 - sat(dot(n, -rd)), 5.0);
    // what the water mirrors: the wall (dark, a guess), the sky, the fires as long streaks
    vec3 refl = stormSkyLo(r) * 0.9;
    // does the reflected ray meet the wall?
    float tz = r.z < 0.0 ? (0.0 - p.z) / r.z : 1e5;
    if (tz < 1e4 && p.y + r.y * tz < 38.0) refl = vec3(0.025, 0.025, 0.03) + FIRE * uFire.w * 0.15 * exp(-abs(p.x + r.x * tz) / 6.0);
    for (int i = 0; i < 3; i++) {
      float k = fireK(i); if (k <= 0.0) continue;
      vec3 L = brazierTop(i) + vec3(0.0, 1.2, 0.0) - p; vec3 l = normalize(L);
      vec3 h = normalize(l - rd); float nh = sat(dot(n, h));
      refl += FIRE * k * fireFlick(i) * (pow(nh, 300.0) * 9.0 + pow(nh, 40.0) * 0.8);
    }
    if (uFlash > 0.0) refl += vec3(0.6, 0.65, 0.85) * uFlash * pow(sat(dot(r, normalize(uLightDir))), 6.0) * 0.8;
    vec3 body = vec3(0.025, 0.026, 0.024) + cityLight(p, vec3(0, 1, 0), -rd, vec3(0.05), 0.9) * 0.6;
    col = mix(body, refl, fr);
    // foam and debris streaks carried toward us
    float fo = foamAt(p.xz);
    col = mix(col, cityLight(p, vec3(0, 1, 0), -rd, vec3(0.5), 0.9), fo * 0.35);
  } else {
    col = sky; depth = 2000.0;
  }
  // falls in front of the wall
  for (int i = 0; i < 6; i++) {
    vec2 uv; float tf = fallHit(ro, rd, i, uv);
    if (tf < 0.0 || tf > depth) continue;
    float streak = vnoise(vec2(uv.x * 9.0, uv.y * 0.35 - uTime * 7.0)) * 0.6 + vnoise(vec2(uv.x * 23.0, uv.y * 0.9 - uTime * 11.0)) * 0.4;
    float edge = smoothstep(1.0, 0.6, abs(uv.x));
    float a = edge * (0.45 + 0.5 * streak) * smoothstep(0.0, 1.0, uv.y);
    vec3 p = ro + rd * tf;
    vec3 lit = cityLight(p, vec3(0.0, 0.3, 1.0), -rd, vec3(0.6), 0.5) + vec3(0.05, 0.055, 0.06);
    col = mix(col, lit * (0.7 + 0.6 * streak), a * 0.85);
    depth = mix(depth, tf, a);
  }
  // spray and mist where the falls hit the water
  for (int i = 0; i < 6; i++) {
    vec3 f = fallOf(i);
    float zf = (i == 1 || i == 4) ? 7.0 : 1.5;
    vec3 c = vec3(f.x, uLevel + 1.5, zf);
    vec3 oc = c - ro; float tc = dot(oc, rd); if (tc < 0.0 || tc > depth + 6.0) continue;
    vec3 x = ro + rd * tc - c;
    float m = exp(-dot(x.xz, x.xz) / (f.y * f.y * 2.0)) * exp(-max(x.y, 0.0) / 4.0) * smoothstep(-1.5, 0.0, x.y);
    m *= 0.6 + 0.6 * vnoise(vec2(x.x * 0.5 + uTime * 1.5, x.y * 0.4 - uTime * 2.0));
    col += (vec3(0.07, 0.075, 0.085) + vec3(0.5, 0.55, 0.7) * uFlash * 0.2) * m;
  }
  // fires and steam
  for (int i = 0; i < 3; i++) bowlFire(ro, rd, i, depth, col);
  // haze and sheets of rain
  float sheet = rainSheets(rd);
  float fo = 1.0 - exp(-min(depth, 800.0) * (0.004 + 0.01 * uRain * (0.5 + sheet)));
  col = mix(col, vec3(0.05, 0.055, 0.07) + vec3(0.5, 0.55, 0.75) * uFlash * 0.1 + FIRE * uFire.w * 0.01, fo);
  col += boltGlow(ro, rd, depth);
  col += rainStreaks(ro, rd, depth);
  return whiteOut(col);
}

vec3 rainLight(vec3 p) {
  vec3 c = vec3(0.08, 0.085, 0.1) + vec3(0.6, 0.65, 0.85) * uFlash * 0.5;
  for (int i = 0; i < 3; i++) {
    float k = fireK(i); if (k <= 0.0) continue;
    vec3 L = brazierTop(i) + vec3(0.0, 1.2, 0.0) - p; c += FIRE * k * 6.0 / (dot(L, L) + 1.0);
  }
  return c;
}

// ---------- the fountains of the deep ----------
float groundD(vec3 p) {
  return p.y - (fbm(p.xz * 0.03, 3) - 0.5) * 1.5;
}
vec4 fountOf(int i) { return vec4(uFount[i * 4], uFount[i * 4 + 1], uFount[i * 4 + 2], uFount[i * 4 + 3]); }
// height of fountain i now (it bursts up fast, then roars at full height)
float fountH(vec4 f) { float x = uTime - f.z; if (x < 0.0) return 0.0; return f.w * (1.0 - exp(-x * 2.2)) * (0.92 + 0.08 * sin(uTime * 5.0 + f.x)); }
float fountSD(vec3 p, out float which) {
  float d = 1e4; which = -1.0;
  for (int i = 0; i < 6; i++) {
    vec4 f = fountOf(i);
    float h = fountH(f);
    if (h <= 0.0) continue;
    vec3 q = p - vec3(f.x, 0.0, f.y);
    float r = 1.6 + f.w * 0.035;
    float yy = q.y / h;
    float rr = r * (1.25 - 0.35 * yy + 0.9 * yy * yy * yy) * (0.85 + 0.3 * vnoise(vec2(atan(q.z, q.x) * 3.0, q.y * 0.3 - uTime * 10.0)));
    float col = max(length(q.xz) - rr, max(-q.y - 2.0, q.y - h));
    // the burst at the top, falling back
    float top = length((q - vec3(0.0, h, 0.0)) * vec3(1.0, 1.4, 1.0)) - r * 2.2 * (0.8 + 0.4 * vnoise(q * 0.25 + vec3(0.0, -uTime * 3.0, 0.0)));
    float dd = min(col, top) * 0.7;
    if (dd < d) { d = dd; which = float(i); }
  }
  return d;
}

vec3 deepScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  // beneath the flood: dark water, the lit surface overhead
  float wl = uLevel + waterH(ro.xz) * 1.5;
  if (ro.y < wl) {
    // beneath the flood: grey-green murk, the wrinkled bright underside of the surface overhead
    float depthU = wl - ro.y;
    vec3 c = mix(vec3(0.05, 0.06, 0.06), vec3(0.008, 0.01, 0.011), sat(-rd.y * 1.5 + 0.3));
    if (rd.y > 0.0) {
      float ts = depthU / rd.y;
      vec3 sp = ro + rd * ts;
      float rip = fbm(sp.xz * 0.8 + vec2(0.0, -uTime * 2.0), 4);
      float snell = smoothstep(0.55, 0.75, rd.y);      // the window of sky; beyond it, the mirror
      c += vec3(0.16, 0.18, 0.19) * (0.4 + 0.9 * rip) * exp(-ts * 0.12) * (0.3 + 0.7 * snell);
      c += vec3(0.6, 0.65, 0.85) * uFlash * 0.3 * exp(-ts * 0.1);
    }
    // shafts of churned light and silt
    float sh = vnoise(vec2(rd.x * 12.0 + uTime * 0.6, rd.z * 3.0)) * smoothstep(-0.3, 0.6, rd.y);
    c += vec3(0.04, 0.045, 0.045) * sh;
    float sp = 0.0;
    for (int k = 0; k < 8; k++) {
      float dist = 0.4 + float(k) * 0.55;
      vec3 p = ro + rd * dist;
      vec3 cell = floor(p * 5.0); vec3 f = fract(p * 5.0 + vec3(0.0, uTime * 1.5, uTime * 0.7)) - 0.5;
      sp += smoothstep(0.1, 0.0, length(f)) * step(0.8, hash13(cell)) * 0.4 * exp(-dist * 0.4);
    }
    return whiteOut(c + vec3(0.12, 0.13, 0.13) * sp);
  }
  float t = 0.05; float fw; bool hit = false; int id = 0;
  float tw = rd.y < 0.0 ? (uLevel - ro.y) / rd.y : 1e5;
  for (int i = 0; i < 140; i++) {
    vec3 p = ro + rd * t;
    float d = groundD(p) * 0.6;
    if (d < 0.003 * t) { hit = true; id = 0; break; }
    t += d;
    if (t > 900.0 || t > tw) break;
  }
  vec3 sky = stormSky(rd);
  // the far towers of the drowned city on the horizon
  float hz = rd.y - 0.012 - 0.025 * step(0.55, vnoise(vec2(atan(rd.x, rd.z) * 40.0, 1.0))) * step(0.0, rd.z);
  vec3 col; float depth = 2000.0;
  if (hit && t < tw) {
    vec3 p = ro + rd * t; depth = t;
    vec2 e = vec2(0.004 * t + 0.01, 0.0);
    if (id == 0) {
      vec3 n = normalize(vec3(groundD(p + e.xyy) - groundD(p - e.xyy), groundD(p + e.yxy) - groundD(p - e.yxy), groundD(p + e.yyx) - groundD(p - e.yyx)));
      // cracked dry mud: irregular curling plates of many sizes, and the great fissures the deep
      // breaks through, dark with welling water
      vec2 wp = p.xz + (vec2(fbm(p.xz * 0.25, 3), fbm(p.xz * 0.25 + 7.0, 3)) - 0.5) * 3.0;
      vec2 vo = voronoiEdge(wp * 0.42);
      vec2 vs = voronoiEdge(wp * 1.3 + 3.0);
      vec2 big = voronoiEdge(wp * 0.05);
      float near = smoothstep(45.0, 4.0, t);
      float cw = 0.025 + 0.05 * vnoise(wp * 0.7);
      float fine = smoothstep(cw, 0.0, vo.x) * near + smoothstep(0.03, 0.0, vs.x) * near * 0.5 * step(0.5, vnoise(wp * 0.4));
      float fiss = smoothstep(0.035, 0.0, big.x);
      vec3 alb = vec3(0.24, 0.21, 0.17) * (0.7 + 0.4 * vo.y) * (0.75 + 0.5 * fbm(p.xz * 1.5, 3));
      alb *= (1.0 - 0.7 * sat(fine)) * (1.0 - 0.95 * fiss);
      // plates curl up at their edges
      n = normalize(n + vec3(hash12(vec2(vo.y, 1.0)) - 0.5, 0.0, hash12(vec2(vo.y, 2.0)) - 0.5) * 0.25 * near * smoothstep(0.0, 0.25, vo.x));
      col = cityLight(p, n, -rd, alb, 0.8);
      // water welling up out of the fissures, boiling white where it bursts
      float wl = fiss * smoothstep(uLevel - 2.5, uLevel, p.y);
      float boil = smoothstep(0.6, 0.85, vnoise(p.xz * 0.8 + vec2(0.0, uTime * 4.0))) * fiss;
      col = mix(col, vec3(0.012, 0.014, 0.015) + vec3(0.25, 0.26, 0.28) * boil, wl * 0.9);
    } else {
      float w;
      vec3 n = normalize(vec3(fountSD(p + e.xyy, w) - fountSD(p - e.xyy, w), fountSD(p + e.yxy, w) - fountSD(p - e.yxy, w), fountSD(p + e.yyx, w) - fountSD(p - e.yyx, w)));
      float streak = vnoise(vec2(atan(n.z, n.x) * 8.0, p.y * 0.4 - uTime * 14.0)) * 0.6 + vnoise(vec2(atan(n.z, n.x) * 20.0, p.y * 1.2 - uTime * 20.0)) * 0.4;
      vec3 alb = vec3(0.75, 0.78, 0.8) * (0.55 + 0.6 * streak);
      col = cityLight(p, n, -rd, alb, 0.4) * 1.6 + vec3(0.09, 0.095, 0.11) * (0.4 + streak) + vec3(0.12, 0.13, 0.15) * pow(1.0 - sat(dot(n, -rd)), 2.0);
      col += vec3(0.6, 0.65, 0.85) * uFlash * 0.25 * streak;
    }
  } else if (tw < 1e4) {
    vec3 p = ro + rd * tw; depth = tw;
    vec3 n = waterN(p, tw);
    n = normalize(n + (vec3(vnoise(p.xz * 0.2 + uTime * 0.5), 0.0, vnoise(p.xz * 0.2 - uTime * 0.4)) - 0.5) * 0.4);
    vec3 r = reflect(rd, n); r.y = abs(r.y);
    float fr = 0.03 + 0.97 * pow(1.0 - sat(dot(n, -rd)), 5.0);
    col = mix(vec3(0.02, 0.024, 0.026), stormSkyLo(r), fr);
    // turbulence and foam boiling round each fountain's foot
    for (int i = 0; i < 6; i++) {
      vec4 f = fountOf(i); float h = fountH(f); if (h <= 0.0) continue;
      float dd = length(p.xz - f.xy);
      float fo = exp(-max(dd - 3.0, 0.0) / (6.0 + h * 0.15)) * (0.5 + 0.6 * vnoise(p.xz * 0.6 + uTime * 2.0));
      col = mix(col, vec3(0.3, 0.32, 0.34) + vec3(0.5) * uFlash * 0.3, sat(fo) * 0.75);
    }
    col = mix(col, vec3(0.22, 0.23, 0.25), foamAt(p.xz * 0.5) * 0.2);
  } else {
    col = hz < 0.0 && rd.y > -0.05 ? vec3(0.02, 0.02, 0.025) + vec3(0.25, 0.08, 0.03) * 0.15 * smoothstep(-0.02, 0.0, rd.y) : sky;
  }
  float sheet = rainSheets(rd);
  float fo = 1.0 - exp(-min(depth, 900.0) * (0.002 + 0.006 * uRain * (0.5 + sheet)));
  col = mix(col, vec3(0.05, 0.055, 0.07) + vec3(0.5, 0.55, 0.75) * uFlash * 0.12, fo);
  // the fountains of the deep: a roaring column of white aerated water driven up out of the ground,
  // jets tearing off its edges into droplets, at the top a burst that spreads and falls back as
  // curtains on every side, mist boiling round it all; drawn back to front on a plane through each
  // column's axis facing the camera
  for (int j = 5; j >= 0; j--) {
    int i = j;
    vec4 f = fountOf(i); float h = fountH(f); if (h <= 0.0) continue;
    vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
    float tc = dot(f.xy - ro.xz, dxz) / max(dd, 1e-6);
    if (tc < 0.0 || tc > depth + 30.0) continue;
    vec3 q = ro + rd * tc;
    float r0 = 1.4 + f.w * 0.03;
    vec2 side = normalize(vec2(-rd.z, rd.x));
    float hx = dot(q.xz - f.xy, side);
    float y = q.y - min(uLevel, 0.0);
    float yy = sat(y / h);
    float age = uTime - f.z;
    float px = tc * 0.0011;
    float sd = f.x * 0.37;
    // the column: narrows a little as it climbs, then flowers at the top
    float R = r0 * (1.1 - 0.25 * yy + 1.2 * pow(yy, 5.0));
    float wob = (fbm(vec2(y * 0.08 - uTime * 2.5, sd), 3) - 0.5) * R * 0.8;
    float ux = (hx - wob) / R;
    float upS = vnoise(vec2(ux * 5.0 + sd, y * 0.18 - uTime * 14.0)) * 0.5 + vnoise(vec2(ux * 13.0, y * 0.5 - uTime * 22.0)) * 0.3 + vnoise(vec2(ux * 31.0, y * 1.4 - uTime * 30.0)) * 0.2;
    float ragE = (fbm(vec2(y * 0.25 - uTime * 9.0, sd + ux), 3) - 0.5) * 0.9;
    float core = smoothstep(1.0 + ragE, 0.6 + ragE * 0.5, abs(ux)) * smoothstep(-0.5, 1.0, y) * smoothstep(h * 1.02, h * 0.82, y);
    // jets torn off its sides, breaking into drops as they fly
    float jets = smoothstep(0.62, 0.85, vnoise(vec2(ux * 2.2 + sd, y * 0.12 - uTime * 10.0))) * smoothstep(2.6, 1.0, abs(ux)) * smoothstep(0.9, 1.1, abs(ux)) * smoothstep(0.0, 0.3, yy) * smoothstep(1.0, 0.7, yy);
    // the falling curtains: from the top they arc out and drop back on each side
    float drop = sat((h * 1.02 - y) / (h * 0.9));
    float spread = R * 1.6 + h * 0.18;
    float rc = r0 + spread * sqrt(drop) * smoothstep(0.0, 1.2, age);
    float cw = 0.6 + 2.2 * drop + r0 * 0.4;
    float downS = vnoise(vec2(hx * 1.6 + sd, y * 0.22 + uTime * 9.0)) * 0.6 + vnoise(vec2(hx * 4.5, y * 0.6 + uTime * 14.0)) * 0.4;
    float curtain = smoothstep(cw, cw * 0.2, abs(abs(hx) - rc)) * smoothstep(-0.3, 0.6, downS - 0.15) * step(y, h * 1.05) * smoothstep(0.0, 0.25, yy) * smoothstep(0.0, 0.8, age);
    // the crown of the burst
    vec2 cq = vec2(hx / (spread + R), (y - h) / (h * 0.12 + 3.0));
    float crown = exp(-dot(cq, cq) * 2.0) * (0.45 + 0.7 * fbm(vec2(hx * 0.25 + uTime * 0.8, y * 0.3 - uTime * 2.0) + sd, 4));
    // mist boiling up round the foot and drifting off the whole column
    float mist = exp(-hx * hx / (pow(R * 2.5 + 6.0 + 0.15 * y, 2.0))) * exp(-max(y - h * 0.6, 0.0) / (h * 0.5 + 6.0)) * (0.25 + 0.5 * fbm(vec2(hx * 0.15 - uTime * 0.7, y * 0.12 - uTime * 0.9) + sd, 4)) * smoothstep(-1.0, 2.0, y) * 0.55;
    // droplets: thrown out in arcs, each a bright point catching the storm light
    float drops = 0.0;
    {
      vec2 g = vec2(hx, y + uTime * 7.0) / vec2(0.9, 1.4);
      vec2 cell = floor(g); vec2 fr = fract(g) - 0.5 - (hash22(cell + sd) - 0.5) * 0.7;
      float on = step(0.78, hash12(cell * 1.7 + sd)) * (0.4 + 0.6 * hash12(cell + 3.0));
      float env = smoothstep(rc + cw * 2.0, rc, abs(hx)) * smoothstep(R * 0.8, R * 1.4, abs(hx)) * step(y, h * 1.1);
      float sz = max(0.06, px * 1.2) / 0.9;
      drops = on * env * smoothstep(sz, sz * 0.3, length(fr * vec2(1.0, 0.18)));
    }
    float a = sat(core * (0.75 + 0.35 * upS) + jets * 0.6 + curtain * 0.7 + crown * 0.8 + mist + drops * 0.5);
    // nothing of it below the flood's surface; a collar of churned foam where it breaks through
    a *= smoothstep(uLevel - 0.2, uLevel + 0.6, q.y);
    float collar = exp(-pow((q.y - uLevel - 0.6) / 1.2, 2.0)) * smoothstep(R * 3.0 + 4.0, R, abs(hx)) * 0.8;
    a = max(a, collar * (0.5 + 0.5 * vnoise(vec2(hx * 1.5 + uTime * 3.0, sd))));
    if (a <= 0.002) continue;
    // aerated water is white; the core's edge in shadow, its face catching the cloud-light and flash
    float lit = 0.55 + 0.45 * (1.0 - abs(ux) * 0.5) * core + 0.3 * crown;
    vec3 wc = vec3(0.30, 0.31, 0.33) * (0.5 + 0.6 * max(max(upS * core, downS * curtain), 0.5 * crown + 0.4 * mist)) * lit;
    wc += vec3(0.65, 0.7, 0.9) * uFlash * (0.35 + 0.45 * upS) * 0.9;
    wc += vec3(0.18) * drops;
    float ff = 1.0 - exp(-tc * (0.002 + 0.006 * uRain));
    wc = mix(wc, vec3(0.05, 0.055, 0.07) + vec3(0.5, 0.55, 0.75) * uFlash * 0.12, ff * 0.6);
    col = mix(col, wc, a);
  }
  col += boltGlow(ro, rd, depth);
  col += rainStreaks(ro, rd, depth);
  return whiteOut(col);
}
`;
