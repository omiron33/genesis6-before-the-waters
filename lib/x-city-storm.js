// The valley city under the storm front at night (s26-destroy). Seen from the dark plain: the
// cyclopean walls and towers of the city on its rise, its fires glowing through black smoke, and
// over it the storm, a low ceiling of black cloud lit from within. Lightning strikes in a run of
// hard flashes timed to the drum hits (uStrike: song times; uStrikeX: where each one falls along
// the city; uStrikeK: strength), each flash lighting walls and towers white for an instant. Dry:
// no rain. The last flash whites out the frame and it cuts to black.
// City along x at z ~ 420..560 on a low rise, camera on the plain at z ~ 0 looking +z.
export const STORM_UNIFORMS = { uStrike: new Array(16).fill(1e4), uStrikeX: new Array(16).fill(0), uStrikeK: new Array(16).fill(0) };

export const STORM_GLSL = /* glsl */ `
uniform float uStrike[16], uStrikeX[16], uStrikeK[16];
#define NS 16
const float CZ = 470.0;

// brightness of strike i now: a hard attack, a re-strike flicker, a fast decay
float strikeE(int i) {
  float x = uTime - uStrike[i];
  if (x < 0.0 || x > 0.6) return 0.0;
  float e = exp(-x * 14.0) + 0.6 * exp(-abs(x - 0.07) * 60.0) + 0.35 * exp(-abs(x - 0.16) * 50.0);
  return e * uStrikeK[i];
}
vec3 strikeTop(int i) { return vec3(uStrikeX[i] + 40.0 * (hash11(float(i) * 3.1) - 0.5), 330.0, CZ + 60.0 * hash11(float(i) * 7.3)); }
vec3 strikeBot(int i) { return vec3(uStrikeX[i], 60.0 + 40.0 * hash11(float(i) * 5.7), CZ - 10.0 + 30.0 * hash11(float(i) * 9.1)); }
float flashAll() { float f = 0.0; for (int i = 0; i < NS; i++) f += strikeE(i); return f; }

float cityH(vec2 c) {
  // a block of the city: walls rise to 30-60 m, towers to 90-140 m, one great stepped tower
  float h = 18.0 + 30.0 * hash12(c);
  if (hash12(c + 7.0) > 0.82) h = 70.0 + 70.0 * hash12(c + 3.0);
  return h;
}
// id: 1 plain, 2 city stone
float mapC(vec3 p, out float id) {
  // the plain, rising gently toward the city
  float g = p.y - 0.6 * fbm(p.xz * 0.05, 3) - 18.0 * smoothstep(250.0, 430.0, p.z);
  id = 1.0; float d = g;
  // the plain before the city: scattered stones and the low rubble walls of fields, broken in places
  if (p.z > 8.0 && p.z < 330.0 && g < 4.0) {
    vec2 sc = p.xz / 6.0; vec2 cid = floor(sc);
    float h = hash12(cid);
    if (h < 0.35) {
      vec2 o = (cid + 0.25 + 0.5 * hash22(cid + 4.0)) * 6.0;
      float rr = 0.3 + 0.9 * hash11(h * 31.0);
      vec3 q = vec3(p.x - o.x, g - rr * 0.3, p.z - o.y);
      q.xz = rot(h * 20.0) * q.xz;
      q.xy = rot((h - 0.2) * 1.5) * q.xy;
      float st = sdBox(q, vec3(rr * 1.1, rr * 0.5, rr * 0.8)) - rr * 0.2 - 0.12 * vnoise(q.xz * 5.0 + h) * rr;
      if (st < d) { d = st; id = 3.0; }
    }
    for (int k = 0; k < 3; k++) {
      float wz = 70.0 + 75.0 * float(k) + 10.0 * sin(p.x * 0.01 + float(k));
      float gap = step(0.72, vnoise(vec2(p.x * 0.03, float(k) * 7.0)));
      float wh = (0.9 + 0.5 * vnoise(vec2(p.x * 0.4, float(k)))) * (1.0 - gap);
      vec3 q = vec3(0.0, g, p.z - wz);
      float wall = sdBox(q - vec3(0.0, wh * 0.5, 0.0), vec3(1.0, wh * 0.5, 0.6)) - 0.15 * vnoise(p.xz * 3.0 + p.y * 2.0);
      if (wall < d) { d = wall; id = 3.0; }
    }
  }
  // the outer wall: a long cyclopean line, battered, with broad towers; merlons along the tops
  float wz = p.z - 430.0;
  float wall = max(abs(wz) - 6.0 - 0.08 * max(64.0 - p.y, 0.0), p.y - 64.0);
  float ti = floor((p.x + 35.0) / 70.0);
  float tw = mod(p.x + 35.0, 70.0) - 35.0;
  float th = 92.0 + 22.0 * hash11(ti);
  float tower = max(max(abs(tw) - 11.0 - 0.06 * max(th - p.y, 0.0), abs(wz + 4.0) - 13.0 - 0.06 * max(th - p.y, 0.0)), p.y - th);
  float notchW = max(abs(p.y - 64.0 + 1.4) - 1.4, abs(fract(p.x / 4.0) - 0.5) * 4.0 - 1.0);
  float notchT = max(abs(p.y - th + 1.6) - 1.6, abs(fract((p.x + p.z) / 4.5) - 0.5) * 4.5 - 1.1);
  wall = max(wall, -notchW);
  tower = max(tower, -notchT);
  wall = min(wall, tower);
  wall = max(wall, abs(p.x) - 520.0);
  // behind it, the great houses of the city: broad stepped towers, two tiers each
  float bi = floor((p.x + 60.0) / 120.0);
  float bx = mod(p.x + 60.0, 120.0) - 60.0 + 20.0 * (hash11(bi + 2.0) - 0.5);
  float hh = 85.0 + 45.0 * hash11(bi + 5.0);
  vec3 bq = vec3(bx, p.y - 18.0, p.z - 505.0 - 20.0 * hash11(bi));
  float tier1 = sdBox(bq - vec3(0.0, hh * 0.3, 0.0), vec3(26.0, hh * 0.3, 22.0));
  float tier2 = sdBox(bq - vec3(0.0, hh * 0.8, 0.0), vec3(14.0, hh * 0.2, 12.0));
  float city = min(tier1, tier2);
  city = max(city, abs(p.x) - 470.0);
  // the great stepped tower at the centre of the city
  vec3 q = p - vec3(-30.0, 18.0, 560.0);
  float zig = sdBox(q - vec3(0.0, 30.0, 0.0), vec3(70.0, 30.0, 60.0));
  zig = min(zig, sdBox(q - vec3(0.0, 80.0, 0.0), vec3(45.0, 25.0, 40.0)));
  zig = min(zig, sdBox(q - vec3(0.0, 130.0, 0.0), vec3(25.0, 30.0, 22.0)));
  zig = min(zig, sdBox(q - vec3(0.0, 180.0, 0.0), vec3(12.0, 25.0, 11.0)));
  float s = min(min(wall, city), zig);
  if (s < d) { d = s; id = 2.0; }
  return d;
}
float mapCd(vec3 p) { float i; return mapC(p, i); }
vec3 normC(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.01 + 0.001 * t);
  return normalize(e.xyy * mapCd(p + e.xyy) + e.yyx * mapCd(p + e.yyx) + e.yxy * mapCd(p + e.yxy) + e.xxx * mapCd(p + e.xxx));
}
float marchC(vec3 ro, vec3 rd, out float id) {
  float t = 0.5;
  for (int i = 0; i < 160; i++) {
    float d = mapC(ro + rd * t, id);
    if (abs(d) < 0.0008 * t) return t;
    t += d * 0.85;
    if (t > 1600.0) break;
  }
  id = -1.0; return 1600.0;
}

// a jagged bolt with branches, drawn in the vertical plane through it that faces the ray
vec3 bolt(vec3 ro, vec3 rd, int i, float depth) {
  float e = strikeE(i);
  if (e < 0.003) return vec3(0);
  vec3 a = strikeTop(i), b = strikeBot(i);
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dot(b.xz - ro.xz, dxz) / dd;
  if (t <= 0.0 || t > depth + 20.0) return vec3(0);
  vec3 q = ro + rd * t;
  float u = (a.y - q.y) / (a.y - b.y);                  // 0 at the cloud, 1 at the strike
  if (u < -0.05 || u > 1.05) return vec3(0);
  float s = float(i) * 13.7;
  float path = mix(a.x, b.x, u) + 26.0 * (fbm(vec2(u * 6.0, s), 4) - 0.5) + 6.0 * (vnoise(vec2(u * 40.0, s)) - 0.5);
  vec2 side = normalize(vec2(-rd.z, rd.x) + 1e-5);
  float off = abs(dot(q.xz - vec2(path, mix(a.z, b.z, u)), side));
  float w = 0.6 + 0.004 * t;
  float core = exp(-off / w) * 6.0 + exp(-off / (w * 8.0)) * 0.6 + exp(-off / 60.0) * 0.05;
  // two branches forking off part way down
  float br = 0.0;
  for (int k = 0; k < 2; k++) {
    float u0 = 0.25 + 0.3 * float(k) + 0.1 * hash11(s + float(k));
    if (u > u0 && u < u0 + 0.35) {
      float bu = (u - u0) / 0.35;
      float bp = path + (k == 0 ? 1.0 : -1.0) * (bu * 60.0 + 14.0 * (fbm(vec2(bu * 5.0, s + 9.0 * float(k)), 3) - 0.5));
      float bo = abs(dot(q.xz - vec2(bp, mix(a.z, b.z, u)), side));
      br += (exp(-bo / (w * 0.7)) * 2.5 + exp(-bo / (w * 6.0)) * 0.2) * (1.0 - bu);
    }
  }
  return vec3(0.85, 0.9, 1.0) * (core + br) * e * smoothstep(-0.05, 0.03, u);
}

vec3 cityStorm(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float id; float t = marchC(ro, rd, id);
  float F = flashAll();
  // the storm ceiling: black cloud, its underside lit red by the city, and white from within at
  // each strike (strongest near the bolt)
  float cbase = 260.0;
  vec3 col;
  {
    float tc = (cbase - ro.y) / max(rd.y, 1e-3);
    vec3 cp = ro + rd * tc;
    vec2 uv = cp.xz * 0.004 + vec2(uTime * 0.02, -uTime * 0.035);
    float n = fbm(uv + 0.5 * vec2(fbm(uv * 1.7, 3), fbm(uv * 1.7 + 4.0, 3)), 6);
    vec3 cl = vec3(0.012, 0.011, 0.016) * (0.4 + 1.2 * n);
    cl += vec3(0.4, 0.08, 0.025) * 0.28 * exp(-max(length(cp.xz - vec2(0.0, 560.0)) - 200.0, 0.0) / 300.0) * (0.3 + n);
    for (int i = 0; i < NS; i++) {
      float e = strikeE(i);
      if (e < 0.003) continue;
      vec3 a = strikeTop(i);
      float dl = length(cp.xz - a.xz);
      cl += vec3(0.75, 0.8, 1.0) * e * (1.6 * exp(-dl / 160.0) + 0.25 * exp(-dl / 700.0)) * (0.3 + 1.4 * n * n);
    }
    // toward the horizon the cloud and the smoke merge into a dark red murk
    col = mix(vec3(0.03, 0.01, 0.008) + vec3(0.3, 0.33, 0.4) * F * 0.08, cl, smoothstep(0.0, 0.08, rd.y));
    // the city's fires light the smoke over it from below: a red band behind the skyline
    col += vec3(0.5, 0.1, 0.03) * 0.45 * exp(-max(rd.y - 0.02, 0.0) * 9.0) * smoothstep(-0.02, 0.03, rd.y) * (0.6 + 0.6 * fbm(vec2(atan(rd.x, rd.z) * 8.0, uTime * 0.1), 3));
  }
  if (id > 0.0) {
    vec3 p = ro + rd * t, n = normC(p, t), v = -rd;
    vec3 alb; float rough = 0.9;
    if (id == 1.0) {
      alb = vec3(0.09, 0.075, 0.06) * (0.6 + 0.7 * fbm(p.xz * 0.3, 4));
      float gr = smoothstep(0.45, 0.7, fbm(p.xz * 0.8 + 3.0, 3));
      alb = mix(alb, vec3(0.15, 0.13, 0.08) * (0.6 + 0.8 * vnoise(p.xz * 40.0)), gr * 0.8);   // dry grass in tufts
      n = bumpN(p, n, 0.6, 0.35); n = bumpN(p, n, 3.0, 0.3); n = bumpN(p, n, 25.0, 0.4);
    } else if (id == 3.0) {
      alb = vec3(0.11, 0.1, 0.09) * (0.6 + 0.6 * fbm(p.xz * 2.0 + p.y * 3.0, 4));
      n = bumpN(p, n, 3.0, 0.35);
    } else {
      vec3 cb = cyclo(abs(n.z) > 0.6 ? p.xy : p.zy, 7.0);
      alb = stoneAlb(p * 0.3, cb.y) * (1.0 - 0.7 * cb.z);
      n = bumpN(p, n, 0.25, 0.35);
    }
    col = vec3(0);
    // lightning: each strike lights the city from where it falls
    for (int i = 0; i < NS; i++) {
      float e = strikeE(i);
      if (e < 0.003) continue;
      vec3 lp = mix(strikeTop(i), strikeBot(i), 0.6);
      vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
      col += brdf(n, v, L, alb, rough, 0.0, vec3(0.8, 0.86, 1.0) * e * 1.6e5 / (d2 + 1e4));
      // the cloud over the plain flares: a cold white light falling on the faces of the walls
      col += brdf(n, v, normalize(vec3(0.1, 0.8, -0.6)), alb, rough, 0.0, vec3(0.8, 0.86, 1.0) * e * 2.2);
      // and the whole storm ceiling glows over everything
      col += alb * vec3(0.75, 0.8, 1.0) * e * 0.35 * (0.5 + 0.5 * n.y);
    }
    // the city's own fires: windows and forge mouths in the stone, a red glow at the walls' feet
    if (id == 2.0) {
      vec2 g = vec2(p.x + p.z, p.y) / 3.5;
      float h = hash12(floor(g));
      float win = step(0.985, h) * smoothstep(0.45, 0.2, length(fract(g) - 0.5));
      col += vec3(1.0, 0.4, 0.1) * win * (0.6 + 0.6 * sin(uTime * 2.0 + h * 40.0)) * 0.8;
      col += alb * vec3(1.0, 0.25, 0.06) * 0.35 * exp(-max(p.y - 18.0, 0.0) / 20.0);
    } else {
      col += alb * vec3(0.5, 0.12, 0.04) * 0.25 * smoothstep(250.0, 420.0, p.z);
    }
    col += alb * vec3(0.01, 0.009, 0.012);
    // distance haze: smoke and dust, red from the fires, white at a flash
    float fog = 1.0 - exp(-t * 0.0022);
    col = mix(col, vec3(0.045, 0.012, 0.008) + vec3(0.3, 0.32, 0.38) * F * 0.12, fog);
  }
  // smoke rising over the city, lit red from below and white at the flashes
  {
    float j = hash12(gl_FragCoord.xy + uJitter * 31.0);
    float tr = 1.0; vec3 acc = vec3(0);
    for (int i = 0; i < 10; i++) {
      float tt = 380.0 + (float(i) + j) * 30.0;
      if (tt > t) break;
      vec3 q = ro + rd * tt;
      if (q.y < 30.0 || q.y > 260.0) continue;
      float n = fbm(q * 0.012 + vec3(uTime * 0.02, -uTime * 0.05, 0.0), 4);
      float den = smoothstep(0.5, 0.75, n) * 0.02;
      float a = 1.0 - exp(-den * 30.0);
      acc += tr * a * (vec3(0.4, 0.08, 0.025) * exp(-(q.y - 30.0) / 70.0) * 0.4 + vec3(0.6, 0.65, 0.75) * F * 0.15 + vec3(0.008));
      tr *= 1.0 - a;
    }
    col = col * tr + acc;
  }
  for (int i = 0; i < NS; i++) col += bolt(ro, rd, i, t);
  // dust and embers blown across the plain
  
  return col;
}
`;
