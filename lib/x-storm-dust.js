// The dried waterhole (s16): close and low over cracked dry earth at night in ash-grey light. The
// mud of a waterhole has dried into curling plates with deep cracks between them; at the bottom an
// abandoned clay jar lies on its side, half sunk in the cracked mud, its lip chipped, a broken shard
// beside it. A faint wind lifts thin veils of dust off the cracks and lets them fall. Still, quiet.
// Metres; the rim of the hole is at y = 0, its bottom about 0.3 lower.
import { STORM_COMMON } from './x-storm.js';

export const DUST_UNIFORMS = { uFocus: 1.2, uAper: 0.012 };

export const DUST_GLSL = STORM_COMMON + /* glsl */ `
const vec3 KEY = normalize(vec3(-0.7, 0.42, -0.2));   // the moon low behind cloud, raking from the left
const vec3 JAR = vec3(0.15, -0.29, 1.5);

float bowl(vec2 xz) { return -0.3 * exp(-dot(xz - vec2(0.2, 1.6), xz - vec2(0.2, 1.6)) / 1.8); }
// a cheap one-pass cellular edge: (F2 - F1) / 2 along the line between the two nearest points
vec2 cellEdge(vec2 x) {
  vec2 n = floor(x), f = fract(x);
  float d1 = 8.0, d2 = 8.0; vec2 c1 = vec2(0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(i, j), r = g + hash22(n + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; c1 = n + g; } else if (d < d2) d2 = d;
  }
  return vec2((sqrt(d2) - sqrt(d1)) * 0.5, hash12(c1));
}
// cracked plates: out edge distance and plate id (DETAIL 0 skips the finest cracks, for marching)
bool DETAIL = false;
float plates(vec2 xz, out float edge, out float id) {
  vec2 w = xz * 5.5 + 0.25 * (vec2(vnoise(xz * 9.0), vnoise(xz * 9.0 + 5.0)) - 0.5);
  vec2 v = cellEdge(w);
  edge = v.x / 5.5; id = v.y;
  float crack = 1.0 - smoothstep(0.0, 0.006 + 0.004 * hash11(id * 7.0), edge);
  // the plates curl up a little at their edges as they dry, and are a touch tilted
  float curl = 0.006 * smoothstep(0.03, 0.004, edge) * (0.5 + hash11(id * 3.0));
  float tilt = dot(xz, (hash22(vec2(id, 1.0)) - 0.5)) * 0.01;
  // fine secondary cracks
  float h = curl + tilt - 0.035 * crack;
  if (DETAIL) {
    vec2 v2 = cellEdge(xz * 16.0 + id * 5.0);
    float fine = (1.0 - smoothstep(0.0, 0.03, v2.x)) * step(0.45, vnoise(xz * 6.0 + id));
    h += -0.0025 * fine + 0.0012 * (fbm(xz * 60.0, 3) - 0.5);
  }
  return h;
}
float groundH(vec2 xz) { float e, i; return bowl(xz) + plates(xz, e, i); }

// the jar, lying on its side: a revolved profile along its local x axis
float jarSD(vec3 p) {
  vec3 q = p - JAR;
  q.xz = rot(-0.85) * q.xz;   // mouth turned three-quarters toward us
  q.xy = rot(-0.1) * q.xy;    // tipped a little down into the mud
  float x = q.x, r = length(q.yz);
  // the profile: radius along the axis (foot at x = -0.22, mouth at x = 0.3)
  float body = sdEllipsoid(vec3(x + 0.02, q.y, q.z), vec3(0.21, 0.155, 0.155));
  float shoulder = sdEllipsoid(vec3(x - 0.1, q.y, q.z), vec3(0.11, 0.12, 0.12));
  float neck = max(r - (0.058 + 0.02 * smoothstep(0.24, 0.3, x)), abs(x - 0.21) - 0.09);
  float d = smin(smin(body, shoulder, 0.06), neck, 0.04);
  // the rolled lip
  float lip = length(vec2(x - 0.295, r - 0.072)) - 0.016;
  d = smin(d, lip, 0.015);
  // hollow: walls a centimetre thick, the mouth open into the dark inside
  float inner = smin(sdEllipsoid(vec3(x + 0.02, q.y, q.z), vec3(0.195, 0.14, 0.14)), max(r - 0.05, abs(x - 0.2) - 0.2), 0.04);
  d = max(d, -inner);
  // a chip broken out of the lip
  d = max(d, -sdSphere(q - vec3(0.3, 0.07, 0.04), 0.035));
  // the worn, pitted surface of hand-thrown clay, and the throwing rings
  if (d < 0.01) d += 0.0012 * (fbm(q * 90.0, 3) - 0.5) + 0.0004 * sin(x * 260.0);
  return d;
}
// a broken shard of another pot
float shardSD(vec3 p) {
  vec3 q = p - vec3(-0.25, -0.235, 1.3);
  q.xz = rot(1.1) * q.xz;
  float shell = abs(length(q - vec3(0.0, -0.16, 0.0)) - 0.16) - 0.006;
  return max(shell, sdBox(q, vec3(0.06, 0.03, 0.05)));
}
float mapD(vec3 p, out int id) {
  float g = (p.y - groundH(p.xz)) * 0.75;
  float j = 1e9, s = 1e9;
  if (length(p - JAR) < 0.6) { j = jarSD(p); s = shardSD(p); }
  else j = length(p - JAR) - 0.45;
  id = 0; float d = g;
  if (j < d) { d = j; id = 1; }
  if (s < d) { d = s; id = 2; }
  return d;
}
float mapDS(vec3 p) { int i; return mapD(p, i); }
vec3 normD(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.0006 + 0.0003 * t);
  DETAIL = true;
  vec3 n = normalize(e.xyy * mapDS(p + e.xyy) + e.yyx * mapDS(p + e.yyx) + e.yxy * mapDS(p + e.yxy) + e.xxx * mapDS(p + e.xxx));
  DETAIL = false;
  return n;
}
float marchD(vec3 ro, vec3 rd) {
  float t = 0.02;
  for (int i = 0; i < 160; i++) {
    float d = mapDS(ro + rd * t);
    if (abs(d) < 0.0003 * t) return t;
    t += d;
    if (t > 40.0) break;
  }
  return -1.0;
}
float shadowD(vec3 p, vec3 L) {
  float s = 1.0, t = 0.005;
  for (int i = 0; i < 24; i++) {
    float d = mapDS(p + L * t);
    s = min(s, 14.0 * d / t);
    if (s < 0.01) break;
    t += clamp(d, 0.008, 0.25);
    if (t > 2.0) break;
  }
  return sat(s);
}

// the night sky under thin cloud, ash grey with the moon's glow low on the left
vec3 ashSky(vec3 rd) {
  float y = max(rd.y, 0.0);
  float mu = sat(dot(rd, KEY));
  vec2 cp = rd.xz / (rd.y + 0.15);
  float cl = fbm(cp * 1.2 + vec2(uTime * 0.01, 0.0), 5);
  vec3 c = mix(vec3(0.03, 0.032, 0.036), vec3(0.006, 0.0065, 0.008), pow(y, 0.45));
  c += vec3(0.14, 0.15, 0.17) * pow(mu, 10.0) * (0.6 + 0.6 * cl);
  c *= 0.75 + 0.5 * cl;
  return c;
}

// dust veils: thin sheets lifting off the cracks, drifting right, falling back
float veil(vec3 p) {
  vec3 q = p - vec3(uTime * 0.35, 0.0, uTime * 0.05);
  float sheet = fbm(vec3(q.x * 2.2, q.y * 9.0 - uTime * 0.25, q.z * 2.2), 4);
  float h = p.y - groundH(p.xz);
  float lift = exp(-max(h, 0.0) / (0.035 + 0.05 * vnoise(q.xz * 1.5)));
  return smoothstep(0.5, 0.78, sheet) * lift * smoothstep(-0.005, 0.01, h);
}

vec3 dryHole(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float t = marchD(ro, rd);
  vec3 L = KEY;
  vec3 keyC = vec3(0.5, 0.52, 0.56);
  vec3 skyC = vec3(0.05, 0.053, 0.06);
  vec3 col; float depth = 50.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t; depth = t;
    int id; mapD(p, id);
    vec3 n = normD(p, t);
    vec3 alb; float rough = 0.95;
    if (id == 0) {
      float e, pid; plates(p.xz, e, pid);
      // pale grey dried mud, darker and cooler down in the hole; the cracks are deep and dark
      float inHole = smoothstep(-0.05, -0.22, bowl(p.xz));
      alb = mix(vec3(0.42, 0.39, 0.35), vec3(0.33, 0.31, 0.29), inHole) * (0.85 + 0.25 * hash11(pid * 13.0)) * (0.8 + 0.3 * fbm(p.xz * 30.0, 3));
      alb *= mix(0.25, 1.0, smoothstep(0.0, 0.012, e));
      // a tide line of old silt round the hole's edge, and the few dead stalks of weed
      alb = mix(alb, vec3(0.26, 0.24, 0.21), smoothstep(0.02, 0.0, abs(bowl(p.xz) + 0.06)) * 0.5);
    } else if (id == 1) {
      // fired clay, red-brown under dust, a dark band painted round the shoulder, worn
      vec3 q = p - JAR; q.xz = rot(-0.85) * q.xz;
      alb = vec3(0.36, 0.24, 0.17) * (0.75 + 0.4 * fbm(p.xz * 40.0 + p.y * 30.0, 4));
      float band = smoothstep(0.012, 0.0, abs(q.x - 0.1)) * (0.6 + 0.4 * vnoise(q.yz * 60.0));
      alb = mix(alb, vec3(0.1, 0.07, 0.05), band * 0.8);
      // dust settled on the upper side
      alb = mix(alb, vec3(0.42, 0.4, 0.37), smoothstep(0.2, 0.8, n.y) * 0.75 * smoothstep(0.35, 0.6, fbm(p.xz * 50.0 + p.y * 40.0, 4)));
      rough = 0.85;
      rough = 0.75;
    } else {
      alb = vec3(0.34, 0.24, 0.18) * (0.8 + 0.3 * fbm(p.xz * 60.0, 3));
    }
    float sh = shadowD(p + n * 0.002, L);
    float ao = 0.0, sc = 1.0;
    for (int i = 1; i <= 4; i++) { float h = 0.01 * float(i); ao += (h - mapDS(p + n * h)) * sc; sc *= 0.65; }
    ao = sat(1.0 - 18.0 * ao);
    float dif = sat(dot(n, L));
    vec3 v = -rd;
    vec3 hv = normalize(L + v);
    float spec = pow(sat(dot(n, hv)), 24.0) * (1.0 - rough) * 0.6;
    col = alb * (keyC * dif * sh + skyC * (0.5 + 0.5 * n.y) * ao) + keyC * spec * sh;
    col = mix(col, vec3(0.03, 0.032, 0.036), 1.0 - exp(-t * 0.06));
  } else {
    col = ashSky(rd0);
  }
  // the veils of dust, close over the ground, lit by the key from the side
  {
    float T = 1.0; vec3 sc = vec3(0);
    float jit = hash12(fc + uJitter * 17.0 + fract(uTime * 3.0) * 7.0);
    float tmax = min(depth, 6.0);
    for (int i = 0; i < 18; i++) {
      float s = (float(i) + jit) / 18.0;
      float tt = 0.05 + s * s * tmax;
      float dt = 2.0 * s * tmax / 18.0 + 0.002;
      vec3 p = ro + rd * tt;
      if (p.y > 0.25) continue;
      float d = veil(p) * 4.0;
      if (d < 0.01) continue;
      float ph = 0.6 + 1.5 * pow(sat(dot(rd, L)), 3.0);
      vec3 S = keyC * 0.5 * ph + skyC;
      float a = exp(-d * dt);
      sc += T * S * (1.0 - a) * vec3(1.0, 0.97, 0.92);
      T *= a;
    }
    col = col * T + sc;
  }
  return col;
}
`;
