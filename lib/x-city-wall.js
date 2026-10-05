// The walls of the giants' city at dusk (s07-giants). Cyclopean blocks of grey stone, each taller
// than a house, set without mortar in a wall that leans back as it climbs past 70 m; two towers
// stand forward of it and rise into black smoke. In the middle a gate recess holds two bronze door
// leaves, studded and strapped, a hand's breadth ajar so the forge light of the city pours out of
// the gap. A colossal bronze ring hangs on the left leaf. Torches burn in iron baskets on the wall.
// Ground at y = 0, wall face near z = 0 (camera at z < 0), x along the wall.
export const WALL_GLSL = /* glsl */ `
const float BATTER = 0.07;
const vec3 GATE = vec3(9.0, 27.0, 3.2);    // half width, height, recess depth
const float DOORZ = 3.0;
const vec3 TOW = vec3(28.0, 9.0, 8.0);     // tower centre |x|, half width, forward of the wall
const float TOWH = 118.0;
const vec3 RINGB = vec3(-4.2, 11.5, DOORZ - 0.55);   // boss the ring hangs from
const float RINGR = 2.3;

#define NTORCH 6
vec3 TORCH[NTORCH];
void initWall() {
  TORCH[0] = vec3(-12.5, 6.2, -1.6); TORCH[1] = vec3(12.5, 6.2, -1.6);
  TORCH[2] = vec3(-44.0, 6.5, -1.5); TORCH[3] = vec3(44.0, 6.5, -1.5);
  TORCH[4] = vec3(-62.0, 6.5, -1.5); TORCH[5] = vec3(62.0, 6.5, -1.5);
}

float sdTorusZ(vec3 p, float R, float r) { return length(vec2(length(p.xy) - R, p.z)) - r; }

// the ring's sway (it is huge: a slow small swing)
float ringAng() { return 0.035 * sin(uTime * 0.9) + 0.02 * sin(uTime * 2.1 + 1.0); }

// id: 1 ground, 2 wall stone, 3 bronze door, 4 bronze ring/studs, 5 iron torch basket
float mapW(vec3 p, out float id) {
  // ground: packed earth with ruts
  float g = p.y - 0.12 * fbm(p.xz * 0.35, 3) + 0.05;
  id = 1.0; float d = g;
  // the wall face (leaning back)
  float wz = BATTER * max(p.y, 0.0) - p.z;
  // gate recess cut into it
  vec3 gq = p - vec3(0.0, 0.0, 0.0);
  float gate = max(max(abs(gq.x) - GATE.x, gq.y - GATE.y), gq.z - GATE.z);
  float wall = max(wz, -gate);
  wall = max(wall, p.y - 74.0 - 3.0 * vnoise(vec2(p.x * 0.15, 1.0)));   // ragged crest
  wall = max(wall, -max(abs(p.y - 72.5) - 2.6, abs(fract(p.x / 7.0) - 0.5) * 7.0 - 1.6));   // merlons
  wall = max(wall, p.z - 14.0);   // the wall's back face
  // towers
  float ax = abs(p.x) - TOW.x;
  vec3 tq = vec3(ax, p.y, p.z + TOW.z * 0.5);
  float tower = max(sdBox(tq - vec3(0.0, TOWH * 0.5, 0.0), vec3(TOW.y - 0.03 * p.y, TOWH * 0.5, TOW.z * 0.5 + 0.0)), -p.y - 1.0);
  // crenellations round the tower tops
  float tn = max(abs(p.y - TOWH + 1.6) - 1.7, abs(fract((tq.x + tq.z) / 3.2) - 0.5) * 3.2 - 0.75);
  tower = max(tower, -tn);
  float st = min(wall, tower);
  // pillowed blocks: the faces bulge, the joints sink
  if (st < 2.0) {
    vec2 uv = tower < wall ? vec2(p.x + p.z * 1.3, p.y) : vec2(p.x, p.y);
    vec3 cb = cyclo(uv + vec2(0.0, 0.0), 5.2);
    st -= 0.32 * smoothstep(0.0, 0.9, cb.x) - 0.1 + 0.05 * fbm(uv * 1.7, 2);
  }
  if (st < d) { d = st; id = 2.0; }
  // door leaves in the recess, a gap in the middle
  float lx = abs(p.x) - 0.18;
  float door = sdBox(vec3(lx - GATE.x * 0.5 + 0.09, p.y - GATE.y * 0.5, p.z - DOORZ - 0.3), vec3(GATE.x * 0.5 - 0.1, GATE.y * 0.5, 0.3));
  if (door < 1.5) {
    // straps
    float sy = mod(p.y + 1.0, 4.4) - 2.2;
    float strap = sdBox(vec3(lx - GATE.x * 0.5, sy, p.z - DOORZ + 0.04), vec3(GATE.x * 0.5 - 0.1, 0.32, 0.08));
    door = min(door, max(strap, abs(p.y - GATE.y * 0.5) - GATE.y * 0.5 + 0.4));
    // studs
    vec2 c = vec2(mod(lx + 0.0, 1.1) - 0.55, mod(p.y, 1.1) - 0.55);
    float stud = length(vec3(c, (p.z - DOORZ + 0.03) * 1.3)) - 0.16;
    stud = max(stud, max(lx - GATE.x + 0.4, abs(p.y - GATE.y * 0.5) - GATE.y * 0.5 + 0.5));
    stud = max(stud, -lx + 0.25);
    door = min(door, stud);
  }
  if (door < d) { d = door; id = 3.0; }
  // the boss and the colossal ring
  float boss = length((p - RINGB) * vec3(1.0, 1.0, 1.6)) - 0.85;
  vec3 rp = p - RINGB;
  float ra = ringAng();
  rp.yz = rot(-0.12 + ra * 0.3) * rp.yz; rp.xy = rot(ra) * rp.xy;
  rp.y += RINGR - 0.2;
  float ring = sdTorusZ(rp, RINGR, 0.3);
  float br = min(boss, ring);
  if (br < d) { d = br; id = 4.0; }
  // torch baskets on iron arms
  for (int i = 0; i < NTORCH; i++) {
    vec3 q = p - TORCH[i];
    float bask = max(length(q * vec3(1.0, 1.6, 1.0)) - 0.55, q.y - 0.12);
    bask = max(bask, -(length(q * vec3(1.0, 1.6, 1.0)) - 0.47));
    float arm = sdCapsule(p, TORCH[i] - vec3(0.0, 0.3, 0.0), TORCH[i] + vec3(0.0, -0.9, 1.5 + BATTER * 6.0), 0.07);
    float tb = min(bask, arm);
    if (tb < d) { d = tb; id = 5.0; }
  }
  return d;
}
float mapWd(vec3 p) { float i; return mapW(p, i); }
vec3 normW(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.004 + 0.0008 * t);
  return normalize(e.xyy * mapWd(p + e.xyy) + e.yyx * mapWd(p + e.yyx) + e.yxy * mapWd(p + e.yxy) + e.xxx * mapWd(p + e.xxx));
}
float marchW(vec3 ro, vec3 rd, out float id) {
  float t = 0.05;
  for (int i = 0; i < 240; i++) {
    float d = mapW(ro + rd * t, id);
    if (abs(d) < 0.0006 * t) return t;
    t += d * 0.8;
    if (t > 1500.0) break;
  }
  id = -1.0; return 1500.0;
}
float shadowW(vec3 p, vec3 L, float maxt) {
  float s = 1.0, t = 0.15;
  for (int i = 0; i < 40; i++) {
    float d = mapWd(p + L * t);
    s = min(s, 10.0 * d / t);
    t += clamp(d, 0.2, 6.0);
    if (s < 0.01 || t > maxt) break;
  }
  return sat(s);
}
float aoW(vec3 p, vec3 n) {
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.25 * float(i * i); o += w * (h - mapWd(p + n * h)) / h; w *= 0.6; }
  return sat(1.0 - 0.45 * o);
}

// the forge light pouring out of the gap between the leaves: closest point on a vertical line
vec3 gapPoint(vec3 p) { return vec3(0.0, clamp(p.y, 0.5, GATE.y - 1.0), DOORZ + 0.2); }
vec3 gapCol() { return vec3(1.0, 0.32, 0.08) * (0.9 + 0.15 * vnoise(vec2(uTime * 3.0, 2.0))); }

vec3 torchCol(int i) { return vec3(1.0, 0.45, 0.14) * flick(float(i) * 11.0); }

// smoke rising from the city over the crest, lit from below by the forges
vec4 smokeW(vec3 ro, vec3 rd, float tmax, float thin) {
  if (rd.y <= 0.02) return vec4(0, 0, 0, 1);
  float y0 = 40.0, y1 = 420.0;
  float ta = max((y0 - ro.y) / rd.y, 0.0), tb = min((y1 - ro.y) / rd.y, tmax);
  if (tb <= ta) return vec4(0, 0, 0, 1);
  vec3 acc = vec3(0); float tr = 1.0;
  float dt = (tb - ta) / 22.0;
  float j = hash12(gl_FragCoord.xy + uJitter * 31.0);
  for (int i = 0; i < 22; i++) {
    float t = ta + dt * (float(i) + j);
    vec3 p = ro + rd * t;
    vec3 q = p * 0.045 + vec3(-uTime * 0.07, -uTime * 0.16, uTime * 0.03);
    float n = fbm(q + 0.6 * vec3(fbm(q * 0.5, 2)), 5);
    float den = smoothstep(0.5, 0.7, n + 0.12 * smoothstep(70.0, 110.0, p.y)) * (1.0 - 0.45 * smoothstep(34.3, 35.3, uTime) * smoothstep(150.0, 600.0, p.z));
    den *= smoothstep(0.0, 18.0, p.z) + smoothstep(76.0, 96.0, p.y);
    // never inside the solid towers (smoke over them read as translucent stone)
    den *= 1.0 - smoothstep(14.0, 10.0, abs(abs(p.x) - TOW.x)) * smoothstep(6.0, 2.0, abs(p.z + TOW.z * 0.5)) * step(p.y, TOWH + 2.0);   // behind the wall, or above it
    den *= 0.09 * (1.0 - 0.8 * smoothstep(60.0, 200.0, p.z));
    if (den < 1e-4) continue;
    float a = 1.0 - exp(-den * dt * thin);
    // black smoke, lit from below by the city's fires at its underside and in its thin places
    float thin = sat(1.0 - (n - 0.5) * 4.0);
    float below = exp(-(p.y - 70.0) / 30.0) * (0.08 + thin * thin * thin);
    vec3 c = vec3(0.7, 0.16, 0.04) * sat(below) * 0.9 + vec3(0.01, 0.009, 0.011);
    acc += tr * a * c;
    tr *= 1.0 - a;
    if (tr < 0.02) break;
  }
  return vec4(acc, tr);
}

vec3 cityWall(vec2 fc) {
  initWall();
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float id; float t = marchW(ro, rd, id);
  vec3 col;
  vec3 skyc = stormSky(rd, 0.4, 0.8) * 0.7;
  if (id > 0.0) {
    vec3 p = ro + rd * t, n = normW(p, t), v = -rd;
    col = vec3(0);
    vec3 alb; float rough = 0.85, metal = 0.0;
    vec2 uv = vec2(p.x + (abs(p.x) > 19.0 ? p.z * 1.3 : 0.0), p.y);
    if (id == 1.0 && p.z > 12.0) {
      // the city beyond the wall: dark ground thick with forge fires and lit doorways
      vec2 g = p.xz / 9.0; vec2 cid = floor(g); float h = hash12(cid);
      float fire = step(0.86, h) * smoothstep(0.45, 0.1, length(fract(g) - 0.5));
      col += vec3(1.0, 0.3, 0.06) * fire * (1.5 + 2.0 * hash11(h * 7.0)) * (0.8 + 0.3 * sin(uTime * 3.0 + h * 40.0));
    }
    if (id == 1.0) {
      alb = vec3(0.2, 0.16, 0.12) * (0.6 + 0.6 * fbm(p.xz * 1.5, 4));
      float wet = smoothstep(0.55, 0.65, fbm(p.xz * 0.25 + 3.0, 3));
      alb *= 1.0 - 0.5 * wet; rough = mix(0.9, 0.15, wet);
    } else if (id == 2.0) {
      vec3 cb = cyclo(uv, 5.2);
      alb = stoneAlb(p, cb.y) * (1.0 - 0.75 * cb.z);
      n = bumpN(p, n, 1.6, 0.3);
      // chipped arrises along the joints
      alb *= 1.0 - 0.25 * smoothstep(0.35, 0.0, cb.x) * fbm(p.xy * 6.0, 2);
      // soot streaks above the torches and the gate
      alb *= 1.0 - 0.5 * smoothstep(0.4, 0.8, fbm(vec2(p.x * 0.3, p.y * 0.04), 3)) * smoothstep(4.0, 30.0, p.y);
      rough = 0.9;
    } else if (id == 3.0 || id == 4.0) {
      alb = bronzeAlb(p * 0.6, rough); metal = 1.0;
      if (id == 3.0) { alb *= 0.6; rough += 0.12; }
    } else {
      alb = vec3(0.05); rough = 0.6; metal = 0.5;
    }
    float ao = aoW(p, n);
    // cool dusk key from high left behind the camera, soft-shadowed
    vec3 Lm = normalize(vec3(-0.42, 0.5, -0.76));
    float sh = shadowW(p + n * 0.05, Lm, 200.0);
    col += brdf(n, v, Lm, alb, rough, metal, vec3(0.95, 0.9, 1.0) * sh);
    // sky fill
    col += alb * (1.0 - metal) * vec3(0.06, 0.05, 0.08) * (0.5 + 0.5 * n.y) * ao;
    // the city glow from beyond the crest lights the upper wall a little
    col += alb * (1.0 - metal) * vec3(0.5, 0.14, 0.04) * 0.08 * smoothstep(20.0, 75.0, p.y) * ao;
    // torches (no shadows; they hang off the face)
    for (int i = 0; i < NTORCH; i++) {
      vec3 lp = TORCH[i] + vec3(0.0, 0.5, 0.0);
      vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
      col += brdf(n, v, L, alb, rough, metal, torchCol(i) * 26.0 / (d2 + 0.3)) * mix(ao, 1.0, 0.5);
    }
    // the gate's forge light
    vec3 gp = gapPoint(p); vec3 L = gp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    col += brdf(n, v, L, alb, rough, metal, gapCol() * 60.0 / (d2 + 1.0)) * mix(ao, 1.0, 0.3) * (0.06 + 0.94 * sat((gp.z - p.z) * inversesqrt(d2)));
    // and the glow it throws across the ground in front of the gate
    if (id == 1.0) col += alb * gapCol() * 0.5 * exp(-abs(p.x) * 0.25) * exp(-max(-p.z, 0.0) * 0.12) * smoothstep(-1.0, 3.0, p.z + 8.0);
    // bronze reflects the sky and the fires
    if (metal > 0.5) {
      vec3 rr = reflect(rd, n);
      vec3 env = stormSky(rr, 0.65, 1.0) * 1.5;
      for (int i = 0; i < NTORCH; i++) { vec3 dl = normalize(TORCH[i] + vec3(0, 0.5, 0) - p); env += torchCol(i) * 4.0 * pow(sat(dot(rr, dl)), 40.0 / (rough * rough * 10.0 + 1.0)); }
      env += gapCol() * 0.35 * smoothstep(0.0, 1.0, rr.z);
      col += env * fresnelR(n, v, alb, metal) * (1.0 - rough * 0.8) * ao;
    }
    // arrow slits in the towers, lit from inside
    if (id == 2.0 && p.z < -7.0 && abs(p.x) > 19.0) {
      float sx = abs(abs(p.x) - TOW.x), sy = mod(p.y - 22.0, 17.0);
      float slit = smoothstep(0.4, 0.25, sx) * smoothstep(0.0, 0.2, sy) * smoothstep(3.6, 3.3, sy) * step(20.0, p.y) * step(p.y, 200.0);
      col += vec3(1.0, 0.3, 0.06) * slit * 0.3 * smoothstep(0.5, 0.0, sx) * (0.8 + 0.3 * vnoise(vec2(uTime * 2.0, floor(p.y / 17.0) + sign(p.x) * 7.0)));
    }
    // the gap glows
    if (id == 3.0) col += gapCol() * 5.0 * exp(-max(abs(p.x) - 0.18, 0.0) * 6.0);
    // haze: distance takes the dusk colour
    float fog = 1.0 - exp(-t * 0.0045);
    col = mix(col, vec3(0.05, 0.04, 0.055), fog);
  } else {
    col = skyc;
  }
  // far beyond the city, in the smoke: one of the Nephilim, colossal and perfectly still
  float gd;
  vec4 gi = nephilim(ro, rd, vec3(-700.0, -40.0, 2600.0), 1100.0, -0.2, vec3(1.0, 0.28, 0.06) * 2.0, vec3(0.62, 0.72, 0.95) * 0.9, gd);
  if (id < 0.0) t = 5000.0;
  if (gd > t) gi = vec4(0.0);
  // the light inside the gap itself
  {
    vec2 g = vec2(0.0); float tg = (DOORZ + 0.25 - ro.z) / rd.z;
    if (tg > 0.0 && tg < t + 0.5) { vec3 q = ro + rd * tg; float inside = step(abs(q.x), 0.19) * step(q.y, GATE.y - 0.3) * step(0.0, q.y); col = mix(col, gapCol() * 9.0 * (0.8 + 0.4 * fbm(vec2(q.y * 0.5, uTime), 2)), inside); }
  }
  // smoke over everything above the crest
  // a ray that ends on a tower's stone sees only a little of the smoke in front of it, so the
  // towers stand solid and dark against the red sky
  vec3 ph = ro + rd * t;
  float towerHit = id == 2.0 && abs(abs(ph.x) - TOW.x) < TOW.y + 1.0 && ph.z < 1.0 ? 1.0 : 0.0;
  vec4 sm = smokeW(ro, rd, t, mix(1.0, 0.15, towerHit));
  col = col * sm.a + sm.rgb;
  // the giant stands deep in the smoke: a vast dim shadow, half dissolved, low contrast
  if (gi.a > 0.0) {
    float wisp = fbm(rd.xy * 6.0 / max(rd.z, 0.2) + vec2(uTime * 0.1, -uTime * 0.04), 4);
    // smoke drifts across it in bands; around the held word the smoke thins and it stands revealed
    float R = smoothstep(34.3, 35.3, uTime);
    float bands = smoothstep(0.42, 0.72, fbm(vec2(rd.y * 16.0 - uTime * 0.12, rd.x * 2.5 + uTime * 0.05), 4));
    float vis = gi.a * (1.0 - (0.75 - 0.5 * R) * bands) * smoothstep(-0.02, 0.1, rd.y);
    col = mix(col, mix(gi.rgb, col, 0.3), min(vis * mix(0.9, 1.15, R), 0.9));   // kilometres of haze in front
  }
  // torch flames and their glow in the dusk air
  for (int i = 0; i < NTORCH; i++) {
    vec3 b = TORCH[i] + vec3(0.0, 0.05, 0.0);
    col += flame(ro, rd, b, 1.9, 0.9, float(i) * 5.3, t, 7.0);
    col += torchCol(i) * glowLine(ro, rd, b + vec3(0.0, 0.7, 0.0), t) * 0.004;
  }
  // the gate glow in the air
  col += gapCol() * glowLine(ro, rd, vec3(0.0, 4.0, DOORZ - 1.0), t) * 0.012;
  col += embers(ro, rd, t, 2, -14.0, 2.2, 7, 0.9, 1.4, vec3(-30.0, 0.0, -30.0), vec3(30.0, 60.0, 5.0), 0.5);
  return col;
}
`;
