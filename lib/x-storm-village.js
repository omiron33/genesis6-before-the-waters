// The empty village in the wind (s14): a lane of mud-brick houses at night, doors standing open on
// dark rooms, no one there. A hard wind drives dust and ash down the lane toward the camera in
// sheets, backlit by a cold moon breaking through the storm wrack; the footprints in the lane fill
// and vanish under it; a cold hearth of blackened stones lies in the foreground. Metres; ground y = 0;
// the lane runs along +z away from the camera; the wind blows toward -z.
import { STORM_COMMON } from './x-storm.js';

export const VILLAGE_UNIFORMS = { uFocus: 8, uAper: 0.0, uGust: 0, uErase: 0, uVeil: 0 };

export const VILLAGE_GLSL = STORM_COMMON + /* glsl */ `
uniform float uGust;    // wind strength 0..1.5
uniform float uErase;   // how far down the lane the footprints are gone (z, metres)
uniform float uVeil;    // the closing dust sheet 0..1

const vec3 MOONV = normalize(vec3(0.6, 0.62, 0.75));   // low over the roofs on the left, ahead
const vec3 WIND = vec3(0.25, 0.0, -1.0);

// ---- the houses: one each side per 9 m of lane
const float CELL = 9.0;
float houseSD(vec3 p, out float hid, out vec3 lq) {
  float side = p.x > 0.0 ? 1.0 : -1.0;
  hid = 0.0; lq = vec3(0);
  // down the middle of the lane the houses are at least this far away
  float gap = 3.45 - abs(p.x);
  if (gap > 0.6) return gap - 0.15;
  float cz = floor(p.z / CELL);
  float d = 1e9; hid = 0.0; lq = vec3(0);
  for (int k = -1; k <= 1; k++) {
    float c = cz + float(k);
    float h = hash12(vec2(c, side));
    if (c < 0.0) continue;
    vec3 sz = vec3(2.0 + 0.8 * hash11(h * 3.0), 1.4 + 0.6 * hash11(h * 5.0), 3.0 + 0.8 * hash11(h * 7.0));
    vec3 ctr = vec3(side * (3.6 + sz.x + 0.8 * hash11(h * 9.0)), sz.y, c * CELL + CELL * 0.5 + (hash11(h * 11.0) - 0.5) * 2.0);
    vec3 q = p - ctr;
    // walls lean in a little toward the top and the corners are worn round
    float taper = 1.0 - 0.025 * (q.y + sz.y) / (2.0 * sz.y);
    vec3 qq = vec3(q.x / taper, q.y, q.z / taper);
    float b = sdBox(qq, sz - 0.12) - 0.12;
    // a low parapet on the flat roof: hollow the top
    b = max(b, -sdBox(q - vec3(0.0, sz.y + 0.05, 0.0), vec3(sz.x - 0.22, 0.2, sz.z - 0.22)));
    // the door: on the lane side, open on a dark room
    vec3 dq = q - vec3(-side * sz.x, -sz.y + 0.95, (hash11(h * 13.0) - 0.5) * sz.z);
    float door = sdBox(dq, vec3(0.5, 0.95, 0.48));
    b = max(b, -door);
    // a small window high up
    vec3 wq = q - vec3(-side * sz.x, sz.y * 0.4, (hash11(h * 17.0) > 0.5 ? 1.0 : -1.0) * sz.z * 0.55);
    b = max(b, -sdBox(wq, vec3(0.4, 0.22, 0.22)));
    // ruin: a corner of the roof and wall fallen in on most houses
    float fall = hash11(h * 19.0);
    if (fall > 0.25) {
      vec3 cq = q - vec3(-side * sz.x * (0.2 + 0.6 * hash11(h * 23.0)), sz.y + 0.2, (hash11(h * 29.0) > 0.5 ? 1.0 : -1.0) * sz.z * 0.75);
      b = max(b, -(length(cq * vec3(1.0, 0.8, 1.0)) - (0.7 + 0.9 * fall) + 0.25 * vnoise(cq * 3.0)));
    }
    // roof beams poking through the wall: some gone, some broken and sagging
    vec3 bq = q - vec3(-side * sz.x, sz.y - 0.22, 0.0);
    float bi = floor((bq.z + 0.3) / 0.6);
    bq.z = mod(bq.z + 0.3, 0.6) - 0.3;
    float bh = hash12(vec2(bi, h * 7.0));
    bq.xy = rot((bh - 0.5) * 0.5 * step(0.6, bh)) * bq.xy;
    float blen = 0.2 - 0.12 * step(0.75, bh);
    float beam = max(sdBox(bq, vec3(blen, 0.045, 0.05)) - 0.01 + 0.012 * vnoise(bq * 30.0), abs(q.z) - sz.z + 0.3);
    if (bh > 0.25) b = min(b, beam);
    if (b < d) { d = b; hid = h; lq = q; }
  }
  // weathered, slumping mud walls: worn hardest at the top and the corners
  if (d < 0.35) {
    float wear = 0.03 + 0.09 * smoothstep(0.3, 2.4, lq.y);
    d += wear * (fbm(p * 1.7, 3) - 0.45) + 0.01 * (vnoise(p * 9.0) - 0.5);
  }
  return d;
}
float groundH(vec2 xz) {
  // a beaten lane between low banks, rutted and drifted
  float lane = smoothstep(2.2, 3.6, abs(xz.x));
  float h = 0.12 * lane + 0.04 * fbm(xz * 0.6, 2) + 0.012 * fbm(xz * 4.0, 2);
  // rubble fallen from the walls, heaped along their feet: lumps and broken bricks
  float wall = smoothstep(2.6, 3.7, abs(xz.x));
  vec2 ce = vec2(vnoise(xz * 4.0), vnoise(xz * 9.0 + 5.0));
  h += wall * (0.22 * pow(vnoise(xz * vec2(1.2, 0.6) + 3.0), 2.0) + 0.06 * pow(ce.x, 3.0) + 0.03 * ce.y) * smoothstep(5.2, 3.8, abs(xz.x));
  // wind ripples in the dust
  h += 0.01 * sin(dot(xz, vec2(0.6, 7.5)) + 3.0 * vnoise(xz * 0.8)) * (0.5 + 0.5 * vnoise(xz * 0.5));
  return h;
}
// the footprints: two lines walking up the lane, filling with dust from the near end
float prints(vec2 xz) {
  float s = 0.0;
  for (int line = 0; line < 2; line++) {
    float x0 = line == 0 ? -0.5 : 0.7;
    float z = xz.y - (line == 0 ? 0.0 : 0.37);
    float k = floor(z / 0.74);
    float zl = z - k * 0.74 - 0.37;
    float lr = mod(k, 2.0) * 2.0 - 1.0;
    vec2 q = vec2(xz.x - x0 - lr * 0.13 - 0.05 * sin(k * 0.7 + float(line)), zl);
    float foot = sdEllipsoid(vec3(q.x, 0.0, q.y), vec3(0.055, 1.0, 0.13));
    float heel = length(q - vec2(0.0, -0.08)) - 0.045;
    float f = min(foot, heel);
    // filled in by the wind from the near end (lower z) first
    float gone = smoothstep(uErase + 1.5, uErase - 0.5, xz.y);
    s += smoothstep(0.01, -0.01, f) * (1.0 - gone) * step(1.0, xz.y);
  }
  return s;
}
// the cold hearth: a ring of blackened stones with ash and charred sticks
const vec3 HEARTH = vec3(-1.15, 0.0, 6.2);
float hearthSD(vec3 p, out float sid) {
  vec3 q = p - HEARTH;
  float d = 1e9; sid = 0.0;
  float bound = length(q) - 0.75;
  if (bound > 0.1) return bound;
  for (int i = 0; i < 9; i++) {
    float a = float(i) / 9.0 * 6.2831 + 0.3 * hash11(float(i));
    vec3 c = vec3(cos(a) * 0.45, 0.06, sin(a) * 0.38);
    vec3 r = vec3(0.12, 0.09, 0.1) * (0.8 + 0.4 * hash11(float(i) * 3.7));
    float s = sdEllipsoid(q - c, r) + 0.035 * (vnoise((q - c) * 14.0 + float(i)) - 0.5) + 0.012 * (vnoise((q - c) * 40.0) - 0.5);
    if (s < d) { d = s; sid = float(i) + 1.0; }
  }
  // two charred sticks lying across the ash
  float st1 = sdCapsule(q, vec3(-0.25, 0.04, -0.1), vec3(0.22, 0.06, 0.12), 0.025);
  float st2 = sdCapsule(q, vec3(-0.1, 0.035, 0.18), vec3(0.18, 0.05, -0.15), 0.02);
  float st = min(st1, st2);
  if (st < d) { d = st; sid = 20.0; }
  return d;
}
float mapV(vec3 p, out int id, out float hid, out vec3 lq) {
  float g = p.y - groundH(p.xz);
  if (g < 0.1) g += 0.025 * prints(p.xz);
  float h = houseSD(p, hid, lq);
  float sid; float hs = hearthSD(p, sid);
  id = 0; float d = g;
  if (h < d) { d = h; id = 1; }
  if (hs < d) { d = hs; id = 2; hid = sid; }
  return d;
}
float mapVS(vec3 p) { int i; float h; vec3 l; return mapV(p, i, h, l); }
vec3 normV(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.002 + 0.0006 * t);
  return normalize(e.xyy * mapVS(p + e.xyy) + e.yyx * mapVS(p + e.yyx) + e.yxy * mapVS(p + e.yxy) + e.xxx * mapVS(p + e.xxx));
}
float marchV(vec3 ro, vec3 rd) {
  float t = 0.05;
  for (int i = 0; i < 128; i++) {
    float d = mapVS(ro + rd * t);
    if (abs(d) < 0.0006 * t) return t;
    t += d * 0.9;
    if (t > 75.0) break;
  }
  return -1.0;
}
float shadowV(vec3 p, vec3 L) {
  float s = 1.0, t = 0.05;
  for (int i = 0; i < 28; i++) {
    float d = mapVS(p + L * t);
    s = min(s, 10.0 * d / t);
    if (s < 0.01) break;
    t += clamp(d, 0.05, 1.5);
    if (t > 30.0) break;
  }
  return sat(s);
}

// the storm wrack overhead, racing, with the moon breaking through low behind the village
vec3 wrackSky(vec3 rd) {
  float y = max(rd.y, 0.0);
  vec2 cp = rd.xz / (rd.y + 0.4);
  cp += vec2(-0.05, 0.35) * uTime * (0.5 + 0.3 * uGust);
  float cl = fbm(cp * 1.8 + vec2(3.0, 1.0), 5) * 0.7 + 0.3 * fbm(cp * 5.0, 3);
  float thin = smoothstep(0.3, 0.75, cl);
  float mu = sat(dot(rd, MOONV));
  vec3 base = mix(vec3(0.012, 0.014, 0.02), vec3(0.002, 0.0025, 0.004), pow(y, 0.4));
  // the moon's light through the thinner cloud, and its rim on the thick
  vec3 moonGlow = vec3(0.32, 0.36, 0.44) * (pow(mu, 40.0) * 0.8 + pow(mu, 6.0) * 0.06) * (1.0 - 0.9 * thin);
  vec3 c = base + moonGlow;
  c = mix(c, vec3(0.003, 0.0035, 0.005) + vec3(0.12, 0.13, 0.16) * pow(mu, 12.0) * 0.4 * (1.0 - thin), thin * 0.9);
  c += vec3(0.7, 0.75, 0.85) * smoothstep(0.9993, 0.9997, mu) * (1.0 - smoothstep(0.35, 0.55, cl)) * 2.0;
  return c;
}

// dust density (sheets driven down the lane)
float dustD(vec3 p) {
  vec3 q = p - WIND * uTime * (5.5 + 3.0 * uGust);
  float sheets = fbm(vec3(q.x * 0.3, q.y * 0.7, q.z * 0.1), 3);
  // streaky: drawn out along the wind
  float fine = vnoise(q * vec3(2.2, 3.2, 0.25)) * 0.6 + 0.4 * vnoise(q * vec3(6.0, 9.0, 0.6));
  float d = smoothstep(0.38, 0.7, sheets) * (0.25 + 0.75 * smoothstep(0.35, 0.75, fine)) * 2.2;
  return d * exp(-p.y / (1.3 + 0.8 * uGust)) * (0.25 + 0.75 * uGust);
}

// the moon is low on the left: the left-hand row of houses throws the near half of the lane into shadow
float laneShadow(vec3 p) {
  float top = 2.7 + 0.5 * vnoise(vec2(p.z * 0.25, 2.0));
  // the roofline is ragged and the dust scatters light into the shadow: a broad, soft edge
  top += 0.6 * (vnoise(vec2(p.z * 0.9, 5.0)) - 0.5);
  float xs = p.x + max(top - p.y, 0.0) * (MOONV.x / MOONV.y) + 0.8 * (vnoise(p.xz * 0.6) - 0.5);
  return 0.3 + 0.7 * smoothstep(5.2, 2.6, xs);
}

vec3 village(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float t = marchV(ro, rd);
  vec3 L = MOONV;
  vec3 moonC = vec3(0.42, 0.46, 0.55);
  vec3 skyC = vec3(0.02, 0.023, 0.03);
  vec3 col; float depth = 140.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t; depth = t;
    int id; float hid; vec3 lq;
    mapV(p, id, hid, lq);
    vec3 n = normV(p, t);
    vec3 alb; float rough = 0.9;
    float occ = 1.0;
    if (id == 1) {
      // sun-dried mud brick: courses of bricks in a dun mortar, eroded and streaked
      vec2 uv = abs(n.x) > abs(n.z) ? lq.zy : lq.xy;
      float row = floor(uv.y / 0.11);
      float bx = (uv.x + mod(row, 2.0) * 0.17) / 0.34;
      vec2 bf = vec2(fract(bx), fract(uv.y / 0.11));
      float mortar = 1.0 - smoothstep(0.0, 0.06, min(min(bf.x, 1.0 - bf.x) * 3.1, min(bf.y, 1.0 - bf.y)));
      float bt = hash12(vec2(floor(bx), row) + hid * 10.0);
      // the plaster has fallen in places to show the courses beneath
      float plaster = smoothstep(0.36, 0.42, fbm(uv * 0.9 + hid * 7.0, 5) + 0.05 * (uv.y > 0.0 ? 0.0 : 1.0));
      alb = vec3(0.42, 0.33, 0.24) * (0.8 + 0.3 * bt);
      alb = mix(alb, vec3(0.3, 0.24, 0.18), mortar * (1.0 - plaster));
      alb = mix(alb, vec3(0.46, 0.39, 0.31) * (0.85 + 0.25 * fbm(uv * 8.0, 3)), plaster);
      // cracks running through the plaster
      vec2 cw = uv * vec2(1.6, 1.1) + 0.35 * vec2(vnoise(uv * 5.0), vnoise(uv * 5.0 + 9.0)) + hid * 3.0;
      vec2 n0 = floor(cw), f0 = fract(cw); float d1 = 8.0, d2 = 8.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(i, j), r = g + hash22(n0 + g) - f0; float dd = dot(r, r); if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
      float ce = (sqrt(d2) - sqrt(d1)) * 0.5;
      float crack = (1.0 - smoothstep(0.0, 0.012, ce)) * plaster * smoothstep(0.45, 0.6, vnoise(uv * 1.3 + hid * 5.0));
      alb *= 1.0 - 0.75 * crack;
      // rain streaks and soot by the door
      alb *= 0.8 + 0.25 * fbm(vec2(uv.x * 9.0, uv.y * 0.6), 3);
      // inside the open doors and windows: dark, a little dust on the sill
      float inside = smoothstep(0.1, 0.25, -dot(n, normalize(vec3(-sign(p.x), 0.0, 0.0))) + 0.0) ;
      occ = 1.0;
    } else if (id == 2) {
      alb = hid > 19.0 ? vec3(0.02) : vec3(0.2, 0.19, 0.18) * (0.6 + 0.7 * fbm(p.xz * 30.0 + p.y * 20.0, 3));
      // soot on the inner faces
      alb *= mix(1.0, 0.35, smoothstep(0.45, 0.2, length((p - HEARTH).xz)));
    } else {
      // the lane: pale dust, darker where the ruts are and in the prints
      float pr = prints(p.xz);
      alb = vec3(0.36, 0.31, 0.25) * (0.75 + 0.35 * fbm(p.xz * 2.0, 4));
      alb *= 1.0 - 0.25 * pr;
      // the hearth's ring of ash
      float hr = length((p - HEARTH).xz * vec2(1.0, 1.15));
      alb = mix(alb, vec3(0.2, 0.2, 0.2) * (0.6 + 0.6 * fbm(p.xz * 40.0, 3)), smoothstep(0.42, 0.25, hr));
      alb = mix(alb, vec3(0.03), smoothstep(0.25, 0.1, hr) * 0.7);
    }
    // ambient occlusion
    float ao = 0.0, sc = 1.0;
    for (int i = 1; i <= 4; i++) { float h = 0.08 * float(i); ao += (h - mapVS(p + n * h)) * sc; sc *= 0.7; }
    ao = sat(1.0 - 2.0 * ao);
    float sh = laneShadow(p);
    if (id == 1) sh = 1.0;
    float dif = sat(dot(n, L));
    // inside the houses there is no moon and little sky
    float interior = id == 1 ? smoothstep(0.3, -0.1, mapVS(p + n * 0.6)) : 0.0;
    vec3 lit = moonC * dif * sh + skyC * (0.5 + 0.5 * n.y) * ao + vec3(0.03, 0.028, 0.026) * sat(-n.y + 0.3) * 0.2;
    // light bounced off the moonlit lane onto the shadowed walls facing it
    lit += moonC * 0.16 * sat(0.6 - n.y) * (id == 1 ? 1.0 : 0.3) * ao;
    // walls with their backs to the moon: soft light from the moonlit dust and the far lane
    lit += moonC * 0.14 * (id == 1 ? sat(-dot(n, L) + 0.2) : 0.0) * ao * (0.7 + 0.3 * vnoise(p.yz * 0.8));
    // the dust in the air glows with the moon and lights what is under it, a little
    lit += vec3(0.02, 0.022, 0.026) * (0.4 + 0.6 * uGust) * ao;
    col = alb * lit * (1.0 - 0.8 * interior);
  } else {
    col = wrackSky(rd0);
  }
  // fog of fine dust over distance, lit by the moon from behind (forward scatter)
  float mu = sat(dot(rd, L));
  float ph = 0.25 + 1.6 * pow(mu, 6.0) + 0.4 * pow(mu, 2.0);
  vec3 fogC = vec3(0.006, 0.007, 0.009) + moonC * 0.07 * ph;
  float fogA = 1.0 - exp(-depth * (0.007 + 0.007 * uGust) * exp(-max(ro.y + rd.y * min(depth, 20.0), 0.0) * 0.08));
  col = mix(col, fogC, fogA);
  // the dust sheets themselves, marched near the ground
  {
    float tmax = min(depth, 45.0);
    float jit = fract(hash12(fc) + uJitter.x * 1.618 + uJitter.y * 0.754);   // per pixel and per sub-frame: no steps
    float T = 1.0; vec3 sc = vec3(0);
    const int N = 26;
    for (int i = 0; i < N; i++) {
      float s = (float(i) + jit) / float(N);
      float tt = 0.3 + s * s * tmax;
      float dt = 2.0 * s * tmax / float(N) + 0.01;
      vec3 p = ro + rd * tt;
      if (p.y > 6.0) break;
      float d = dustD(p) * 0.45 * (1.0 + 1.5 * smoothstep(8.0, 1.0, tt));
      if (d < 0.002) continue;
      vec3 S = (moonC * ph * 0.6 * laneShadow(p) + vec3(0.004, 0.0045, 0.006)) * vec3(1.0, 0.95, 0.88);
      float a = exp(-d * dt);
      sc += T * S * (1.0 - a);
      T *= a;
    }
    col = col * T + sc;
  }
  // grit streaking past close to the lens
  {
    vec2 uv = fc / uRes.y;
    vec2 g = vec2(uv.x * 40.0 + uTime * 25.0 * (0.6 + uGust), uv.y * 160.0);
    float cell = hash12(floor(g));
    float streak = step(0.985, cell) * smoothstep(0.0, 0.5, fract(g.x)) * smoothstep(1.0, 0.5, fract(g.x));
    col += vec3(0.03, 0.03, 0.033) * streak * 0.0;
  }
  // the closing veil
  col = mix(col, vec3(0.05, 0.05, 0.055) + moonC * 0.06, uVeil * 0.85);
  return col;
}
`;
