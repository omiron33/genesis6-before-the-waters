// The giants' hall at dusk (s09-renown). A colossal bronze sword stands driven point-first into a
// basalt floor, its blade 3.6 m wide and over 50 m tall, the flagstones cracked and heaved round
// it; the guard and grip high above in the smoke. Far beyond it, a basalt throne of impossible size
// between rows of hexagonal basalt columns. Four great bronze fire-bowls burn on the floor; embers
// rise, smoke hangs under the unseen roof. uFlash (0..1) is the blade's flash on "renown": the
// fire-bowls surge and a bright glint runs down the edge. Floor at y = 0; blade in the x-y plane
// at the origin, its flat facing -z (the camera side); the throne at +z.
export const HALL_UNIFORMS = { uFlash: 0.0, uGlint: -1.0 };

export const HALL_GLSL = /* glsl */ `
uniform float uFlash, uGlint;
const float BW = 1.8;        // blade half width
const float BT = 0.32;       // blade half thickness at the spine
const float GUARD = 56.0;    // guard height
const float LEAN = 0.05;     // the blade stands a little off true
vec3 BOWL[4];
void initHall() {
  BOWL[0] = vec3(-9.0, 0.0, 8.0); BOWL[1] = vec3(11.0, 0.0, 15.0);
  BOWL[2] = vec3(-24.0, 0.0, 70.0); BOWL[3] = vec3(25.0, 0.0, 73.0);
}
vec3 bowlFire(int i) { return BOWL[i] + vec3(0.0, 4.6, 0.0); }
vec3 bowlCol(int i) { return vec3(1.0, 0.42, 0.12) * flick(float(i) * 9.0 + 2.0) * (1.0 + 1.6 * uFlash); }

// a cold pale shaft from a high window on the left falls across the upper blade
const vec3 LC = vec3(0.52, 0.78, -0.35);
vec3 coldCol() { return vec3(0.55, 0.65, 0.95) * 1.3; }
float beamMask(vec3 p) {
  vec3 L = normalize(LC);
  vec3 a = vec3(0.0, 46.0, 0.0);
  vec3 d = p - a; float along = dot(d, L);
  float r = length(d - L * along);
  return smoothstep(13.0, 7.0, r) * smoothstep(-40.0, 0.0, along + 20.0);
}
vec3 swordSpace(vec3 p) { p.xy = rot(LEAN) * p.xy; return p; }

// id: 1 floor, 2 blade, 3 guard/grip/pommel, 4 basalt (throne, columns), 5 fire-bowl
float mapH(vec3 p, out float id) {
  // floor: big basalt flags, heaved and broken round the blade
  float r = length(p.xz);
  float heave = 0.55 * exp(-r * 0.22) * (0.5 + vnoise(vec2(atan(p.z, p.x) * 4.0, 1.0)));
  float d = p.y - heave + 0.02 * fbm(p.xz * 0.8, 2);
  id = 1.0;
  // the sword
  vec3 q = swordSpace(p);
  if (q.y < GUARD + 20.0) {
    float y = q.y;
    float w = BW * (1.0 - 0.05 * y / GUARD);
    float ax = abs(q.x);
    float th = BT * sat(1.0 - ax / w) + 0.015;
    th -= 0.1 * exp(-ax * ax / 0.12) * smoothstep(1.0, 4.0, y);   // the fuller
    // nicks and notches hacked out of both edges
    float nk = vnoise(vec2(y * 0.9, sign(q.x) * 7.0));
    float nick = 0.22 * smoothstep(0.72, 0.9, nk) + 0.05 * vnoise(vec2(y * 6.0, sign(q.x) * 3.0));
    float blade = max(abs(q.z) - th, ax - w + nick);
    // hammer dents on the flats
    if (abs(q.z) < 0.6) blade += 0.006 * smoothstep(0.35, 0.0, voronoiEdge(q.xy * vec2(2.4, 1.5)).x);
    blade = max(blade, y - GUARD);
    blade *= 0.7;
    if (blade < d) { d = blade; id = 2.0; }
    // the guard: thick at the centre, tapering and curving down to rounded quillon ends
    vec3 g = q - vec3(0.0, GUARD + 0.8, 0.0);
    float gx = abs(g.x);
    g.y += 0.02 * gx * gx;
    float taper = 1.0 - 0.45 * sat(gx / 8.0);
    float guard = sdBox(vec3(g.x, g.y / taper, g.z / taper), vec3(7.6, 0.75, 0.7)) * taper - 0.3 * taper;
    guard = smin(guard, length(vec3(gx - 7.9, g.y + 0.0, g.z)) - 0.75, 0.4);          // knobbed ends
    guard = smin(guard, sdEllipsoid(g, vec3(2.2, 1.5, 1.2)), 0.5);                     // the central block
    // the grip, bound in leather in a spiral, frayed strands where it has worn
    float gy = q.y - GUARD - 8.5;
    float ang = atan(q.z, q.x);
    float band = fract(gy / 0.55 + ang / 6.2831853);
    float ridge = 0.13 * smoothstep(0.0, 0.15, band) * smoothstep(1.0, 0.8, band);
    float fray = 0.05 * smoothstep(0.7, 0.95, vnoise(vec2(ang * 3.0, gy * 9.0))) * vnoise(vec2(ang * 40.0, gy * 60.0));
    float grip = length(q.xz) - 0.9 - ridge - fray;
    grip = max(grip, abs(gy) - 7.2) * 0.8;
    // a wheel pommel
    vec3 pq = q - vec3(0.0, GUARD + 17.4, 0.0);
    float pom = max(length(pq.xy) - 2.3, abs(pq.z) - 0.7 + 0.25 * smoothstep(1.2, 2.3, length(pq.xy))) - 0.12;
    pom = min(pom, length(pq) - 0.9 - 0.0 * pq.z);
    float hilt = min(min(guard, grip), pom);
    if (hilt < d) { d = hilt; id = grip < min(guard, pom) ? 6.0 : 3.0; }
  }
  // the throne, far beyond: seat, back, arms (each a cliff)
  vec3 t = p - vec3(0.0, 0.0, 95.0);
  float seat = sdBox(t - vec3(0.0, 9.0, 0.0), vec3(24.0, 9.0, 14.0));
  float back = sdBox(t - vec3(0.0, 30.0, 12.0), vec3(26.0, 30.0, 4.0));
  float arms = sdBox(vec3(abs(t.x) - 27.0, t.y - 16.0, t.z), vec3(4.0, 16.0, 15.0));
  float steps = sdBox(t - vec3(0.0, 1.5, -18.0), vec3(18.0, 1.5, 6.0));
  float throne = min(min(seat, back), min(arms, steps));
  // basalt columns down both sides
  vec3 c = vec3(abs(p.x) - 34.0, p.y, mod(p.z + 7.0, 22.0) - 11.0);
  vec2 hq = abs(c.xz);
  float col = max(max(hq.x * 0.866 + hq.y * 0.5, hq.y) - 3.2, p.y - 64.0);
  col = min(col, sdBox(c - vec3(0.0, 65.5, 0.0), vec3(4.6, 1.5, 4.6)));   // a plain capital
  float bas = min(throne, col);
  if (bas < d) { d = bas; id = 4.0; }
  // the fire-bowls: a squat pedestal and a wide bronze bowl
  for (int i = 0; i < 4; i++) {
    if (length(p - BOWL[i] - vec3(0.0, 2.5, 0.0)) > d + 4.0) continue;
    vec3 b = p - BOWL[i];
    float ped = sdRoundCone(b, vec3(0.0, 0.0, 0.0), vec3(0.0, 3.2, 0.0), 1.3, 0.6);
    vec3 bb = b - vec3(0.0, 4.4, 0.0);
    float bowl = abs(length(bb * vec3(1.0, 1.7, 1.0)) - 2.6) - 0.12;
    bowl = max(bowl, bb.y - 0.2);
    float fb = min(ped, bowl * 0.6);
    if (fb < d) { d = fb; id = 5.0; }
  }
  return d;
}
float mapHd(vec3 p) { float i; return mapH(p, i); }
vec3 normH(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.003 + 0.0006 * t);
  return normalize(e.xyy * mapHd(p + e.xyy) + e.yyx * mapHd(p + e.yyx) + e.yxy * mapHd(p + e.yxy) + e.xxx * mapHd(p + e.xxx));
}
float marchH(vec3 ro, vec3 rd, out float id) {
  float t = 0.05;
  for (int i = 0; i < 160; i++) {
    float d = mapH(ro + rd * t, id);
    if (abs(d) < 0.0005 * t) return t;
    t += d * 0.85;
    if (t > 300.0) break;
  }
  id = -1.0; return 300.0;
}
float shadowH(vec3 p, vec3 lp) {
  vec3 L = lp - p; float maxt = length(L); L /= maxt;
  float s = 1.0, t = 0.2;
  for (int i = 0; i < 24; i++) {
    float d = mapHd(p + L * t);
    s = min(s, 8.0 * d / t);
    t += clamp(d, 0.15, 5.0);
    if (s < 0.01 || t > maxt - 1.0) break;
  }
  return sat(s);
}
float aoH(vec3 p, vec3 n) {
  float o = 0.0, w = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.3 * float(i * i); o += w * (h - mapHd(p + n * h)) / h; w *= 0.6; }
  return sat(1.0 - 0.4 * o);
}

// smoke under the roof of the hall, lit from below by the fire-bowls
vec4 smokeH(vec3 ro, vec3 rd, float tmax) {
  float y0 = 22.0, y1 = 120.0;
  float ta, tb;
  if (abs(rd.y) < 1e-3) { if (ro.y < y0 || ro.y > y1) return vec4(0, 0, 0, 1); ta = 0.0; tb = tmax; }
  else {
    float a = (y0 - ro.y) / rd.y, b = (y1 - ro.y) / rd.y;
    ta = max(min(a, b), 0.0); tb = min(max(a, b), tmax);
  }
  tb = min(tb, ta + 140.0);
  if (tb <= ta) return vec4(0, 0, 0, 1);
  vec3 acc = vec3(0); float tr = 1.0;
  float dt = (tb - ta) / 12.0;
  float j = hash12(gl_FragCoord.xy + uJitter * 31.0);
  for (int i = 0; i < 12; i++) {
    float t = ta + dt * (float(i) + j);
    vec3 p = ro + rd * t;
    vec3 q = p * 0.06 + vec3(uTime * 0.04, -uTime * 0.09, 0.0);
    float n = fbm(q + 0.7 * vec3(fbm(q * 0.6, 2)), 4);
    float den = smoothstep(0.45, 0.72, n) * smoothstep(y0, y0 + 25.0, p.y) * 0.07;
    float bm = beamMask(p);
    acc += tr * coldCol() * bm * (0.0006 + den * 0.3) * dt * 0.3;
    if (den < 1e-4) continue;
    float a = 1.0 - exp(-den * dt);
    float thin = sat(1.0 - (n - 0.45) * 3.5);
    vec3 c = vec3(0.7, 0.2, 0.05) * exp(-(p.y - y0) / 30.0) * (0.15 + thin * thin) * (0.6 + 0.8 * uFlash) + vec3(0.012, 0.011, 0.013);
    acc += tr * a * c; tr *= 1.0 - a;
    if (tr < 0.02) break;
  }
  return vec4(acc, tr);
}

vec3 hallEnv(vec3 rr, vec3 p) {
  // what bronze sees: the dark hall, the smoke glowing above, the fire-bowls as hot spots
  float sm = 0.5 + 0.5 * fbm(rr.xz * 3.0 + rr.y * 2.0 + uTime * 0.05, 3);
  vec3 e = vec3(0.02, 0.014, 0.012) + vec3(0.42, 0.12, 0.035) * smoothstep(-0.3, 0.7, rr.y) * sm * (1.0 + uFlash);
  e += coldCol() * 0.5 * pow(sat(dot(rr, normalize(LC))), 6.0);
  // the hall seen in the polish: dark columns against the fire-lit smoke
  float az = atan(rr.x, rr.z);
  e *= 0.35 + 0.65 * smoothstep(0.2, 0.6, abs(sin(az * 5.0 + 0.7)));
  e += vec3(1.0, 0.45, 0.15) * 0.6 * smoothstep(0.1, -0.15, rr.y) * smoothstep(-0.6, -0.15, rr.y);   // the fire-lit floor
  for (int i = 0; i < 4; i++) {
    vec3 dl = normalize(bowlFire(i) + vec3(0.0, 1.5, 0.0) - p);
    float c = dot(rr, dl);
    e += bowlCol(i) * (6.0 * smoothstep(0.985, 0.998, c) + 0.6 * pow(sat(c), 30.0));
  }
  return e;
}

vec3 cityHall(vec2 fc) {
  initHall();
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float id; float t = marchH(ro, rd, id);
  vec3 col = vec3(0.004, 0.0035, 0.004) + vec3(0.5, 0.12, 0.025) * smoothstep(0.75, 0.97, rd.z) * smoothstep(0.85, 0.2, rd.y) * (0.6 + 0.4 * fbm(rd.xy * 6.0 + uTime * 0.05, 3));
  if (id > 0.0) {
    vec3 p = ro + rd * t, n = normH(p, t), v = -rd;
    vec3 alb; float rough = 0.8, metal = 0.0;
    vec3 q = swordSpace(p);
    if (id == 1.0) {
      // polished basalt flags, cracked round the blade
      vec2 fl = voronoiEdge(p.xz * 0.22);
      vec2 cr = voronoiEdge(p.xz * 0.9 + 3.0);
      float r = length(p.xz);
      float crack = max(smoothstep(0.035, 0.0, cr.x) * exp(-r * 0.12), smoothstep(0.06, 0.0, abs(sin(atan(p.z, p.x) * 7.0 + fbm(p.xz * 0.5, 3) * 3.0)) * r * 0.3) * exp(-r * 0.15));
      float joint = smoothstep(0.03, 0.0, fl.x);
      alb = basaltAlb(p) * (0.8 + 0.4 * fl.y);
      alb *= 1.0 - 0.8 * max(joint, crack);
      rough = mix(0.25, 0.7, fbm(p.xz * 0.6, 3)) + 0.4 * max(joint, crack);
      n = bumpN(p, n, 2.0, 0.08);
      // the cracks hold a faint glow of heat near the blade
      col += vec3(1.0, 0.3, 0.06) * crack * 0.6 * exp(-r * 0.22) * (1.0 + 2.0 * uFlash);
    } else if (id == 2.0 || id == 3.0) {
      // cast and hammered bronze: warm metal, pitted, verdigris in every hollow and crevice,
      // scratches along the blade that catch the fire
      vec2 dent = voronoiEdge(q.xy * vec2(2.4, 1.5));
      float pits = smoothstep(0.6, 0.85, fbm(q.xy * vec2(9.0, 7.0) + q.z, 4));
      float crev = max(smoothstep(0.04, 0.0, dent.x) * 0.18 * smoothstep(0.4, 0.7, fbm(q.xy * 0.7, 2)), pits);
      float pat = smoothstep(0.5, 0.75, fbm(q * vec3(0.9, 0.35, 0.9) + 3.0, 4));
      vec3 bronze = vec3(0.78, 0.5, 0.26) * (0.9 + 0.12 * dent.y + 0.15 * smoothstep(0.0, 0.3, dent.x));
      vec3 verd = vec3(0.16, 0.36, 0.3) * (0.7 + 0.5 * fbm(q.xy * 12.0, 3));
      float vg = sat(crev * 0.9 + pat * 0.55);
      alb = mix(bronze, verd, vg);
      metal = 1.0 - vg;
      rough = mix(0.22, 0.8, vg) + 0.15 * pits;
      if (id == 2.0) {
        float ax = abs(q.x);
        float edge = smoothstep(BW * 0.82, BW * 0.97, ax);
        // honed edges stay bright; the scratches run along the length
        float scr = smoothstep(0.82, 0.97, vnoise(vec2(q.x * 60.0 + 3.0 * vnoise(vec2(q.y * 0.6, 1.0)), q.y * 0.6)));
        alb = mix(alb, vec3(1.0, 0.72, 0.42), edge * 0.8 * (1.0 - vg));
        rough = mix(rough, 0.12, edge * (1.0 - vg));
        alb += vec3(0.3, 0.2, 0.1) * scr * (1.0 - vg);
        rough -= 0.1 * scr;
        alb *= 0.4 + 0.6 * smoothstep(0.0, 3.5, q.y);      // darkened where it enters the stone
        n = bumpN(p, n, 3.0, 0.05 + 0.12 * pits);
      } else {
        n = bumpN(p, n, 4.0, 0.12);
      }
      rough = clamp(rough, 0.08, 0.95);
    } else if (id == 6.0) {
      // dark oiled leather, cracked and worn pale at the ridges
      float gy = q.y - GUARD - 8.5; float ang = atan(q.z, q.x);
      float band = fract(gy / 0.55 + ang / 6.2831853);
      alb = vec3(0.16, 0.09, 0.05) * (0.7 + 0.5 * fbm(vec2(ang * 6.0, gy * 3.0), 4));
      alb = mix(alb, vec3(0.34, 0.22, 0.13), smoothstep(0.35, 0.5, band) * smoothstep(0.65, 0.5, band) * 0.6);
      alb *= 0.35 + 0.65 * smoothstep(0.0, 0.12, band) * smoothstep(1.0, 0.88, band);   // dark grooves between the turns
      rough = 0.5; metal = 0.0;
      n = bumpN(p, n, 9.0, 0.25);
      col += alb * vec3(0.5, 0.15, 0.05) * 0.1;   // lit from the fire-glowing smoke all round
    } else if (id == 4.0) {
      alb = basaltAlb(p) * 1.3;
      // columnar joints
      alb *= 1.0 - 0.5 * smoothstep(0.92, 1.0, fract(p.y * 0.35 + hash11(floor(p.z / 22.0)) ));
      rough = 0.7;
      n = bumpN(p, n, 0.8, 0.15);
    } else {
      alb = bronzeAlb(p, rough) * 0.5; metal = 1.0; rough += 0.15;
    }
    float ao = aoH(p, n);
    for (int i = 0; i < 4; i++) {
      vec3 lp = bowlFire(i) + vec3(0.0, 1.2, 0.0);
      vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
      float sh = i < 2 ? shadowH(p + n * 0.05, lp) : 1.0;
      col += brdf(n, v, L, alb, rough, metal, bowlCol(i) * (i < 2 ? 260.0 : 900.0) / (d2 + 4.0)) * sh * mix(ao, 1.0, 0.4);
    }
    // the cold shaft from the high window
    {
      vec3 Lc = normalize(LC);
      float bm = beamMask(p);
      if (bm > 0.001) {
        float sh = 1.0, tt = 0.3;
        for (int k = 0; k < 24; k++) { float h = mapHd(p + n * 0.05 + Lc * tt); sh = min(sh, 8.0 * h / tt); tt += clamp(h, 0.3, 6.0); if (sh < 0.01 || tt > 60.0) break; }
        col += brdf(n, v, Lc, alb, rough, metal, coldCol() * bm * sat(sh));
      }
    }
    col += alb * (1.0 - metal) * vec3(0.012, 0.011, 0.014) * ao;
    if (metal > 0.5) {
      vec3 rr = reflect(rd, n);
      col += hallEnv(rr, p) * fresnelR(n, v, alb, metal) * (1.0 - rough) * ao;
      // a faint cold inner gleam in the bronze: the light of the fathers
      if (id == 2.0) col += vec3(0.55, 0.66, 0.9) * 0.035 * (0.6 + 0.4 * sin(q.y * 0.25 - uTime * 0.6)) * smoothstep(0.5, 0.9, fbm(q.xy * vec2(1.5, 0.25) + vec2(0.0, -uTime * 0.05), 3)) * (1.0 - smoothstep(BW * 0.7, BW, abs(q.x)));
      // the flash: a bright glint runs down the edge of the blade
      if (id == 2.0 && uGlint > -0.5) {
        float ax = abs(q.x);
        float band = exp(-pow((q.y - uGlint) / 2.5, 2.0)) * smoothstep(BW * 0.75, BW * 0.98, ax);
        col += vec3(1.0, 0.8, 0.5) * band * 9.0 * uFlash;
      }
    }
    col = mix(col, vec3(0.012, 0.007, 0.006), 1.0 - exp(-t * 0.008));
  }
  // far beyond the throne, in the smoke: one of the Nephilim, colossal and perfectly still
  if (id < 0.0) t = 5000.0;
  float gd;
  vec4 gi = nephilim(ro, rd, vec3(170.0, -120.0, 2400.0), 720.0, 0.0, vec3(1.0, 0.3, 0.07) * 1.6, vec3(0.62, 0.72, 0.95) * 0.6, gd);
  bool giHit = gi.a > 0.0 && gd < t;
  vec4 sm = smokeH(ro, rd, t);
  col = col * sm.a + sm.rgb;
  if (giHit) {
    float wisp = fbm(rd.xy * 8.0 / max(rd.z, 0.2) + vec2(uTime * 0.1, -uTime * 0.04), 4);
    col = mix(col, mix(gi.rgb, col, 0.4), gi.a * (0.85 - 0.3 * smoothstep(0.4, 0.75, wisp)));
  }
  for (int i = 0; i < 4; i++) {
    vec3 b = bowlFire(i) - vec3(0.0, 0.3, 0.0);
    col += flame(ro, rd, b, (i < 2 ? 5.5 : 9.0) * (1.0 + 0.35 * uFlash), 1.25, float(i) * 3.7, t, 2.2);
    col += bowlCol(i) * glowLine(ro, rd, b + vec3(0.0, 2.5, 0.0), t) * 0.006;
  }
  col += embers(ro, rd, t, 2, -10.0, 3.0, 8, 1.2, 1.1, vec3(-40.0, 0.0, -30.0), vec3(40.0, 90.0, 40.0), 0.6 * (1.0 + uFlash));
  return col;
}
`;
