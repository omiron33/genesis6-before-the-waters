// The cumulonimbus over the plain at night (s13): a vast storm tower with a spreading anvil, seen from
// some 25 km away across the dark plain, lit from within by slow silent lightning; the tiny lights of
// the world's fires scattered over the land beneath it. World units are kilometres, ground at y = 0.
import { STORM_COMMON } from './x-storm.js';

// the slow swells of light inside the cloud: [song time of peak, rise s, fall s, strength, source]
export const SWELLS_S13 = [
  [67.2, 0.6, 1.4, 0.7, 2], [68.5, 0.7, 1.5, 1.0, 0], [70.0, 0.5, 1.3, 0.8, 1], [71.75, 0.9, 1.8, 1.5, 3],
  [72.95, 0.6, 1.3, 0.8, 2], [73.9, 0.6, 1.4, 1.0, 0], [75.0, 0.6, 1.4, 0.8, 1],
];

export const CLOUD_GLSL = STORM_COMMON + /* glsl */ `
uniform float uSw[28];      // 7 swells x (peak, rise, fall, strength)
uniform float uSwSrc[7];
uniform float uPush;        // 0..1 over the scene, for the slow growth of the tower

const vec3 CC = vec3(-2.5, 0.0, 17.0);     // the storm's foot
// lightning sources inside the tower (relative to CC)
vec3 srcPos(int k) {
  if (k == 0) return vec3(-0.6, 4.5, 0.4);
  if (k == 1) return vec3(-2.2, 9.4, -0.4);
  if (k == 2) return vec3(3.8, 3.0, -0.8);
  return vec3(0.3, 5.8, 0.2);
}
float swell(int i) {
  float pk = uSw[i * 4], ri = uSw[i * 4 + 1], fa = uSw[i * 4 + 2], st = uSw[i * 4 + 3];
  float x = uTime - pk;
  float e = x < 0.0 ? exp(-x * x / (ri * ri)) : exp(-x / fa) * (1.0 - smoothstep(fa * 2.5, fa * 4.0, x));
  // a soft inner flicker, never a hard flash
  float fl = 0.72 + 0.28 * vnoise(vec2(uTime * 11.0, float(i) * 7.3)) + 0.12 * sin(uTime * 23.0 + float(i));
  return st * e * fl;
}
vec4 srcI;   // intensity per source this frame
void computeSources() {
  srcI = vec4(0.0);
  for (int i = 0; i < 7; i++) {
    float s = swell(i);
    int k = int(uSwSrc[i]);
    if (k == 0) srcI.x += s; else if (k == 1) srcI.y += s; else if (k == 2) srcI.z += s; else srcI.w += s;
  }
}

// the shape of the storm: a signed distance (km), negative inside. A supercell: a broad, flat,
// dark base wider than the column; the main updraft tower; a line of smaller towers stepping up to
// it on the right (the feeder clouds); a wide flat anvil sheared far off to the left under the
// tropopause, with mammatus pouches hanging from its underside; an overshooting dome on top.
float stormShape(vec3 q) {
  // the base: wide and flat-bottomed
  float ang = atan(q.z, q.x - 1.5);
  float rag = 1.0 + 0.35 * (vnoise(vec2(ang * 3.0, 1.0)) - 0.5) + 0.2 * (vnoise(vec2(ang * 9.0, 4.0)) - 0.5);
  float base = max(sdEllipsoid(q - vec3(1.5, 2.2, 0.0), vec3(9.5 * rag, 0.8 + 0.5 * smoothstep(9.0, 2.0, length(q.xz - vec2(1.5, 0.0))), 5.5 * rag)), 1.75 - q.y);
  // the base lowers into a wall cloud and a heavy rain core under the updraft
  float core = max(sdEllipsoid(q - vec3(0.5, 1.0, 0.0), vec3(6.5, 3.0, 4.0)), q.y - 2.2);
  // the main updraft, leaning a little downwind (-x) as it rises, swelling into the anvil
  vec3 tq = q + vec3(0.18 * max(q.y - 2.0, 0.0), 0.0, 0.0);
  float R = 3.1 + 0.35 * sin(tq.y * 1.4 + 1.0) - 0.3 * smoothstep(3.0, 7.0, tq.y) + 0.6 * smoothstep(8.5, 10.4, tq.y);
  float tower = max(length(tq.xz) - R, max(1.8 - q.y, q.y - (10.6 + 0.3 * uPush)));
  // feeder towers stepping up on the right
  float f1 = sdEllipsoid(q - vec3(3.6, 4.6, 0.4), vec3(1.5, 2.6, 1.5));
  float f2 = sdEllipsoid(q - vec3(5.6, 3.8, -0.6), vec3(1.2, 1.9, 1.2));
  float f3 = sdEllipsoid(q - vec3(7.3, 3.1, 0.3), vec3(0.9, 1.3, 0.9));
  float f4 = sdEllipsoid(q - vec3(2.2, 6.6, -1.0), vec3(1.3, 2.0, 1.3));
  float f5 = sdEllipsoid(q - vec3(-1.8, 5.6, 1.2), vec3(1.4, 2.4, 1.4));
  // the anvil: wide, thin, flat on top, sheared far to the left, thinning to its far edge
  vec3 aq = q - vec3(-6.5, 10.35 + 0.2 * uPush, 0.2);
  float thick = 0.95 * smoothstep(-11.0, 2.0, aq.x) + 0.25;
  float anvil = max(sdEllipsoid(aq, vec3(12.0, 2.0, 6.0)), max(aq.y - 0.45, -thick - aq.y));
  // only downwind: none of it overhangs the upwind side
  anvil = max(anvil, aq.x - 7.6 - 0.3 * aq.y);
  // mammatus: rounded pouches hanging under the anvil
  vec2 mc = aq.xz * 1.6;
  vec2 cell = floor(mc), fcl = fract(mc) - 0.5 - (hash22(cell) - 0.5) * 0.4;
  float pouch = length(vec3(fcl.x, (aq.y + thick + 0.12) * 2.2, fcl.y)) - 0.36;
  pouch = max(pouch / 2.2, max(sdEllipsoid(aq, vec3(9.0, 2.5, 5.0)), aq.x - 4.0));
  anvil = min(anvil, pouch);
  float dome = sdEllipsoid(q - vec3(-0.6, 10.9 + 0.35 * uPush, 0.0), vec3(1.6, 1.0, 1.6));
  float d = smin(tower, anvil, 1.2);
  d = smin(d, base, 1.0);
  d = min(d, core + 0.6);
  d = smin(d, f1, 0.7); d = smin(d, f2, 0.6); d = smin(d, f3, 0.5); d = smin(d, f4, 0.7); d = smin(d, f5, 0.7);
  d = smin(d, dome, 0.7);
  return d;
}
float density(vec3 p, int oct) {
  vec3 q = p - CC;
  float d = stormShape(q);
  if (d > 1.0) return 0.0;
  float core = max(sdEllipsoid(q - vec3(0.5, 1.0, 0.0), vec3(6.5, 3.0, 4.0)), q.y - 2.2);
  float an = smoothstep(9.0, 9.9, q.y);
  // cauliflower: rounded billows at several scales (folded noise makes the crisp lobes), boiling up
  vec3 nq = q * 1.05 + vec3(0.0, -(uTime - 60.0) * 0.03, 0.0);
  float b1 = 1.0 - pow(vnoise(nq) * 2.0 - 1.0, 2.0);
  float b2 = oct > 2 ? 1.0 - pow(vnoise(nq * 2.3 + 3.1) * 2.0 - 1.0, 2.0) : 0.5;
  float b3 = oct > 3 ? 1.0 - pow(vnoise(nq * 5.1 + 7.7) * 2.0 - 1.0, 2.0) : 0.5;
  float bill = 0.55 * b1 + 0.3 * b2 + 0.15 * b3 - 0.12;
  // in the anvil the cloud is drawn out into flat fibres
  float fib = oct > 2 ? cloudFbm(q * vec3(0.25, 2.2, 0.5) + vec3(uTime * 0.01, 0.0, 0.0), 3) : 0.5;
  d -= mix((bill - 0.55) * 1.4, (fib - 0.5) * 0.9, an);
  float dens = sat(-d * 3.0);
  // a flat base with ragged scud hanging under its edge
  float below = 1.0 - smoothstep(1.7, 1.8, q.y + 0.25 * (b2 - 0.5) * smoothstep(3.0, 6.0, length(q.xz)));
  // under the base only the rain core remains: thin, grey, streaked to the ground
  float shafts = smoothstep(0.35, 0.75, fbm(vec2(q.x * 0.55 + q.y * 0.12, q.z * 0.5), 3));
  float rainc = sat(-(core + 1.5 * (0.5 - shafts) + 1.2 * (vnoise(q.xz * 0.9 + 3.0) - 0.5)) * 0.8) * (0.4 + 0.4 * vnoise(vec3(q.x * 5.0, q.y * 0.5 - uTime * 0.4, q.z * 5.0)));
  return mix(dens, rainc * 0.5, below) * mix(1.0, 0.55, an);
}

const vec3 MOON = normalize(vec3(0.35, 0.8, 0.5));
vec3 nightSky(vec3 rd) {
  float y = rd.y;
  vec3 zen = vec3(0.0018, 0.0019, 0.0032);
  vec3 hor = vec3(0.02, 0.018, 0.026);
  vec3 c = mix(hor, zen, pow(sat(y * 3.5), 0.6));
  // the last bruised violet low in the west (left), under the cloud deck
  float west = sat(rd.x * 0.8 + 0.3);
  c += vec3(0.03, 0.018, 0.036) * exp(-max(y, 0.0) * 12.0) * west;
  // a ragged high deck of cloud over the top of the frame, barely lit
  vec2 cp = rd.xz / max(rd.y, 0.04);
  float deck = smoothstep(0.42, 0.75, fbm(cp * 0.9 + vec2(uTime * 0.01, 0.0), 5));
  c = mix(c, vec3(0.006, 0.006, 0.01), deck * smoothstep(0.12, 0.45, y));
  // the hidden moon's glow in the thin cloud behind the storm
  float mu = sat(dot(rd, MOON));
  c += vec3(0.012, 0.014, 0.02) * pow(mu, 4.0) * smoothstep(-0.02, 0.1, y);
  // a few stars in the gaps
  vec2 sp = vec2(atan(rd.x, rd.z), rd.y) * 380.0;
  vec2 cell = floor(sp); vec2 f = fract(sp) - hash22(cell) * 0.8 - 0.1;
  float st = step(0.985, hash12(cell)) * exp(-dot(f, f) * 160.0) * (0.6 + 0.4 * sin(uTime * 3.0 + hash12(cell) * 40.0));
  c += vec3(0.5, 0.55, 0.7) * st * 0.05 * (1.0 - deck) * smoothstep(0.05, 0.2, y);
  return c;
}

// far low hills along the horizon, beyond the storm
float hillElev(vec3 rd) {
  float az = atan(rd.x, rd.z);
  return 0.0035 + 0.006 * fbm(vec2(az * 7.0, 1.3), 4) + 0.004 * smoothstep(0.1, 0.6, az);
}

// the fires of the world: tiny warm points on the plain
vec3 worldLights(vec3 ro, vec3 rd, float tg) {
  vec3 acc = vec3(0);
  float pxAng = radians(uFov) / uRes.y;
  for (int i = 0; i < 140; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 1.37, fi * 0.71 + 3.0));
    // clustered in loose settlements
    float cl = floor(fi / 7.0);
    vec2 cc = (hash22(vec2(cl * 4.1, 9.0 + cl)) - 0.5) * vec2(36.0, 1.0);
    float cz = 0.9 + 26.0 * pow(hash11(cl * 3.3 + 1.0), 1.4);
    vec3 lp = vec3(cc.x * (0.25 + cz / 30.0) + (h.x - 0.5) * 0.5, 0.004, cz + (h.y - 0.5) * 2.5);
    vec3 dir = lp - ro; float dist = length(dir); dir /= dist;
    if (dist > tg + 0.05) continue;
    float a = acos(clamp(dot(rd, dir), -1.0, 1.0)) / pxAng;
    float fl = 0.75 + 0.25 * vnoise(vec2(uTime * 6.0, fi));
    float k = (0.6 + 0.8 * hash11(fi * 9.1)) * fl * 9.0 / (1.0 + dist * 0.15);
    float sz = 1.0 + 3.0 / (0.5 + dist);   // near fires are larger
    acc += mix(vec3(1.0, 0.36, 0.1), vec3(1.0, 0.6, 0.25), hash11(fi * 2.2)) * k * (exp(-a * a * 0.5 / (sz * sz)) * 0.06 + 0.006 * exp(-a * 0.2 / sz));
  }
  return acc;
}

vec3 stormScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  computeSources();
  // ground plane
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e5;
  vec3 col;
  if (rd.y < hillElev(rd) && tg > 1e4) tg = 60.0;
  if (tg < 1e4) {
    vec3 p = ro + rd * tg;
    // the dark plain under the storm: fields and scrub in the light the storm throws down, and a
    // river winding toward it that mirrors the lit cloud
    float Isum = srcI.x + srcI.y + srcI.z + srcI.w + 0.25;
    vec3 lit = vec3(0.02, 0.021, 0.028) + vec3(0.5, 0.55, 0.75) * Isum * 0.03 * smoothstep(-2.0, 10.0, p.z);
    float fields = fbm(p.xz * vec2(2.5, 1.2), 4);
    float scrub = smoothstep(0.55, 0.75, fbm(p.xz * 14.0, 3));
    vec3 alb = mix(vec3(0.5, 0.45, 0.38), vec3(0.32, 0.3, 0.24), fields) * (1.0 - 0.6 * scrub);
    col = lit * alb;
    // the river
    float mx = -0.15 * p.z + 0.5 * sin(p.z * 0.45 + 1.0) + 0.25 * sin(p.z * 1.3) - 0.2;
    float w = 0.035 + 0.01 * sin(p.z * 2.0);
    float riv = smoothstep(w, w * 0.6, abs(p.x - mx)) * smoothstep(0.0, 1.0, p.z);
    vec3 refl = vec3(0.012, 0.013, 0.02) + vec3(0.55, 0.6, 0.85) * Isum * 0.03;
    float ripple = 0.75 + 0.25 * vnoise(vec2(p.x * 40.0, p.z * 6.0 - uTime * 0.5));
    // fade to the horizon haze
    col = mix(col, vec3(0.012, 0.011, 0.018), 1.0 - exp(-tg * 0.03));
    // the smoke of the world lying low over the land, faintly red from its fires
    col += vec3(0.012, 0.004, 0.002) * exp(-abs(rd.y) * 60.0) * 0.6;
  } else {
    col = nightSky(rd);
    col += vec3(0.012, 0.004, 0.002) * exp(-abs(rd.y) * 60.0) * 0.6;
  }
  // the storm: march its bounding box
  vec3 bmin = CC + vec3(-19.0, 0.0, -7.0), bmax = CC + vec3(13.0, 12.5, 7.0);
  vec3 inv = 1.0 / rd;
  vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
  vec3 tn = min(t0, t1), tf = max(t0, t1);
  float ta = max(max(tn.x, tn.y), tn.z), tb = min(min(tf.x, tf.y), tf.z);
  tb = min(tb, tg);
  vec3 scat = vec3(0); float T = 1.0;
  if (tb > ta && tb > 0.0) {
    ta = max(ta, 0.0);
    float jit = hash12(fc + uJitter * 37.0 + fract(uTime) * 91.0);
    vec3 L = MOON;
    // the strongest source this frame casts the billows' shadows
    int ks = 0; float im = srcI.x;
    if (srcI.y > im) { ks = 1; im = srcI.y; } if (srcI.z > im) { ks = 2; im = srcI.z; } if (srcI.w > im) { ks = 3; im = srcI.w; }
    vec4 I = srcI + vec4(0.07, 0.02, 0.05, 0.06);   // the storm never goes fully dark inside
    float tt = ta + jit * 0.15;
    for (int i = 0; i < 140; i++) {
      if (tt > tb) break;
      vec3 p = ro + rd * tt;
      vec3 q = p - CC;
      float sd = stormShape(q);
      if (sd > 1.2) { tt += max(sd - 1.0, 0.15); continue; }
      float den = density(p, 5);
      float dt = 0.08 + tt * 0.0025;
      if (den > 0.002) {
        float sig = den * 7.0;
        // the hidden moon behind: a silver lining on the edges
        float Tm = exp(-density(p + L * 0.45, 2) * 3.5);
        float ph = 0.6 + 2.0 * pow(sat(dot(rd, L)), 5.0);
        vec3 S = vec3(0.03, 0.031, 0.038) * (0.2 + 0.8 * Tm) * ph;
        // the lightning within, diffusing out through the cloud, the billows shading one another
        vec3 toS = normalize(srcPos(ks) - q);
        float sh = exp(-density(p + toS * 0.5, 2) * 2.5);
        vec3 lt = vec3(0);
        for (int k = 0; k < 4; k++) {
          float d = length(q - srcPos(k));
          lt += vec3(0.78, 0.8, 1.0) * I[k] * exp(-d * 0.45) / (0.4 + d * d * 0.06);
        }
        S += lt * (0.35 + 0.65 * sh) * 0.6;
        // ambient: dim sky from above, a breath of fire-glow from the land on the base
        S += vec3(0.0035, 0.004, 0.0065) * (0.5 + 0.5 * Tm) + vec3(0.004, 0.0044, 0.007) * (0.3 + 0.7 * sat((q.y - 1.5) / 8.0));
        S += vec3(0.01, 0.0035, 0.0012) * exp(-max(q.y - 1.8, 0.0) * 1.4) * 0.35;
        S += vec3(0.0035, 0.0036, 0.0045) * exp(-max(q.y - 1.8, 0.0) * 1.2);
        // the dark base catches the flashes from within it and from the ground beneath
        S += vec3(0.5, 0.55, 0.75) * (I.z + 0.4 * I.x) * 0.05 * exp(-max(q.y - 1.8, 0.0) * 0.9);
        // the anvil's underside catches the light of the tower beneath it
        S += vec3(0.7, 0.74, 0.9) * (I.x + I.w + 0.5 * I.y) * 0.012 * smoothstep(8.0, 9.5, q.y);
        float a = exp(-sig * dt);
        scat += T * S * (1.0 - a);
        T *= a;
        if (T < 0.01) break;
      }
      tt += dt;
    }
  }
  col = col * T + scat;
  // a veil of rain under the storm's base
  {
    float tr = (CC.z - 0.5 - ro.z) / rd.z;
    if (tr > 0.0 && tr < tg + 0.01) {
      vec3 p = ro + rd * tr;
      float rx = p.x - CC.x + 0.3 * p.y;
      float ex = min(abs(rx + 0.8), min(abs(rx - 2.4) + 0.4, abs(rx + 3.6) + 0.7)) + 0.6 * (vnoise(vec2(p.y * 2.0, 3.0 + rx)) - 0.5);
      float sh = smoothstep(1.6, 0.3, ex) * smoothstep(1.95, 1.3, p.y + 0.3 * vnoise(vec2(p.x * 1.5, 7.0))) * smoothstep(-0.02, 0.1, p.y);
      float streak = 0.35 + 0.65 * fbm(vec2(p.x * 5.0 + p.y * 1.2, p.y * 0.5 + uTime * 0.08), 4);
      float I = srcI.x + srcI.z + 0.3 * (srcI.y + srcI.w);
      col = mix(col, vec3(0.006, 0.0065, 0.009) + vec3(0.6, 0.65, 0.9) * I * 0.012, sh * streak * 0.8);
    }
  }
  col += worldLights(ro, rd0, tg);
  return col;
}
`;
