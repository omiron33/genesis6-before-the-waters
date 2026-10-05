// A street of the valley city at full night (s22-corrupt). Paved with worn stone slabs between
// mud-brick houses on cyclopean footings, torches in iron baskets down both sides, bronze idols on
// pillars (horned crescents and sun-discs, never a figure), black smoke overhead, embers. Along the
// street the evidence of what the city has become, with no one in it: bronze manacles and a chain
// hanging from a post, a merchant's scales tipped by false weights, a bloodied bronze blade dropped
// on a threshold, a horned altar smashed. At the end of the street a furnace mouth in a cyclopean
// wall burns crimson. Street along +z, centre x = 0, ground y = 0. (Screen-left is +x when the
// camera looks down +z.)
export const STREET_GLSL = /* glsl */ `
const float SW = 5.0;            // half width of the street
const float FURZ = 98.0;         // the furnace wall across the end of the street
const vec3 CHAIN = vec3(1.7, 0.0, 81.0);
const vec3 SCALES = vec3(-3.5, 0.0, 57.0);
const vec3 BLADE = vec3(-0.9, 0.03, 78.6);
const vec3 ALTAR = vec3(2.9, 0.0, 45.0);
vec3 furnaceCol() { return vec3(1.0, 0.16, 0.05) * (1.0 + 0.15 * vnoise(vec2(uTime * 2.5, 4.0))); }

float bHash(float side, float b) { return hash11(b * 3.7 + side * 11.0); }
// facade distance for one side (side = +1 or -1), with doorways
float facade(vec3 p, float side, out float doorway) {
  float b = floor(p.z / 9.0);
  float zc = (b + 0.5) * 9.0;
  float off = 0.5 * bHash(side, b);
  float h = 6.5 + 7.0 * bHash(side, b + 40.0);
  float x = side * p.x;                               // distance across, positive toward this side
  float wall = (SW + off) - x;                        // > 0 in the street, < 0 inside the houses
  wall = max(wall, p.y - h);
  // a doorway in each house, a little off centre
  vec3 dq = vec3(x - (SW + off), p.y - 1.3, p.z - zc - 1.5 * (bHash(side, b + 7.0) - 0.5));
  float door = sdBox(dq, vec3(0.9, 1.3, 0.85));
  doorway = door;
  wall = max(wall, -door);
  // a small high window
  vec3 wq = vec3(x - (SW + off), p.y - 4.2, p.z - zc + 2.4);
  wall = max(wall, -sdBox(wq, vec3(0.5, 0.35, 0.3)));
  // roof beams (vigas) sticking out under the parapet
  vec3 vq = vec3(x - (SW + off) + 0.3, p.y - h + 0.7, mod(p.z, 0.9) - 0.45);
  wall = min(wall, max(sdCapsule(vq, vec3(-0.6, 0.0, 0.0), vec3(0.3, 0.0, 0.0), 0.09), abs(p.z - zc) - 4.3));
  // the cyclopean footing stands a little proud
  float foot = max(-(x - (SW + off) + 0.25), p.y - 1.6);
  wall = min(wall, max(foot, abs(p.z - zc) - 4.5));
  return wall;
}
float sdTorusZ2(vec3 p, float R, float r) { return length(vec2(length(p.xy) - R, p.z)) - r; }
float sdTorusX(vec3 p, float R, float r) { return length(vec2(length(p.yz) - R, p.x)) - r; }

// id: 1 paving, 2 mud-brick, 3 footing stone, 4 bronze, 5 iron, 6 timber, 7 altar stone, 8 blade
float mapT(vec3 p, out float id) {
  float d = p.y; id = 1.0;
  // a shallow gutter down the middle
  d += 0.06 * smoothstep(0.5, 0.0, abs(p.x));
  float dw;
  float fa = facade(p, 1.0, dw);
  float fb = facade(p, -1.0, dw);
  float f = min(fa, fb);
  if (f < d) { d = f; id = p.y < 1.6 && abs(abs(p.x) - SW) < 0.9 ? 3.0 : 2.0; }
  // the furnace wall across the end
  float fw = FURZ - p.z;
  float mouth = sdBox(p - vec3(0.0, 2.6, FURZ), vec3(2.4, 2.6, 3.0));
  mouth = min(mouth, length((p - vec3(0.0, 5.2, FURZ)).xy) - 2.4 + max(0.0, abs(p.z - FURZ) - 3.0));
  fw = max(fw, -mouth);
  if (fw < d) { d = fw; id = 3.0; }
  // torch baskets (both sides, every 8 m)
  {
    float k = floor((p.z - 4.0) / 8.0 + 0.5);
    vec3 q = vec3(abs(p.x) - (SW - 0.35), p.y - 3.1, p.z - (4.0 + k * 8.0));
    float bask = max(length(q * vec3(1.0, 1.5, 1.0)) - 0.28, q.y - 0.06);
    bask = max(bask, -(length(q * vec3(1.0, 1.5, 1.0)) - 0.23));
    float arm = sdCapsule(q, vec3(0.0, -0.15, 0.0), vec3(0.4, -0.55, 0.0), 0.035);
    float tb = min(bask, arm);
    if (tb < d) { d = tb; id = 5.0; }
  }
  // bronze idols on pillars: a horned crescent or a sun-disc on a shaft, never a figure
  for (int i = 0; i < 4; i++) {
    vec3 c0 = i == 0 ? vec3(-3.7, 0.0, 20.5) : i == 1 ? vec3(3.8, 0.0, 33.0) : i == 2 ? vec3(-3.8, 0.0, 45.0) : vec3(3.7, 0.0, 63.0);
    float bnd = length(p - c0 - vec3(0.0, 2.6, 0.0)) - 3.0;
    if (bnd > d) continue;
    vec3 c = i == 0 ? vec3(-3.7, 0.0, 20.5) : i == 1 ? vec3(3.8, 0.0, 33.0) : i == 2 ? vec3(-3.8, 0.0, 45.0) : vec3(3.7, 0.0, 63.0);
    vec3 q = p - c;
    float base = sdBox(q - vec3(0.0, 0.4, 0.0), vec3(0.55, 0.4, 0.55));
    float shaft = max(length(q.xz) - 0.17 + 0.02 * q.y / 3.6, abs(q.y - 2.2) - 1.8);
    float top;
    if (i == 1 || i == 3) {
      vec3 t = q - vec3(0.0, 4.4, 0.0);
      top = max(sdTorusX(t, 0.75, 0.11), -t.y - 0.05);        // horns: the upper half of a ring
    } else {
      vec3 t = q - vec3(0.0, 4.6, 0.0);
      top = max(length(t.yz) - 0.6, abs(t.x) - 0.05) - 0.02;  // a sun-disc
    }
    float st = min(shaft, top);
    if (base < d) { d = base; id = 3.0; }
    if (st < d) { d = st; id = 4.0; }
  }
  // the chain post: a timber post, a hook, a chain hanging, bronze manacles at its foot
  if (length(p - CHAIN - vec3(-0.3, 1.4, 0.0)) - 2.0 < d) {
    vec3 q = p - CHAIN;
    float post = max(length(q.xz) - 0.16, abs(q.y - 1.4) - 1.4);
    post = min(post, sdBox(q - vec3(-0.25, 2.5, 0.0), vec3(0.3, 0.06, 0.06)));   // the arm the chain hangs from
    if (post < d) { d = post; id = 6.0; }
    float ch = 1e9;
    for (int i = 0; i < 16; i++) {
      float fi = float(i);
      vec3 lc = vec3(-0.48, 2.38 - fi * 0.14, 0.02 * sin(fi * 0.9 + uTime * 0.7) * fi * 0.1);
      vec3 lq = q - lc;
      float l = mod(fi, 2.0) < 0.5 ? sdTorusZ2(lq * vec3(1.0, 0.7, 1.0), 0.065, 0.016) : sdTorusX(lq * vec3(1.0, 0.7, 1.0), 0.065, 0.016);
      ch = min(ch, l);
    }
    // the manacles lying open on the paving
    vec3 m1 = q - vec3(-0.48, 0.2, 0.0), m2 = q - vec3(-0.75, 0.035, -0.25);
    float man = min(sdTorusZ2(m1 * vec3(1.0, 1.0, 1.0), 0.11, 0.03), sdTorusY(m2, 0.11, 0.03));
    man = min(man, sdCapsule(q, vec3(-0.48, 0.32, 0.0), vec3(-0.68, 0.04, -0.15), 0.014));
    float b = min(ch, man);
    if (b < d) { d = b; id = 4.0; }
  }
  // the merchant's table and scales, tipped by false weights
  if (length(p - SCALES - vec3(0.0, 1.0, 0.0)) - 1.5 < d) {
    vec3 q = p - SCALES;
    float table = sdBox(q - vec3(0.0, 0.45, 0.0), vec3(0.7, 0.45, 0.5)) - 0.03;
    if (table < d) { d = table; id = 3.0; }
    float stand = sdCapsule(q, vec3(0.0, 0.9, 0.0), vec3(0.0, 1.75, 0.0), 0.03);
    vec3 bq = q - vec3(0.0, 1.75, 0.0); bq.yz = rot(-0.32) * bq.yz;
    float beam = sdCapsule(bq, vec3(0.0, 0.0, -0.55), vec3(0.0, 0.0, 0.55), 0.022);
    vec3 e1 = vec3(0.0, 1.75, 0.0) + vec3(0.0, -sin(0.32) * 0.55, cos(0.32) * 0.55);
    vec3 e2 = vec3(0.0, 1.75, 0.0) + vec3(0.0, sin(0.32) * 0.55, -cos(0.32) * 0.55);
    float cords = min(sdCapsule(q, e1, e1 - vec3(0.0, 0.5, 0.0), 0.006), sdCapsule(q, e2, e2 - vec3(0.0, 0.5, 0.0), 0.006));
    vec3 p1 = q - (e1 - vec3(0.0, 0.52, 0.0)), p2 = q - (e2 - vec3(0.0, 0.52, 0.0));
    float pans = min(max(abs(length(p1 * vec3(1.0, 2.5, 1.0)) - 0.2) - 0.008, p1.y - 0.02), max(abs(length(p2 * vec3(1.0, 2.5, 1.0)) - 0.2) - 0.008, p2.y - 0.02));
    // the false weights heaped in the low pan, more on the table
    float w = sdBox(p1 - vec3(0.03, -0.02, 0.0), vec3(0.05, 0.04, 0.05)) - 0.005;
    w = min(w, sdBox(p1 - vec3(-0.07, -0.03, 0.04), vec3(0.035, 0.03, 0.035)) - 0.004);
    w = min(w, sdBox(q - vec3(0.35, 0.95, 0.2), vec3(0.045, 0.05, 0.045)) - 0.005);
    w = min(w, sdBox(q - vec3(0.45, 0.93, -0.1), vec3(0.03, 0.03, 0.03)) - 0.004);
    float sc = min(min(stand, beam), min(cords, min(pans, w)));
    if (sc < d) { d = sc; id = 4.0; }
  }
  // the bloodied blade on the threshold
  if (length(p - BLADE) - 1.4 < d) {
    vec3 q = (p - BLADE) / 1.8; q.xz = rot(0.9) * q.xz;
    float bl = max(abs(q.y) - 0.012 * sat(1.0 - abs(q.x) / 0.07) - 0.003, abs(q.x) - 0.07 + 0.05 * sat((q.z - 0.0) / 0.45));
    bl = max(bl, abs(q.z) - 0.45);
    float hilt = sdCapsule(q, vec3(0.0, 0.0, -0.45), vec3(0.0, 0.0, -0.62), 0.022);
    float guard = sdBox(q - vec3(0.0, 0.0, -0.45), vec3(0.12, 0.018, 0.018));
    float b = min(bl, min(hilt, guard)) * 1.8;
    if (b < d) { d = b; id = 8.0; }
  }
  // the horned altar, smashed: a broken base, the top block toppled, fragments
  if (length(p - ALTAR - vec3(-0.3, 0.4, 0.0)) - 2.0 < d) {
    vec3 q = p - ALTAR;
    float base = sdBox(q - vec3(0.0, 0.35, 0.0), vec3(0.6, 0.35, 0.6));
    base = max(base, -(dot(q - vec3(0.0, 0.62, 0.0), normalize(vec3(0.4, 1.0, 0.25)))));   // sheared
    vec3 t = q - vec3(-0.9, 0.38, 0.4); t.xy = rot(0.9) * t.xy; t.xz = rot(0.4) * t.xz;
    float top = sdBox(t, vec3(0.55, 0.3, 0.5));
    vec3 hq = vec3(abs(t.x) - 0.45, t.y - 0.38, abs(t.z) - 0.4);
    top = min(top, sdRoundCone(hq, vec3(0.0), vec3(0.0, 0.18, 0.0), 0.09, 0.03));     // its horns
    float frag = 1e9;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      vec3 fc = vec3(0.9 * cos(fi * 2.2), 0.08, 0.9 * sin(fi * 2.2) - 0.2) * (0.8 + 0.4 * hash11(fi));
      vec3 fq = q - fc; fq.xz = rot(fi) * fq.xz;
      frag = min(frag, sdBox(fq, vec3(0.12, 0.08, 0.1) * (0.7 + 0.6 * hash11(fi + 3.0))) - 0.01);
    }
    float a = min(base, min(top, frag));
    if (a < d) { d = a; id = 7.0; }
  }
  return d;
}
float mapTd(vec3 p) { float i; return mapT(p, i); }
vec3 normT(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.0015 + 0.0005 * t);
  return normalize(e.xyy * mapTd(p + e.xyy) + e.yyx * mapTd(p + e.yyx) + e.yxy * mapTd(p + e.yxy) + e.xxx * mapTd(p + e.xxx));
}
float marchT(vec3 ro, vec3 rd, out float id) {
  float t = 0.05;
  for (int i = 0; i < 140; i++) {
    float d = mapT(ro + rd * t, id);
    if (abs(d) < 0.0004 * t) return t;
    t += d * 0.8;
    if (t > 200.0) break;
  }
  id = -1.0; return 200.0;
}
float aoT(vec3 p, vec3 n) {
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 3; i++) { float h = 0.15 * float(i * i); o += w * (h - mapTd(p + n * h)) / h; w *= 0.6; }
  return sat(1.0 - 0.5 * o);
}
float shadowT(vec3 p, vec3 lp) {
  vec3 L = lp - p; float maxt = length(L) - 0.4; L = normalize(L);
  float s = 1.0, t = 0.03;
  for (int i = 0; i < 20; i++) {
    float d = mapTd(p + L * t);
    s = min(s, 10.0 * d / t);
    t += clamp(d, 0.03, 1.5);
    if (s < 0.01 || t > maxt) break;
  }
  return sat(s);
}
vec3 torchPos(float side, float k) { return vec3(side * (SW - 0.35), 3.25, 4.0 + k * 8.0); }
vec3 torchCol2(float side, float k) { return vec3(1.0, 0.45, 0.14) * flick(k * 3.1 + side * 7.0); }

// black smoke over the street, lit crimson from the fires below
vec4 smokeT(vec3 ro, vec3 rd, float tmax) {
  float y0 = 9.0, y1 = 60.0;
  if (rd.y <= 0.01) return vec4(0, 0, 0, 1);
  float ta = max((y0 - ro.y) / rd.y, 0.0), tb = min((y1 - ro.y) / rd.y, tmax);
  tb = min(tb, ta + 120.0);
  if (tb <= ta) return vec4(0, 0, 0, 1);
  vec3 acc = vec3(0); float tr = 1.0; float dt = (tb - ta) / 12.0;
  float j = hash12(gl_FragCoord.xy + uJitter * 31.0);
  for (int i = 0; i < 12; i++) {
    float t = ta + dt * (float(i) + j);
    vec3 p = ro + rd * t;
    vec3 q = p * 0.07 + vec3(uTime * 0.05, -uTime * 0.12, uTime * 0.03);
    float n = fbm(q + 0.6 * vec3(fbm(q * 0.5, 2)), 4);
    float den = smoothstep(0.42, 0.7, n) * smoothstep(y0, y0 + 8.0, p.y) * 0.12;
    if (den < 1e-4) continue;
    float a = 1.0 - exp(-den * dt);
    float thin = sat(1.0 - (n - 0.42) * 3.5);
    vec3 c = vec3(0.6, 0.08, 0.03) * exp(-(p.y - y0) / 12.0) * (0.1 + thin * thin) * (0.6 + 0.6 * smoothstep(40.0, 95.0, p.z)) + vec3(0.006, 0.005, 0.006);
    acc += tr * a * c; tr *= 1.0 - a;
    if (tr < 0.03) break;
  }
  return vec4(acc, tr);
}

vec3 cityStreet(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float id; float t = marchT(ro, rd, id);
  vec3 col = vec3(0.004, 0.003, 0.004);
  if (id > 0.0) {
    vec3 p = ro + rd * t, n = normT(p, t), v = -rd;
    vec3 alb; float rough = 0.85, metal = 0.0;
    if (id == 1.0) {
      // worn paving slabs, cracked, dark in the joints, a little greasy shine
      vec2 sl = vec2(p.x * 0.8 + 0.5 * mod(floor(p.z / 1.1), 2.0), p.z / 1.1);
      vec2 f = fract(sl), e = min(f, 1.0 - f);
      float joint = smoothstep(0.035, 0.0, min(e.x * 1.25, e.y));
      float hs = hash12(floor(sl));
      alb = vec3(0.24, 0.21, 0.18) * (0.7 + 0.5 * hs) * (0.7 + 0.5 * fbm(p.xz * 2.0, 4));
      alb *= 1.0 - 0.75 * joint;
      float crack = smoothstep(0.03, 0.0, voronoiEdge(p.xz * 1.3).x) * step(0.6, hs);
      alb *= 1.0 - 0.6 * crack;
      rough = mix(0.32, 0.85, fbm(p.xz * 0.7, 3)) + 0.3 * joint;
      n = bumpN(p, n, 3.0, 0.06);
      // dark stains spreading from the threshold where the blade fell
      float stain = smoothstep(1.1, 0.3, length((p.xz - BLADE.xz - vec2(0.3, 0.4)) * vec2(1.0, 0.8))) * smoothstep(0.3, 0.6, fbm(p.xz * 6.0, 3));
      alb = mix(alb, vec3(0.08, 0.008, 0.006), stain * 0.85); rough = mix(rough, 0.25, stain);
    } else if (id == 2.0) {
      vec2 uv = vec2(p.z, p.y);
      alb = mudAlb(p, uv) * 0.9;
      // soot above the doorways and torches
      alb *= 1.0 - 0.45 * smoothstep(0.4, 0.8, fbm(vec2(p.z * 0.5, p.y * 0.15), 3)) * smoothstep(2.0, 6.0, p.y);
      n = bumpN(p, n, 8.0, 0.08);
    } else if (id == 3.0) {
      vec3 cb = cyclo(abs(n.z) > 0.6 ? p.xy : p.zy, 1.4);
      alb = stoneAlb(p, cb.y) * (1.0 - 0.7 * cb.z);
      n = bumpN(p, n, 3.0, 0.2);
    } else if (id == 4.0) {
      alb = bronzeAlb(p * 2.0, rough); metal = 1.0; rough = max(rough * 0.8, 0.18);
    } else if (id == 5.0) {
      alb = vec3(0.05); rough = 0.6; metal = 0.6;
    } else if (id == 6.0) {
      alb = vec3(0.22, 0.14, 0.08) * (0.7 + 0.5 * fbm(vec2(p.y * 20.0, atan(p.z - CHAIN.z, p.x - CHAIN.x) * 3.0), 3)); rough = 0.75;
    } else if (id == 7.0) {
      alb = vec3(0.5, 0.46, 0.4) * (0.7 + 0.4 * fbm(p.xz * 5.0 + p.y * 3.0, 4)); rough = 0.85;
      n = bumpN(p, n, 9.0, 0.2);
    } else {
      // the blade: bronze, its edge bright, crusted dark red
      alb = vec3(0.85, 0.55, 0.3); metal = 1.0; rough = 0.25;
      vec3 bq = (p - BLADE) / 1.8; bq.xz = rot(0.9) * bq.xz;
      float blood = sat(smoothstep(0.4, 0.62, fbm(p.xz * 14.0, 4)) + smoothstep(-0.05, 0.4, bq.z) * smoothstep(0.3, 0.5, fbm(p.xz * 9.0 + 3.0, 3)));
      alb = mix(alb, vec3(0.16, 0.012, 0.01), blood); metal = mix(1.0, 0.0, blood); rough = mix(rough, 0.35, blood);
    }
    float ao = aoT(p, n);
    // the torches near this point, both sides
    float k0 = floor((p.z - 4.0) / 8.0 + 0.5);
    for (int j = -1; j <= 2; j++) {
      for (int s = 0; s < 2; s++) {
        float side = s == 0 ? 1.0 : -1.0;
        float k = k0 + float(j);
        if (k < 0.0) continue;
        vec3 lp = torchPos(side, k) + vec3(0.0, 0.35, 0.0);
        vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
        float sh = (abs(lp.z - p.z) < 4.0) ? shadowT(p + n * 0.02, lp) : 1.0;
        col += brdf(n, v, L, alb, rough, metal, torchCol2(side, k) * 18.0 / (d2 + 0.2)) * sh * mix(ao, 1.0, 0.4);
      }
    }
    // the furnace at the end of the street: crimson light pouring down the paving
    vec3 fp = vec3(0.0, 2.2, FURZ - 1.0);
    vec3 L = fp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    col += brdf(n, v, L, alb, rough, metal, furnaceCol() * 260.0 / (d2 + 30.0)) * mix(ao, 1.0, 0.5);
    // the furnace's own mouth glows
    if (p.z > FURZ - 0.5 && abs(p.x) < 2.5 && p.y < 7.8) col += furnaceCol() * 3.0 * smoothstep(3.2, -0.5, length(vec2(p.x, (p.y - 2.5) * 0.8)));
    // what the bronze reflects: fire-lit smoke and the torches
    if (metal > 0.5) {
      vec3 rr = reflect(rd, n);
      vec3 env = vec3(0.3, 0.05, 0.02) * smoothstep(-0.1, 0.6, rr.y) + furnaceCol() * 0.6 * pow(sat(rr.z), 6.0);
      col += env * fresnelR(n, v, alb, metal) * (1.0 - rough) * ao;
    }
    col = mix(col, vec3(0.03, 0.006, 0.004), 1.0 - exp(-t * 0.012));
  }
  vec4 sm = smokeT(ro, rd, t);
  col = col * sm.a + sm.rgb;
  // the torch flames along the street
  float kc = floor((ro.z - 4.0) / 8.0 + 0.5);
  for (int j = 0; j < 9; j++) {
    for (int s = 0; s < 2; s++) {
      float side = s == 0 ? 1.0 : -1.0;
      float k = kc + float(j);
      if (k < 0.0) continue;
      vec3 b = torchPos(side, k);
      col += flame(ro, rd, b, 1.0, 0.85, k * 2.3 + side, t, 6.0);
      col += torchCol2(side, k) * glowLine(ro, rd, b + vec3(0.0, 0.4, 0.0), t) * 0.003;
    }
  }
  // flames licking out of the furnace mouth, and its glow in the smoky air
  col += flame(ro, rd, vec3(0.0, 0.2, FURZ + 0.6), 5.0, 1.8, 7.0, t + 1.0, 4.0) * vec3(1.0, 0.55, 0.5);
  col += furnaceCol() * glowLine(ro, rd, vec3(0.0, 3.0, FURZ - 2.0), t) * 0.06;
  col += embers(ro, rd, t, 2, ro.z + 2.0, 3.5, 10, 0.8, 1.6, vec3(-5.0, 0.0, -10.0), vec3(5.0, 14.0, 110.0), 0.9);
  return col;
}
`;
