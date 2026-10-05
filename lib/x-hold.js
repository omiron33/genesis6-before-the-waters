// The hold of the ark at night, full and ready, by warm lamplight. The same hull as outside (300 : 50 :
// 30, length along x, width along z, the window strip under the ridge), seen from within: three decks
// of honey cedar on posts and beams, a central aisle along the length and an open well through the
// middle of the decks (x -2.4..2.4, z -2.0..2.0) with a ladder.
//   deck 1 (floor 0.6): stalls with hay, mangers, water troughs; animals asleep as dim shapes in shadow
//   deck 2 (floor 4.6): the storeroom: tall clay grain jars, baskets of figs and dates, sheaves of
//                       wheat, small oil jars, strings of dried fruit hanging from the beams
//   deck 3 (floor 8.9): perches and roosts, birds asleep in rows
//   above: the roof space under the rafters, the clerestory and its window strip, and the night outside.
// Everything is a pure function of uTime.

export const DECKS = [0.6, 4.6, 8.9];
export const WIN_Y = 13.05;

export const HOLD_UNIFORMS = { uFocus: 3, uAper: 0.0, uExpo: 6, uOut: 0 };

export const HOLD_GLSL = /* glsl */ `
uniform float uFocus, uAper, uExpo, uOut;
const float D1 = 0.6, D2 = 4.6, D3 = 8.9;
const vec3 LAMPC = vec3(1.0, 0.68, 0.38);

// ---------------- the hull, from inside ----------------
float hullShape(vec3 p, float s) {
  float az = abs(p.z);
  float body = sdBox(p - vec3(0.0, 5.55, 0.0), vec3(67.5 - s, 5.6 - s, 11.25 - s));
  float roofTop = 11.1 + (11.45 - az) * 0.19 - s;
  float roof = max(max(p.y - roofTop, (s > 0.0 ? 10.5 : 10.9) - p.y), max(az - 11.45 + s, abs(p.x) - 67.75 + s)) * 0.92;
  float cl = sdBox(p - vec3(0.0, 13.05, 0.0), vec3(67.0 - s, 0.62 - s, 2.6 - s));
  float capTop = 13.75 + (2.95 - az) * 0.26 - s;
  float cap = max(max(p.y - capTop, (s > 0.0 ? 12.5 : 13.0) - p.y), max(az - 2.95 + s, abs(p.x) - 67.25 + s)) * 0.92;
  return min(min(body, roof), min(cl, cap));
}
// the window strip: openings in the clerestory riser between mullions
float windowCut(vec3 p) {
  float m = abs(fract(p.x / 1.5) - 0.5) * 1.5;                 // distance from a mullion centre
  return max(max(abs(abs(p.z) - 2.52) - 0.3, abs(p.y - 13.05) - 0.3), 0.07 - m);
}
// one jar of the store: a tall pithos, its profile turned about y (h: height)
float pithos(vec3 q, float h) {
  float y = q.y / h;
  float r = h * (0.1 + 0.2 * sin(PI * clamp(y * 1.08, 0.0, 1.0)) * (1.0 - 0.25 * y));
  r = mix(r, h * 0.13, smoothstep(0.82, 0.92, y));
  float d = (length(q.xz) - r) * 0.45;
  d = max(d, max(-q.y, q.y - h));
  float rim = length(vec2(length(q.xz) - h * 0.14, q.y - h * 0.97)) - h * 0.03;
  return min(d, rim);
}
// a round basket heaped with fruit
float basket(vec3 q, float r, out float fruit) {
  float w = max(length(q.xz) - r, abs(q.y - r * 0.4) - r * 0.4);
  w = max(w, -max(length(q.xz) - r + 0.02, abs(q.y - r * 0.5) - r * 0.45));
  float heap = length(q - vec3(0.0, r * 0.62, 0.0)) - r * 0.85;
  heap = max(heap, -(q.y - r * 0.55));
  // lumpy fruit on the heap
  vec3 c = q * 14.0;
  heap += 0.022 * (abs(sin(c.x) * sin(c.y + 1.3) * sin(c.z + 0.7)));
  heap = max(heap, length(q.xz) - r + 0.02);
  fruit = heap < w ? 1.0 : 0.0;
  return min(w, heap);
}
// a standing sheaf of wheat, bound at the waist, the ears splaying above
float sheaf(vec3 q, float h) {
  float y = q.y / h;
  // the bundle: narrow at the band (y 0.45), flaring a little to the butts and widely to the ears
  float r = h * (0.07 + 0.05 * smoothstep(0.45, 0.0, y) + 0.17 * smoothstep(0.5, 1.0, y));
  float d = (length(q.xz) - r) * 0.6;
  d = max(d, max(-q.y, q.y - h * (0.95 + 0.05 * vnoise(q.xz * 20.0))));
  // stalks as fine vertical ridges; the ears a tufted crown of little grains
  float a = atan(q.z, q.x);
  d += 0.004 * sin(a * 55.0 + 3.0 * vnoise(q.xz * 9.0));
  float ears = smoothstep(0.72, 0.85, y);
  d += ears * (0.025 * vnoise(q * 45.0) + 0.02 * sin(a * 24.0) * sin(q.y * 70.0));
  return d;
}

// ---------------- the contents of the decks ----------------
// store cells along the walls of deck 2: id.x along the length, id.y across
const float CS = 1.15;
float storeSD(vec3 p, out float mat) {
  mat = 0.0;
  vec3 q = p - vec3(0.0, D2, 0.0);
  float az = abs(q.z);
  float reg = max(max(2.55 - az, az - 10.8), q.y - 2.4);
  if (reg > 0.0) return reg + 0.02;
  vec2 id = floor(q.xz / CS);
  vec2 cc = (id + 0.5) * CS;
  vec2 h = hash22(id * 1.37 + 5.0);
  vec3 l = q - vec3(cc.x + (h.x - 0.5) * 0.12, 0.0, cc.y + (h.y - 0.5) * 0.12);
  float edge = -max(abs(q.x - cc.x), abs(q.z - cc.y)) + CS * 0.5;      // distance to the cell wall
  float kind = hash12(id + 31.0);
  float d; mat = 1.0;
  if (abs(cc.x) < 3.0) return max(edge, 0.0) + 0.02;                          // the well and ladder keep clear
  if (kind < 0.55) { d = pithos(l, 1.25 + 0.45 * h.x); mat = 1.0; }
  else if (kind < 0.75) { float fr; d = basket(l, 0.32 + 0.08 * h.y, fr); mat = fr > 0.5 ? (h.x > 0.5 ? 3.0 : 4.0) : 2.0; }
  else if (kind < 0.9) {
    vec3 s = l; s.xz = rot(h.x * 6.0) * s.xz; s.x += 0.12 * s.y * (h.y - 0.5);
    d = sheaf(s, 1.1 + 0.3 * h.y); mat = 5.0;
    float tie = max(abs(length(s.xz) - 0.06) - 0.012, abs(s.y - (1.1 + 0.3 * h.y) * 0.45) - 0.02);
    if (tie < d) { d = tie; mat = 7.0; }
  } else {
    // a cluster of small glazed oil jars
    d = 1e9;
    for (int i = 0; i < 3; i++) { vec2 o = vec2(cos(float(i) * 2.1 + h.x * 6.0), sin(float(i) * 2.1 + h.x * 6.0)) * 0.2; d = min(d, pithos(l - vec3(o.x, 0.0, o.y), 0.55 + 0.1 * float(i))); }
    mat = 6.0;
  }
  return min(d, max(edge, 0.0) + 0.02);
}
// strings of dried fruit hanging from the beams over the store, swaying a little
float hangSD(vec3 p, out float m) {
  m = 8.0;
  vec3 q = p - vec3(0.0, D2, 0.0);
  float az = abs(q.z);
  float reg = max(max(2.5 - az, az - 4.2), max(1.8 - q.y, q.y - 3.95));
  if (reg > 0.0) return reg + 0.02;
  float cx = floor(q.x / 0.6);
  float hx = hash11(cx * 3.3 + sign(q.z));
  float len = 0.6 + 0.9 * hx;
  vec3 a = vec3((cx + 0.5) * 0.6, 3.95, sign(q.z) * (3.0 + 0.6 * hash11(cx * 7.0)));
  float sw = 0.04 * sin(uTime * 0.8 + cx);
  vec3 l = q - a; l.x -= sw * (3.95 - q.y);
  float cord = max(length(l.xz) - 0.006, max(l.y, -len - l.y));
  // fruit threaded on the cord
  float fy = clamp(floor(-l.y / 0.07), 1.0, floor(len / 0.07));
  vec3 fq = l - vec3(0.0, -fy * 0.07, 0.0); fq.xz = rot(fy * 2.3 + cx) * fq.xz;
  float fr = (length(fq * vec3(0.8, 1.5, 1.3)) - 0.03 - 0.008 * hash11(fy + cx)) * 0.65 + 0.004 * vnoise(fq * 90.0);
  if (fr < cord) { m = 9.0; return min(fr, max(abs(q.x - (cx + 0.5) * 0.6) - 0.3, 0.0) + 0.03); }
  return min(cord, max(abs(q.x - (cx + 0.5) * 0.6) - 0.3, 0.0) + 0.03);
}
// deck 1 stalls: partitions, mangers, hay; sleeping animals as dark mounds in some stalls
float stallSD(vec3 p, float floorY, float h, out float mat) {
  mat = 10.0;
  vec3 q = p - vec3(0.0, floorY, 0.0);
  float az = abs(q.z);
  float reg = max(max(q.y - h - 0.2, -q.y - 0.3), 2.3 - az);
  if (reg > 0.0) return reg + 0.02;
  float xk = floor(q.x / 3.2 + 0.5);
  float xx = q.x - xk * 3.2;
  float part = sdBox(vec3(xx, q.y - 0.5, az - 6.6), vec3(0.04, 0.5, 4.2));
  part = min(part, sdBox(vec3(xx, q.y - 1.02, az - 6.6), vec3(0.07, 0.06, 4.2)));
  float front = sdBox(vec3(xx, q.y - 1.0, az - 2.45), vec3(1.6, 0.05, 0.05));       // a rail along the aisle
  float manger = max(sdBox(vec3(xx - 0.8, q.y - 0.7, az - 2.75), vec3(0.6, 0.22, 0.25)), -sdBox(vec3(xx - 0.8, q.y - 0.85, az - 2.75), vec3(0.54, 0.22, 0.19)));
  float d = min(min(part, front), manger);
  float hay = q.y - 0.06 - 0.12 * vnoise(q.xz * 3.0) - 0.06 * vnoise(q.xz * 9.0);
  if (hay < d) { d = hay; mat = 11.0; }
  // asleep: a lying body, the head resting along it (only in some stalls)
  float hs = hash12(vec2(xk, sign(q.z)) + 3.0);
  if (hs > 0.2 && floorY < 1.0) {
    float sz = 0.6 + 0.6 * hash11(hs * 13.0);
    vec3 b = vec3(xx + 0.2, q.y, az - 4.6 - 1.5 * hash11(hs * 7.0));
    float breathe = 1.0 + 0.012 * sin(uTime * 1.3 + hs * 20.0);
    b.xz = rot(hash11(hs * 3.0) * 1.2 - 0.6) * b.xz;
    // lying on the side, legs folded under, the neck turned back and the head laid on the hay
    float body = sdEllipsoid(b - vec3(0.0, 0.36 * sz, 0.0), vec3(0.95 * sz, 0.36 * sz * breathe, 0.5 * sz));
    body = smin(body, sdEllipsoid(b - vec3(-0.55 * sz, 0.3 * sz, 0.08 * sz), vec3(0.45 * sz, 0.32 * sz, 0.45 * sz)), 0.2 * sz);
    body = smin(body, sdRoundCone(b, vec3(0.7 * sz, 0.45 * sz, 0.1 * sz), vec3(0.75 * sz, 0.25 * sz, 0.55 * sz), 0.2 * sz, 0.14 * sz), 0.12 * sz);
    body = smin(body, sdEllipsoid(b - vec3(0.5 * sz, 0.13 * sz, 0.78 * sz), vec3(0.3 * sz, 0.12 * sz, 0.15 * sz)), 0.08 * sz);
    body = smin(body, sdEllipsoid(b - vec3(0.35 * sz, 0.06 * sz, -0.45 * sz), vec3(0.35 * sz, 0.06 * sz, 0.1 * sz)), 0.08 * sz);
    body += 0.012 * sz * vnoise(b * 22.0 / sz) + 0.006 * sz * vnoise(b * 60.0 / sz);
    if (body < d) { d = body; mat = 12.0; }
  }
  return d;
}
// deck 3 roosts: rails with rows of birds asleep, heads tucked
float roostSD(vec3 p, out float mat) {
  mat = 10.0;
  vec3 q = p - vec3(0.0, D3, 0.0);
  float az = abs(q.z);
  float reg = max(max(q.y - 2.1, -q.y - 0.3), 2.3 - az);
  if (reg > 0.0) return reg + 0.02;
  float r1 = sdBox(vec3(q.x, q.y - 1.0 - 0.45 * step(5.0, az), mod(az, 2.2) - 1.1), vec3(70.0, 0.035, 0.035));
  float d = r1;
  float yR = 1.0 + 0.45 * step(5.0, az);
  vec2 id = vec2(floor(q.x / 0.32), floor(az / 2.2));
  if (hash12(id) > 0.45) {
    vec3 b = vec3(mod(q.x, 0.32) - 0.16, q.y - yR - 0.1, mod(az, 2.2) - 1.1);
    float sz = 0.7 + 0.5 * hash12(id + 2.0);
    float bird = sdEllipsoid(b / sz, vec3(0.1, 0.08, 0.075)) * sz;
    bird = smin(bird, sdSphere(b / sz - vec3(0.04, 0.07, 0.0), 0.05) * sz, 0.03 * sz);
    if (bird < d) { d = bird; mat = 13.0; }
  }
  return d;
}

// ---------------- the hold ----------------
vec3 lampPos(float k, float deck) {
  float y = deck == 0.0 ? D1 : deck == 1.0 ? D2 : D3;
  float sw = 0.03 * sin(uTime * 0.9 + k * 1.7 + deck);
  return vec3(k * 6.4 + 3.2 + sw, y + (deck == 2.0 ? 1.85 : 2.75), mod(k, 2.0) < 0.5 ? 1.7 : -1.7);
}
float mapH(vec3 p, out float mat) {
  mat = 20.0;                                         // cedar
  float outer = hullShape(p, 0.0);
  float shell = max(outer, -hullShape(p, 0.25));
  shell = max(shell, -windowCut(p));
  float d = shell;
  // decks with the open well
  float well = sdBox(p - vec3(0.0, 0.0, 0.0), vec3(2.4, 30.0, 2.0));
  float decks = min(abs(p.y - (D2 - 0.15)) - 0.15, abs(p.y - (D3 - 0.15)) - 0.15);
  decks = max(max(decks, -well), abs(p.z) - 11.0);
  decks = min(decks, p.y - D1);
  d = min(d, decks);
  // deck beams across, posts along the aisle, the roof's rafters
  float bx = mod(p.x + 0.8, 1.6) - 0.8;
  float beams = sdBox(vec3(bx, min(abs(p.y - (D2 - 0.42)), abs(p.y - (D3 - 0.42))), p.z), vec3(0.12, 0.13, 11.0));
  beams = max(beams, -max(well + 0.0, -1.0));
  float pk = mod(p.x + 1.6, 3.2) - 1.6;
  float posts = sdBox(vec3(pk, p.y - 6.0, abs(p.z) - 2.3), vec3(0.13, 6.0, 0.13));
  posts = max(posts, -sdBox(p - vec3(0.0, 0.0, 0.0), vec3(1.4, 30.0, 3.0)));
  float rafters = sdBox(vec3(mod(p.x + 1.2, 2.4) - 1.2, p.y - 11.3 - (11.0 - abs(p.z)) * 0.19 * 0.0, p.z), vec3(0.1, 0.12, 11.0));
  rafters = max(rafters, abs(p.y - 11.0) - 0.3);
  float ced = min(min(beams, posts), rafters);
  // the ladder up the well
  float lad = min(sdBox(vec3(abs(p.x + 1.6) - 0.3, p.y - 6.0, p.z + 1.7), vec3(0.04, 6.0, 0.04)), sdBox(vec3(p.x + 1.6, mod(p.y, 0.35) - 0.175, p.z + 1.7), vec3(0.3, 0.02, 0.02)));
  lad = max(lad, p.y - 11.0);
  ced = min(ced, lad);
  // the clay lamps on their cords
  float lampd = 1e9;
  float kx = floor((p.x - 3.2) / 6.4 + 0.5);
  for (int dk = 0; dk < 3; dk++) {
    vec3 lp = lampPos(kx, float(dk));
    lampd = min(lampd, sdEllipsoid(p - lp + vec3(0.0, 0.06, 0.0), vec3(0.11, 0.05, 0.08)));
    float top = float(dk) == 0.0 ? D2 - 0.3 : float(dk) == 1.0 ? D3 - 0.3 : 11.0;
    lampd = min(lampd, max(length(p.xz - lp.xz) - 0.008, max(lp.y + 0.03 - p.y, p.y - top)));
  }
  if (lampd < d && lampd < ced) { d = lampd; mat = 30.0; }
  if (ced < d) { d = ced; mat = 20.0; }
  // the contents
  float m;
  if (outer > 0.0 || abs(p.x) > 66.5) return d;
  float s1 = stallSD(p, D1, 3.7, m); if (s1 < d) { d = s1; mat = m; }
  float st = storeSD(p, m); if (st < d) { d = st; mat = m; }
  float hg = hangSD(p, m); if (hg < d) { d = hg; mat = m; }
  float r3 = roostSD(p, m); if (r3 < d) { d = r3; mat = m; }
  if (outer > 0.0 && d == shell) mat = 21.0;          // the pitched outside of the hull
  return d;
}
float mapHD(vec3 p) { float m; return mapH(p, m); }
vec3 normH(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.002;
  return normalize(e.xyy * mapHD(p + e.xyy) + e.yyx * mapHD(p + e.yyx) + e.yxy * mapHD(p + e.yxy) + e.xxx * mapHD(p + e.xxx));
}
float marchH(vec3 ro, vec3 rd, out float mat) {
  float t = 0.02; mat = 0.0;
  for (int i = 0; i < 320; i++) {
    float m; float d = mapH(ro + rd * t, m);
    mat = m;
    if (abs(d) < 0.0006 * t + 0.0004) return t;
    t += d * 0.85;
    if (t > 90.0) return -1.0;
  }
  return t;            // out of steps: take the nearest surface rather than show the sky through it
}
float softH(vec3 ro, vec3 rd, float tmax) {
  float res = 1.0, t = 0.16;
  for (int i = 0; i < 40; i++) {
    float h = mapHD(ro + rd * t);
    res = min(res, 4.0 * h / t);
    t += clamp(h, 0.02, 0.5);
    if (res < 0.01 || t > tmax) break;
  }
  return sat(res);
}
float aoH(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.05 * float(i * i); o += (h - mapHD(p + n * h)) * s; s *= 0.62; }
  return sat(1.0 - 1.3 * o);
}
float deckOf(float y) { return y < D2 - 0.3 ? 0.0 : y < D3 - 0.3 ? 1.0 : 2.0; }

// the night outside, through the window and once out of it
vec3 skyH(vec3 rd) {
  float y = rd.y;
  vec3 c = mix(vec3(0.036, 0.042, 0.048), vec3(0.007, 0.008, 0.012), pow(sat(y * 2.2 + 0.02), 0.6));
  if (y > -0.03) {
    vec2 uv = rd.xz / (max(y, 0.0) + 0.05);
    vec2 w = vec2(uTime * 0.05, uTime * 0.02);
    float n = fbm(uv * 0.32 + w, 5), n2 = fbm(uv * 1.1 - w * 1.7 + n * 1.5, 4);
    float mass = smoothstep(0.32, 0.62, n);
    vec3 cc = mix(vec3(0.04, 0.043, 0.056) * (0.5 + 0.8 * n2), vec3(0.006, 0.0065, 0.009), mass * 0.85);
    c = mix(c, cc, smoothstep(-0.02, 0.06, y) * 0.92);
  }
  float az = atan(rd.x, rd.z);
  float ridge = 0.008 + 0.014 * fbm(vec2(az * 4.0, 3.0), 4);
  c = mix(c, vec3(0.005, 0.0055, 0.007), smoothstep(ridge + 0.0015, ridge - 0.0015, y));
  return c;
}

vec3 lightH(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, float sss) {
  vec3 col = vec3(0);
  float a = max(0.04, rough * rough), a2 = a * a;
  float ao = aoH(p, n);
  float dk = deckOf(p.y);
  col += alb * vec3(0.03, 0.02, 0.012) * ao;                      // the warm, dim fill of the hold
  float kx = floor((p.x - 3.2) / 6.4 + 0.5);
  for (int j = -1; j <= 1; j++) {
    for (int e = -1; e <= 1; e++) {
      float dd2 = dk + float(e);
      if (dd2 < 0.0 || dd2 > 2.0) continue;
      vec3 lp = lampPos(kx + float(j), dd2) + vec3(0.0, 0.07, 0.0);
      vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
      // a lamp on another deck reaches only through the well
      float through = dd2 == dk ? 1.0 : 0.12 * smoothstep(4.0, 1.5, max(abs(p.x) - 2.4, abs(p.z) - 2.0));
      if (through < 0.01) continue;
      float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 7.0, kx + float(j) + dd2 * 9.0));
      float sh = (j == 0 && e == 0) ? softH(p + n * 0.04, L, sqrt(d2) - 0.15) : 1.0;
      float nl = sat(dot(n, L)) * (1.0 - sss) + sss * (0.5 + 0.5 * dot(n, L));
      vec3 h = normalize(L + v); float nh = sat(dot(n, h)); float dd = nh * nh * (a2 - 1.0) + 1.0;
      col += LAMPC * 9.0 * fl * through * sh / (0.6 + d2) * nl * (alb / PI + 0.04 * a2 / (PI * dd * dd)) * (0.6 + 0.4 * ao);
    }
  }
  // the night at the window strip: a faint cold light on what is near it
  vec3 wp = vec3(p.x, 13.05, 2.55 * sign(p.z + 1e-4));
  vec3 Lw = wp - p; float dw = dot(Lw, Lw); Lw *= inversesqrt(dw);
  col += alb * vec3(0.05, 0.06, 0.08) * sat(dot(n, Lw)) / (1.0 + dw) * 0.6;
  return col;
}

vec3 hold(vec2 fc) {
  vec3 ro; vec3 rd0 = camRay(fc, ro);
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  vec3 rd = normalize(fp - ro);

  float mat; float t = marchH(ro, rd, mat);
  vec3 col; float T = t > 0.0 ? t : 90.0;
  if (t > 0.0) {
    vec3 p = ro + rd * t, n = normH(p), v = -rd;
    vec3 alb; float rough = 0.7, sss = 0.0; vec3 emit = vec3(0); float spec = 0.1;
    if (mat < 1.5) {
      // fired clay: terracotta with a slip band and a rope pattern, dust on the shoulders
      float band = smoothstep(0.47, 0.49, abs(fract(p.y * 1.4 + 0.3) - 0.5)) * step(0.5, fract(p.y * 0.7 + 0.15));
      alb = vec3(0.46, 0.3, 0.19) * (0.88 + 0.18 * fbm(p * vec3(3.0, 1.5, 3.0), 3)) * (0.88 + 0.24 * vnoise(p * 40.0));
      alb = mix(alb, vec3(0.2, 0.1, 0.06), band * 0.6);
      alb = mix(alb, vec3(0.45, 0.4, 0.33), smoothstep(0.6, 0.9, n.y) * 0.4);
      rough = 0.75;
    } else if (mat < 2.5) {
      // woven reed
      vec2 wv = vec2(atan(p.z, p.x) * 20.0, p.y * 40.0);
      float weave = abs(sin(wv.x + 3.0 * step(0.5, fract(wv.y / 6.2832)))) * 0.5 + 0.5;
      alb = vec3(0.32, 0.22, 0.11) * weave; rough = 0.8;
    } else if (mat < 3.5) { alb = vec3(0.12, 0.05, 0.06) * (0.6 + 0.5 * vnoise(p * 40.0)); rough = 0.4; spec = 0.4; sss = 0.3; }     // figs
    else if (mat < 4.5) { alb = vec3(0.2, 0.08, 0.03) * (0.6 + 0.5 * vnoise(p * 50.0)); rough = 0.25; spec = 0.6; }                  // dates
    else if (mat < 5.5) { alb = vec3(0.5, 0.36, 0.15) * (0.6 + 0.5 * vnoise(p * vec3(60.0, 4.0, 60.0))); rough = 0.7; sss = 0.35; }  // wheat
    else if (mat < 6.5) { alb = vec3(0.08, 0.06, 0.035); rough = 0.2; spec = 0.8; }                                              // glazed oil jars
    else if (mat < 7.5) { alb = vec3(0.25, 0.2, 0.12); rough = 0.9; }
    else if (mat < 8.5) { alb = vec3(0.2, 0.16, 0.1); rough = 0.9; }
    else if (mat < 9.5) { alb = vec3(0.22, 0.09, 0.03) * (0.6 + 0.6 * vnoise(p * 60.0)); rough = 0.5; spec = 0.3; sss = 0.3; }       // dried fruit
    else if (mat < 10.5 || (mat > 19.5 && mat < 20.5)) {
      // honey cedar: planks and grain
      float gr = abs(n.y) > 0.5 || abs(n.z) > 0.5 ? fbm(vec2(p.x * 0.35, (p.y + p.z) * 7.0), 4) : fbm(vec2(p.z * 0.35, p.y * 7.0), 4);
      alb = vec3(0.26, 0.16, 0.085) * (0.6 + 0.55 * gr) * (0.85 + 0.3 * vnoise(p.xz * 1.5 + p.y));
      if (abs(n.y) > 0.7) alb *= 1.0 - 0.5 * smoothstep(0.46, 0.5, abs(fract(p.z / 0.28) - 0.5));
      else alb *= 1.0 - 0.45 * smoothstep(0.46, 0.5, abs(fract(p.y / 0.26) - 0.5));
      rough = 0.65; spec = 0.2;
    } else if (mat < 11.5) {
      float acc = 0.0;
      for (int i = 0; i < 4; i++) { vec2 q = rot(float(i) * 1.9 + 0.8 * vnoise(p.xz * 1.7 + float(i) * 3.0)) * p.xz + float(i) * 2.7; vec2 c = vec2(q.x * 6.0, q.y * 70.0); float l = pow(1.0 - abs(2.0 * fract(c.y) - 1.0), 3.0) * step(0.35, hash12(floor(c) + float(i) * 9.0)) * smoothstep(0.0, 0.2, fract(c.x)) * smoothstep(1.0, 0.8, fract(c.x)); acc = max(acc * 0.85, l); }
      alb = mix(vec3(0.05, 0.035, 0.02), vec3(0.28, 0.2, 0.1), acc); rough = 0.85; sss = 0.2;
    } else if (mat < 12.5) { alb = vec3(0.05, 0.038, 0.028) * (0.7 + 0.6 * vnoise(p * 7.0)); rough = 0.9; sss = 0.25; }     // asleep, in shadow
    else if (mat < 13.5) { alb = vec3(0.05, 0.045, 0.04); rough = 0.8; sss = 0.2; }        // roosting birds
    else if (mat < 21.5) {
      // the pitch outside
      alb = vec3(0.014, 0.012, 0.01); rough = 0.3; spec = 0.6;
    } else {
      alb = vec3(0.35, 0.18, 0.09); rough = 0.7; emit = vec3(1.0, 0.5, 0.2) * 0.4;
    }
    if (mat > 20.5 && mat < 21.5) {
      // outside the hull: the night and the window's glow
      col = alb * vec3(0.05, 0.055, 0.07) * (0.5 + 0.5 * n.y);
      float wg = exp(-abs(abs(p.z) - 2.6) * 2.0) * exp(-abs(p.y - 13.05) * 3.0);
      col += alb * LAMPC * wg * 2.0;
      vec3 rr = reflect(rd, n);
      col += skyH(rr) * (0.04 + 0.5 * pow(1.0 - sat(dot(n, v)), 5.0)) * 0.6;
    } else {
      col = emit + lightH(p, n, v, alb, rough, sss);
    }
    col = mix(col, vec3(0.012, 0.008, 0.005), 1.0 - exp(-t * 0.025));
  } else {
    col = skyH(rd);
  }
  // the flames and their halos in the dusty air
  float kx0 = floor((ro.x - 3.2) / 6.4 + 0.5);
  for (int j2 = -4; j2 <= 4; j2++) {
    for (int dk = 0; dk < 3; dk++) {
      vec3 lp = lampPos(kx0 + float(j2), float(dk)) + vec3(0.0, 0.05, 0.0);
      vec3 oc = lp - ro; float tc = dot(oc, rd);
      if (tc <= 0.0) continue;
      float h2 = max(dot(oc, oc) - tc * tc, 1e-6); float hh = sqrt(h2);
      float fl = 0.85 + 0.15 * vnoise(vec2(uTime * 9.0, float(j2) * 4.0 + float(dk) * 11.0));
      if (tc < T + 0.1) {
        vec3 q = ro + rd * tc - lp;
        vec2 f = vec2(length(vec2(q.x, q.z)), q.y);
        float flame = exp(-pow(f.x / (0.012 * (1.0 - sat(f.y / 0.07)) + 0.002), 2.0)) * smoothstep(-0.01, 0.0, f.y) * smoothstep(0.075, 0.02, f.y);
        float dist = length(oc);
        col += vec3(1.0, 0.72, 0.42) * (flame * 30.0 + 0.3 * exp(-hh / 0.05)) * fl;
      }
      // dusty haze lit by the lamp (only on its own deck, roughly)
      float g = (atan((min(T, 40.0) - tc) / hh) + atan(tc / hh)) / hh;
      col += LAMPC * g * 0.0014 * fl;
    }
  }
  // motes of chaff drifting in the lamplight
  vec3 mp = ro + rd * min(T, 3.0);
  for (int i = 0; i < 2; i++) {
    float sc = 6.0 + 4.0 * float(i);
    vec3 q = (ro + rd * (1.0 + float(i) * 1.2)) * sc + vec3(0.0, uTime * 0.3, uTime * 0.15);
    vec3 id = floor(q); vec3 f = fract(q) - 0.5;
    vec3 o = hash33(id) - 0.5;
    float d = length(f - o * 0.6);
    col += vec3(1.0, 0.7, 0.4) * smoothstep(0.03, 0.0, d) * step(0.85, hash13(id + 3.0)) * 0.08 * step(1.0 + float(i) * 1.2, T);
  }
  return col * uExpo;
}
`;
