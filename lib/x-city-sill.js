// A window in the valley city at dusk (s02-daughters). A deep opening in a mud-brick wall, its inner
// face banded in bronze with studs. On the sill: a polished bronze hand-mirror leaning on the jamb,
// two gold earrings with drops, a comb of bone, a clay oil lamp burning. In the room, close to the
// lens, a warp-weighted loom: crimson cloth half-woven at the top, the warp threads running down.
// Outside, the city at dusk: walls and towers in silhouette, forge fires, smoke, and high in the
// violet sky one cold star-white light (the Watchers' light) that catches the bronze and the gold
// as if the gifts came from it. Sill surface y = 0, wall from z = 0 (room side) to z = 0.7.
export const SILL_GLSL = /* glsl */ `
const vec3 MIRC = vec3(0.3, 0.13, 0.3);     // mirror centre
const vec3 LAMP = vec3(-0.27, 0.0, 0.12);
vec3 lampFlame() { return LAMP + vec3(0.055, 0.03, 0.0); }
// the cold light: far outside, high on the left
const vec3 COLDDIR = vec3(-0.2, 0.2, 0.96);
vec3 coldLight() { return vec3(0.75, 0.85, 1.0) * (0.95 + 0.05 * sin(uTime * 1.3)); }

mat3 mirrorFrame() {
  // the disc leans back against the right jamb, turned to face the room and the window
  vec3 n = normalize(vec3(-0.68, 0.06, -0.73));
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n));
  vec3 v = cross(n, u);
  return mat3(u, v, n);
}

// id: 1 wall (mud-brick), 2 bronze band/studs, 3 mirror back/rim, 4 mirror face, 5 gold, 6 bone,
//     7 clay lamp, 8 loom timber, 9 cloth, 10 warp thread
float mapS(vec3 p, out float id) {
  // wall with the opening
  float wall = sdBox(p - vec3(0.0, 0.0, 0.35), vec3(4.0, 3.0, 0.35));
  float hole = sdBox(p - vec3(0.0, 0.58, 0.35), vec3(0.46, 0.58, 0.5));
  float d = max(wall, -hole);
  // the sill's worn plaster edge
  d -= 0.004 * fbm(p.xz * 30.0 + p.y * 20.0, 2);
  id = 1.0;
  // bronze band round the opening on the room face, studded
  float bandO = sdBox(p - vec3(0.0, 0.58, -0.006), vec3(0.58, 0.7, 0.008));
  float bandI = sdBox(p - vec3(0.0, 0.58, -0.006), vec3(0.47, 0.59, 0.02));
  float band = max(bandO, -bandI);
  band = max(band, -p.y - 0.12);
  vec2 sp = vec2(abs(p.x) > 0.5 ? 0.0 : mod(p.x + 0.04, 0.08) - 0.04, abs(p.x) > 0.5 ? mod(p.y + 0.04, 0.08) - 0.04 : 0.0);
  vec3 sq = vec3(abs(p.x) > 0.5 ? abs(p.x) - 0.525 : sp.x, abs(p.x) > 0.5 ? sp.y : abs(p.y - 0.58) - 0.645, p.z + 0.016);
  float stud = length(sq) - 0.011;
  band = min(band, max(stud, max(bandO, -p.y - 0.12)));
  if (band < d) { d = band; id = 2.0; }
  // the mirror: a thin disc with a rim, a short handle at the bottom
  vec3 q = transpose(mirrorFrame()) * (p - MIRC);
  float disc = max(length(q.xy) - 0.11, abs(q.z) - 0.004);
  float rim = max(abs(length(q.xy) - 0.112) - 0.006, abs(q.z) - 0.007);
  float handle = sdCapsule(q, vec3(0.0, -0.115, 0.0), vec3(0.0, -0.175, 0.0), 0.011);
  float mback = min(rim, handle);
  if (mback < d) { d = mback; id = 3.0; }
  if (disc < d) { d = disc; id = q.z < 0.0 ? 3.0 : 4.0; if (q.z > 0.0 && length(q.xy) < 0.106) id = 4.0; }
  // gold earrings: two rings lying on the sill, each with a drop
  if (length(p - vec3(0.1, 0.0, 0.06)) < d + 0.12) for (int i = 0; i < 2; i++) {
    vec3 c = i == 0 ? vec3(0.07, 0.0045, 0.075) : vec3(0.14, 0.0045, 0.05);
    vec3 e = p - c; e.xz = rot(float(i) * 1.7 + 0.3) * e.xz;
    float ring = sdTorusY(e, 0.027, 0.0042);
    float drop = sdEllipsoid(e - vec3(0.047, 0.005, 0.0), vec3(0.015, 0.0085, 0.011));
    float g = min(ring, drop);
    if (g < d) { d = g; id = 5.0; }
  }
  // the bone comb: a spine and fine teeth
  if (length(p - vec3(-0.06, 0.0, 0.1)) < d + 0.1) {
    vec3 c = (p - vec3(-0.06, 0.0055, 0.1)) / 1.35; c.xz = rot(0.35) * c.xz;
    float spine = sdBox(c - vec3(0.0, 0.0, -0.012), vec3(0.05, 0.004, 0.009)) - 0.002;
    vec3 tq = c; tq.x = mod(tq.x + 0.0025, 0.005) - 0.0025;
    float teeth = sdBox(tq - vec3(0.0, -0.001, 0.008), vec3(0.0011, 0.0022, 0.013));
    teeth = max(teeth, abs(c.x) - 0.048);
    float comb = min(spine, teeth) * 1.35;
    if (comb < d) { d = comb; id = 6.0; }
  }
  // the clay lamp: a round body, a pinched nozzle, a little handle
  {
    vec3 c = p - LAMP;
    float body = sdEllipsoid(c - vec3(0.0, 0.02, 0.0), vec3(0.045, 0.022, 0.04));
    float noz = sdCapsule(c, vec3(0.0, 0.022, 0.0), vec3(0.052, 0.027, 0.0), 0.012);
    float lamp = smin(body, noz, 0.01);
    lamp = max(lamp, -(length(c - vec3(0.0, 0.05, 0.0)) - 0.014));
    if (lamp < d) { d = lamp; id = 7.0; }
  }
  // the loom in the room, close to the lens on the left: two posts, the cloth beam, the woven
  // crimson cloth at the top and the warp threads hanging below it
  {
    float lz = -0.45;
    if (abs(p.z - lz) > d + 0.05) return d;
    float posts = sdBox(p - vec3(-0.86, 0.0, lz), vec3(0.022, 1.4, 0.022));
    float beam = sdCapsule(p, vec3(-0.88, 0.44, lz), vec3(-0.2, 0.44, lz), 0.025);
    float timber = min(posts, beam);
    if (timber < d) { d = timber; id = 8.0; }
    float cloth = sdBox(p - vec3(-0.55, 0.3, lz), vec3(0.32, 0.13, 0.004 + 0.0015 * sin(p.y * 160.0)));
    if (cloth < d) { d = cloth; id = 9.0; }
    // warp threads below the woven edge, each with a slight sway
    vec3 w = p - vec3(0.0, 0.0, lz);
    float sx = 0.0045;
    float cell = floor(w.x / sx);
    w.z += 0.0025 * sin(uTime * 0.8 + cell * 0.7) * smoothstep(0.17, -0.5, w.y);
    w.x = mod(w.x, sx) - sx * 0.5;
    float thr = length(w.xz) - 0.00055;
    thr = max(thr, max(p.y - 0.175, -p.y - 0.7));
    thr = max(thr, max(-p.x - 0.86, p.x + 0.23));
    if (thr < d) { d = thr; id = 10.0; }
  }
  return d;
}
float mapSd(vec3 p) { float i; return mapS(p, i); }
vec3 normS(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.0002 + 0.0002 * t);
  return normalize(e.xyy * mapSd(p + e.xyy) + e.yyx * mapSd(p + e.yyx) + e.yxy * mapSd(p + e.yxy) + e.xxx * mapSd(p + e.xxx));
}
float marchS(vec3 ro, vec3 rd, float tmax, out float id) {
  float t = 0.01;
  for (int i = 0; i < 160; i++) {
    float d = mapS(ro + rd * t, id);
    if (abs(d) < 0.00015 * t + 0.00003) return t;
    t += d * 0.85;
    if (t > tmax) break;
  }
  id = -1.0; return tmax;
}
float shadowS(vec3 p, vec3 L, float maxt) {
  float s = 1.0, t = 0.004;
  for (int i = 0; i < 22; i++) {
    float d = mapSd(p + L * t);
    s = min(s, 14.0 * d / t);
    t += clamp(d, 0.004, 0.1);
    if (s < 0.01 || t > maxt) break;
  }
  return sat(s);
}

// the world outside the window: dusk sky, the cold light, the city in silhouette with its fires
vec3 outside(vec3 rd) {
  float y = rd.y;
  vec3 c = mix(vec3(0.2, 0.12, 0.2), vec3(0.04, 0.045, 0.08), smoothstep(-0.05, 0.5, y));
  c += vec3(0.5, 0.16, 0.06) * exp(-max(y + 0.02, 0.0) * 14.0) * 0.6;        // the glow of the city's fires on the haze
  // clouds
  vec2 cp = rd.xz / max(y + 0.15, 0.05) + vec2(uTime * 0.02, 0.0);
  float cl = fbm(cp * 1.5, 4);
  c = mix(c, vec3(0.06, 0.045, 0.07) + vec3(0.3, 0.09, 0.03) * smoothstep(0.3, 0.0, y), smoothstep(0.45, 0.75, cl) * smoothstep(-0.02, 0.1, y) * 0.8);
  // the cold light: a star-white point with a soft halo
  float cd = dot(rd, normalize(COLDDIR));
  c += coldLight() * (pow(sat(cd), 4000.0) * 0.25 + pow(sat(cd), 400.0) * 0.04 + pow(sat(cd), 40.0) * 0.012);   // the faint halo (the point itself is drawn sharp, below)
  // the city skyline: walls and towers
  float az = atan(rd.x, rd.z);
  float bi = floor(az * 14.0);
  float hb = -0.015 + 0.03 * hash11(bi) + 0.008 * vnoise(vec2(az * 60.0, 2.0));
  float tw = step(0.78, hash11(bi + 7.0)) * step(abs(fract(az * 14.0) - 0.5), 0.12 + 0.2 * hash11(bi + 4.0));
  hb += 0.06 * tw * (0.5 + 0.5 * hash11(bi + 9.0));
  hb += 0.006 * step(0.5, fract(az * 300.0)) * (1.0 - tw);   // crenellations
  if (y < hb) {
    c = vec3(0.014, 0.01, 0.011);
    // a few lit windows and the mouths of forges
    vec2 g = vec2(az * 160.0, y * 160.0);
    vec2 id = floor(g), f = fract(g) - 0.5;
    float h = hash12(id);
    if (h > 0.965) c += vec3(1.0, 0.45, 0.12) * smoothstep(0.3, 0.1, length(f)) * (1.0 + 2.0 * hash11(h * 31.0)) * (0.85 + 0.2 * sin(uTime * 3.0 + h * 50.0));
    float forge = smoothstep(0.75, 0.95, vnoise(vec2(az * 25.0, 3.0))) * smoothstep(hb - 0.03, hb - 0.005, y) * smoothstep(-0.03, -0.01, y);
    c += vec3(1.0, 0.32, 0.07) * forge * 1.2;
    c += vec3(0.6, 0.15, 0.04) * 0.25 * smoothstep(hb - 0.06, hb, y) * (0.5 + fbm(vec2(az * 20.0, 1.0), 2));
  }
  // smoke columns over the city
  float sm = smoothstep(0.6, 0.85, fbm(vec2(az * 9.0, y * 3.0 - uTime * 0.1), 4)) * smoothstep(0.45, 0.0, y) * smoothstep(hb - 0.01, hb + 0.05, y);
  c = mix(c, vec3(0.03, 0.02, 0.025) + vec3(0.2, 0.06, 0.02) * smoothstep(0.2, 0.0, y), sm * 0.6);
  return c;
}

vec3 shadeS(vec3 p, vec3 n, vec3 rd, float id, bool cheap, out vec3 refl, out float reflK) {
  vec3 v = -rd; vec3 alb; float rough = 0.8, metal = 0.0; vec3 emit = vec3(0);
  refl = vec3(0); reflK = 0.0;
  if (id == 1.0) {
    vec2 uv = abs(n.z) > 0.6 ? p.xy : abs(n.x) > 0.6 ? p.zy : p.xz;
    alb = mudAlb(p, uv * 1.0) * 0.9;
    // the sill: worn smooth, paler, with fine dust
    if (n.y > 0.7) alb = vec3(0.5, 0.4, 0.3) * (0.75 + 0.35 * fbm(p.xz * 40.0, 4));
    n = bumpN(p, n, 60.0, 0.12);
  } else if (id == 2.0 || id == 3.0) {
    alb = bronzeAlb(p * 8.0, rough); metal = 1.0; rough = max(rough, 0.3);
  } else if (id == 4.0) {
    // the polished bronze face
    alb = vec3(0.92, 0.66, 0.4); metal = 1.0; rough = 0.06 + 0.04 * fbm(p.xy * 80.0, 2);
  } else if (id == 5.0) {
    alb = vec3(1.0, 0.77, 0.36); metal = 1.0; rough = 0.12;
  } else if (id == 6.0) {
    alb = vec3(0.82, 0.76, 0.62) * (0.85 + 0.2 * fbm(p.xz * 300.0, 2)); rough = 0.45;
  } else if (id == 7.0) {
    alb = vec3(0.55, 0.3, 0.17) * (0.8 + 0.3 * fbm(p.xz * 200.0, 3)); rough = 0.75;
  } else if (id == 8.0) {
    alb = vec3(0.3, 0.19, 0.1) * (0.7 + 0.5 * fbm(vec2(p.x * 20.0, p.y * 200.0), 3)); rough = 0.6;
  } else if (id == 9.0) {
    // crimson wool, woven: weft rows and warp lines
    float weave = 0.75 + 0.25 * sin(p.y * 900.0) * sin(p.x * 570.0 + 1.0);
    alb = vec3(0.66, 0.06, 0.05) * weave * (0.8 + 0.3 * fbm(p.xy * 30.0, 3));
    // a border of gold-ochre at the woven edge
    alb = mix(alb, vec3(0.6, 0.38, 0.08) * weave, smoothstep(0.205, 0.2, p.y) * smoothstep(0.175, 0.18, p.y));
    rough = 0.9;
  } else {
    alb = vec3(0.38, 0.08, 0.06); rough = 0.9;
  }
  vec3 col = emit;
  // the oil lamp: warm, soft-shadowed, flickering
  vec3 lp = lampFlame() + vec3(0.0, 0.015, 0.0);
  vec3 L = lp - p; float d2 = dot(L, L); float dl = sqrt(d2); L /= dl;
  float sh = cheap ? 1.0 : shadowS(p + n * 0.0015, L, dl - 0.01);
  col += brdf(n, v, L, alb, rough, metal, vec3(1.0, 0.55, 0.22) * flick(3.0) * 0.06 / d2) * sh;
  // the cold light from outside, through the opening only
  vec3 Lc = normalize(COLDDIR);
  float shc = cheap ? 1.0 : shadowS(p + n * 0.0015, Lc, 2.0);
  col += brdf(n, v, Lc, alb, rough, metal, coldLight() * 0.9) * shc;
  // the forge glow from the city below the window
  vec3 Lf = normalize(vec3(0.15, 0.05, 1.0));
  float shf = shc;
  col += brdf(n, v, Lf, alb, rough, metal, vec3(1.0, 0.35, 0.1) * 0.35) * shf;
  // a hearth somewhere behind us in the room: a low warm fill, unseen
  {
    vec3 hp = vec3(-0.95, 0.05, -1.35);
    vec3 Lh = hp - p; float dh2 = dot(Lh, Lh); Lh *= inversesqrt(dh2);
    col += brdf(n, v, Lh, alb, rough, metal, vec3(1.0, 0.42, 0.16) * flick(9.0) * 0.9 / dh2);
  }
  // dim violet sky fill through the window
  col += alb * (1.0 - metal) * vec3(0.03, 0.025, 0.045) * sat(0.5 + 0.5 * n.z) * smoothstep(-0.2, 0.3, p.z + 0.2);
  // polished gold sees the lamplit sill and the pale sky all round it
  if (id == 5.0) col += alb * (vec3(1.0, 0.6, 0.3) * 0.22 * flick(3.0) * (0.4 + 0.6 * sat(-n.x + 0.3)) + coldLight() * 0.12 * sat(n.y + 0.2));
  if (id == 6.0) col += alb * vec3(1.0, 0.6, 0.3) * 0.05;
  if (metal > 0.5) { refl = fresnelR(n, v, alb, metal) * (1.0 - rough); reflK = 1.0; }
  return col;
}

vec3 citySill(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float id; float t = marchS(ro, rd, 30.0, id);
  vec3 col;
  if (id > 0.0) {
    vec3 p = ro + rd * t, n = normS(p, t);
    vec3 refl; float rk;
    col = shadeS(p, n, rd, id, false, refl, rk);
    if (rk > 0.0) {
      // one bounce: polished bronze and gold see the room, the lamp, the window and the city
      vec3 rr = reflect(rd, n);
      float id2; float t2 = marchS(p + n * 0.002, rr, 2.0, id2);
      vec3 rc;
      if (id2 > 0.0) { vec3 p2 = p + n * 0.002 + rr * t2; vec3 n2 = normS(p2, t2); vec3 r2; float k2; rc = shadeS(p2, n2, rr, id2, true, r2, k2); }
      else rc = rr.z > 0.0 ? outside(rr) : vec3(0.03, 0.016, 0.01) * (0.6 + 0.4 * fbm(rr.xy * 4.0, 2));
      rc += flame(p + n * 0.002, rr, lampFlame(), 0.045, 0.7, 2.0, t2, 6.0);
      col += rc * refl;
    }
  } else {
    col = rd.z > 0.0 ? outside(rd) : vec3(0.004, 0.003, 0.003);
    // the cold light: a small hard point, never defocused (it is a star, not a disc)
    float cd0 = dot(rd0, normalize(COLDDIR));
    col += coldLight() * smoothstep(0.999992, 0.999999, cd0) * 60.0;
  }
  // the lamp flame and its glow in the dusty air
  col += flame(ro, rd, lampFlame(), 0.05, 0.7, 2.0, t, 7.0);
  col += vec3(1.0, 0.55, 0.22) * flick(3.0) * glowLine(ro, rd, lampFlame() + vec3(0.0, 0.02, 0.0), t) * 0.00025;
  // fine dust in the lamplight and the shaft of cold light
  {
    vec3 acc = vec3(0);
    for (int i = 0; i < 6; i++) {
      float pl = -0.3 + float(i) * 0.09;
      float tt = (pl - ro.z) / rd.z;
      if (tt <= 0.0 || tt > t) continue;
      vec3 q = ro + rd * tt;
      vec2 g = q.xy / 0.012 + vec2(uTime * 0.12 + float(i) * 3.1, -uTime * 0.18 + sin(uTime * 0.3 + float(i)) * 0.6);
      vec2 cid = floor(g), f = fract(g) - 0.5;
      float h = hash12(cid + float(i) * 17.0);
      if (h > 0.012) continue;
      vec2 o = (hash22(cid) - 0.5) * 0.6;
      float r = length(f - o);
      vec3 Lq = lampFlame() - q;
      float lit = 0.0006 / dot(Lq, Lq) + 0.25 * smoothstep(0.0, 0.3, q.z + 0.3);
      acc += mix(vec3(1.0, 0.6, 0.3), vec3(0.8, 0.88, 1.0), smoothstep(-0.2, 0.2, q.z)) * smoothstep(0.2, 0.0, r) * lit * 0.35;
    }
    col += acc;
  }
  return col;
}
`;
