// The valley city of Cain's line, close up: shared GLSL for every city scene (s02, s07, s09, s22,
// s24, s26). Lens, fire, embers, materials (cyclopean stone, mud-brick, bronze, basalt), a small
// GGX BRDF and the dusk/night sky. Scene worlds (lib/x-city-*.js) define their own map and shading
// on top of these. Everything is a pure function of uTime.
export const CITY_UNIFORMS = { uFocus: 5.0, uAper: 0.0 };

export const CITY_GLSL = /* glsl */ `
uniform float uFocus, uAper;

// ---------- lens: thin-lens ray (rd0 is the pinhole ray, for sky/bokeh) ----------
vec3 lensRay(vec2 fc, out vec3 ro, out vec3 rd0) {
  rd0 = camRay(fc, ro);
  if (uAper <= 0.0) return rd0;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1 + uTime), hash12(uJitter * 613.0 + 7.7 - uTime));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}

// ---------- light ----------
// a small GGX: diffuse + specular for one light direction, radiance lc
vec3 brdf(vec3 n, vec3 v, vec3 L, vec3 alb, float rough, float metal, vec3 lc) {
  float nl = sat(dot(n, L));
  if (nl <= 0.0) return vec3(0);
  vec3 h = normalize(L + v);
  float nh = sat(dot(n, h)), nv = max(dot(n, v), 1e-3), vh = sat(dot(v, h));
  float a = max(0.02, rough * rough), a2 = a * a;
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * dd * dd);
  float k = a * 0.5;
  float G = nv / (nv * (1.0 - k) + k) * nl / (nl * (1.0 - k) + k);
  vec3 f0 = mix(vec3(0.04), alb, metal);
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - vh, 5.0);
  vec3 spec = D * G * F / (4.0 * nv * nl + 1e-3);
  vec3 dif = alb * (1.0 - metal) * (1.0 - F) / PI;
  return (dif + spec) * nl * lc;
}
vec3 fresnelR(vec3 n, vec3 v, vec3 alb, float metal) {
  vec3 f0 = mix(vec3(0.04), alb, metal);
  return f0 + (1.0 - f0) * pow(1.0 - sat(dot(n, v)), 5.0);
}

// fire colour from a temperature 0..1.3 (deep red -> orange -> yellow-white)
vec3 fireRamp(float k) {
  k = max(k, 0.0);
  return vec3(1.0, 0.22, 0.03) * smoothstep(0.0, 0.35, k) + vec3(0.0, 0.32, 0.08) * smoothstep(0.25, 0.7, k) + vec3(0.1, 0.25, 0.3) * smoothstep(0.65, 1.2, k);
}
// flicker of a fire with a seed (0.75..1.15)
float flick(float seed) { return 0.8 + 0.25 * vnoise(vec2(uTime * 7.0, seed)) + 0.1 * vnoise(vec2(uTime * 17.0, seed + 3.0)); }

// A flame: drawn on the vertical plane through its base that faces the ray. b = base point,
// h = height, w = width factor, seed, depth = opaque distance along the ray. Returns radiance.
vec3 flame(vec3 ro, vec3 rd, vec3 b, float h, float w, float seed, float depth, float gain) {
  vec2 dxz = rd.xz; float dd = dot(dxz, dxz);
  float t = dd > 1e-6 ? dot(b.xz - ro.xz, dxz) / dd : 0.0;
  if (t <= 0.0 || t > depth) return vec3(0);
  vec3 q = ro + rd * t - b;
  vec2 side = normalize(vec2(-rd.z, rd.x) + 1e-5);
  float x = dot(q.xz, side) / h, y = q.y / h;
  if (y < -0.2 || y > 1.6 || abs(x) > 1.2 * w + 0.3) return vec3(0);
  float tt = uTime;
  // rising turbulence bends and splits the flame into tongues
  float n1 = fbm(vec2(x * 3.0 + seed, y * 2.2 - tt * 3.2), 3) - 0.5;
  float n2 = fbm(vec2(x * 7.0 - seed * 1.7, y * 4.5 - tt * 6.0), 3);
  x += n1 * 0.55 * y + 0.1 * sin(tt * 2.3 + seed) * y * y;
  float yy = clamp(y, 0.0, 1.4);
  float wid = w * 0.42 * pow(max(1.0 - yy / 1.25, 0.0), 0.75) * sqrt(sat(yy * 5.0 + 0.15));
  float body = smoothstep(wid, wid * 0.25, abs(x));
  float tongues = smoothstep(0.25, 0.65, n2 + 0.75 * (1.0 - yy) - 0.15);
  float den = body * tongues * smoothstep(-0.12, 0.05, y);
  float temp = den * (1.15 - 0.75 * yy) * (0.8 + 0.4 * smoothstep(wid * 0.8, 0.0, abs(x)));
  return fireRamp(temp) * den * gain;
}
// the soft glow a light hangs in the haze along a ray (analytic point-light in-scattering)
float glowLine(vec3 ro, vec3 rd, vec3 c, float depth) {
  vec3 oc = c - ro; float tc = dot(oc, rd); float h2 = max(dot(oc, oc) - tc * tc, 1e-6); float h = sqrt(h2);
  return (atan((min(depth, 400.0) - tc) / h) + atan(tc / h)) / h;
}

// Embers drifting up in a world-space slab of vertical planes (normal ax: 0 = x-planes, 2 = z-planes).
// Planes from p0 to p0 + n*sp. cell = particle cell size (m). Returns radiance.
vec3 embers(vec3 ro, vec3 rd, float depth, int ax, float p0, float sp, int n, float cell, float rise, vec3 lo, vec3 hi, float gain) {
  vec3 acc = vec3(0);
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    float pl = p0 + float(i) * sp;
    float rc = ax == 0 ? rd.x : rd.z, oc = ax == 0 ? ro.x : ro.z;
    if (abs(rc) < 1e-4) continue;
    float t = (pl - oc) / rc;
    if (t <= 0.05 || t > depth) continue;
    vec3 p = ro + rd * t;
    if (any(lessThan(p, lo)) || any(greaterThan(p, hi))) continue;
    vec2 uv = vec2(ax == 0 ? p.z : p.x, p.y);
    float s = float(i) * 7.31;
    // rise and sway
    vec2 g = uv / cell;
    float sp2 = rise * (0.6 + 0.8 * hash11(s));
    g.y -= uTime * sp2 / cell;
    g.x += 0.35 * sin(uTime * 0.9 + g.y * 0.7 + s);
    vec2 id = floor(g), f = fract(g) - 0.5;
    float hsh = hash12(id + s);
    if (hsh > 0.14) continue;
    vec2 o = (hash22(id + s * 1.3) - 0.5) * 0.7;
    float r = length(f - o) * cell;
    float size = 0.004 * t / 3.0 + cell * 0.012;   // never smaller than a pixel or so
    float tw = 0.5 + 0.5 * sin(uTime * (6.0 + 9.0 * hash11(hsh * 91.0)) + hsh * 40.0);
    float life = sat(sin(fract(hsh * 13.0 + uTime * 0.15) * PI));
    acc += vec3(1.0, 0.42, 0.1) * smoothstep(size, 0.0, r) * (0.5 + tw) * life * (0.6 + hsh * 9.0) / (1.0 + t * 0.02) * exp(-max(p.y - lo.y, 0.0) / ((hi.y - lo.y) * 0.35));
  }
  return acc * gain;
}

float sdTorusY(vec3 p, float R, float r) { return length(vec2(length(p.xz) - R, p.y)) - r; }

// ---------- materials ----------
// cyclopean stone on a wall face: uv in metres. returns (edge distance m, block id, joint 0..1)
vec3 cyclo(vec2 uv, float size) {
  vec2 q = uv / size * vec2(0.8, 1.25);   // blocks wider than tall
  vec2 v = voronoiEdge(q);
  float e = v.x * size;
  return vec3(e, v.y, smoothstep(0.08, 0.0, e));
}
// surface bump: tilt a normal by the gradient of a 3D fbm (freq per metre, amt)
vec3 bumpN(vec3 p, vec3 n, float freq, float amt) {
  float e = 0.35 / freq;
  float c = fbm(p * freq, 3);
  vec3 g = vec3(fbm((p + vec3(e, 0, 0)) * freq, 3), fbm((p + vec3(0, e, 0)) * freq, 3), fbm((p + vec3(0, 0, e)) * freq, 3)) - c;
  g -= n * dot(g, n);
  return normalize(n - g * amt / (e * freq));
}
vec3 stoneAlb(vec3 p, float id) {
  float h2 = hash11(id * 71.0);
  vec3 base = mix(mix(vec3(0.36, 0.32, 0.27), vec3(0.42, 0.35, 0.27), id), vec3(0.3, 0.29, 0.28), h2 * 0.7);
  float m = fbm(p.xy * 1.3 + p.z * 0.7 + id * 9.0, 4);
  float lich = smoothstep(0.62, 0.72, fbm(p.xz * 0.9 + p.y * 0.5 + 4.0, 3));
  vec3 c = base * (0.55 + 0.75 * m);
  c = mix(c, vec3(0.16, 0.14, 0.12), lich * 0.6);     // soot and weathering stains
  c *= 0.8 + 0.2 * vnoise(p.xy * 18.0 + p.z * 5.0);
  c *= 0.72 + 0.45 * hash11(id * 13.0 + 2.0);              // each block its own stone
  c *= 1.0 - 0.35 * smoothstep(0.45, 0.8, fbm(vec2(p.x * 1.7 + p.z, p.y * 0.07), 3));   // weather streaks
  return c;
}
// mud-brick coursing: uv in metres (u along the wall, v up). returns (mortar 0..1, brick id)
vec2 mudbrick(vec2 uv) {
  vec2 b = vec2(0.42, 0.13);
  float row = floor(uv.y / b.y);
  float u = uv.x / b.x + 0.5 * mod(row, 2.0);
  vec2 f = vec2(fract(u), fract(uv.y / b.y));
  vec2 e = min(f, 1.0 - f) * b;
  float m = 1.0 - smoothstep(0.004, 0.014, min(e.x, e.y));
  return vec2(m, hash12(vec2(floor(u), row)));
}
vec3 mudAlb(vec3 p, vec2 uv) {
  vec2 mb = mudbrick(uv);
  vec3 c = mix(vec3(0.52, 0.38, 0.26), vec3(0.6, 0.45, 0.31), mb.y) * (0.7 + 0.45 * fbm(uv * 6.0, 4));
  c = mix(c, vec3(0.36, 0.28, 0.2), mb.x * 0.8);
  c *= 0.85 + 0.15 * hash12(floor(uv * 90.0));       // straw and grit
  return c;
}
vec3 bronzeAlb(vec3 p, out float rough) {
  float pat = smoothstep(0.55, 0.75, fbm(p * 1.7, 4));
  float wear = fbm(p * 9.0, 3);
  rough = mix(0.22, 0.6, pat) + 0.1 * wear;
  vec3 c = vec3(0.86, 0.55, 0.28) * (0.85 + 0.2 * wear);
  return mix(c, vec3(0.3, 0.32, 0.24), pat * 0.3);   // a little verdigris in the hollows
}
vec3 basaltAlb(vec3 p) {
  return vec3(0.07, 0.068, 0.066) * (0.7 + 0.6 * fbm(p.xz * 2.0 + p.y, 4));
}

// ---------- sky ----------
// the storm sky at dusk (dusk 1) or night (dusk 0); fireGlow lights the cloud bases from below
vec3 stormSky(vec3 rd, float dusk, float fireGlow) {
  float y = rd.y;
  vec3 hor = mix(vec3(0.035, 0.03, 0.05), vec3(0.16, 0.11, 0.17), dusk);
  vec3 zen = mix(vec3(0.006, 0.008, 0.014), vec3(0.03, 0.04, 0.06), dusk);
  vec3 c = mix(hor, zen, smoothstep(-0.05, 0.6, y));
  // cloud deck: fbm on a plane overhead, moving
  vec2 cp = rd.xz / max(y + 0.12, 0.05) * 1.3 + vec2(uTime * 0.05, uTime * 0.02);
  float cl = fbm(cp, 5);
  float dens = smoothstep(0.35, 0.75, cl);
  vec3 cloudLit = mix(vec3(0.02, 0.018, 0.025), vec3(0.09, 0.07, 0.1), dusk) * (0.5 + cl);
  cloudLit += vec3(0.5, 0.14, 0.04) * fireGlow * smoothstep(0.5, -0.02, y) * (0.4 + 0.8 * (1.0 - cl));
  c = mix(c, cloudLit, dens * smoothstep(-0.03, 0.08, y));
  c += vec3(0.6, 0.18, 0.05) * fireGlow * 0.25 * exp(-max(y, 0.0) * 9.0);
  return c;
}

// ---------- the Nephilim: a colossal, distant, perfectly still dark silhouette ----------
// Never close, never moving, never a face: a standing shape of a man far off in smoke, a spear
// upright beside it. Unit figure (height 1) with feet at the origin, facing -z.
float nephUnit(vec3 p) {
  float ang = atan(p.z, p.x);
  // a heavy ragged cloak hanging from broad shoulders to the ground: hides arms, torso and legs
  float cloak = sdRoundCone(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 0.7, 0.0), 0.25, 0.15);
  cloak -= 0.018 * vnoise(vec2(ang * 5.0, p.y * 9.0));
  cloak = max(cloak, -(p.y - 0.03 * vnoise(vec2(ang * 9.0, 1.0))));       // a torn hem
  float sh = sdEllipsoid(p - vec3(0.0, 0.73, 0.0), vec3(0.23, 0.065, 0.13));
  float d = smin(cloak, sh, 0.05);
  // a tall bronze helm with a crest running front to back
  float helm = sdRoundCone(p, vec3(0.0, 0.77, 0.0), vec3(0.0, 0.92, 0.01), 0.07, 0.045);
  float crest = sdEllipsoid(p - vec3(0.0, 0.95, 0.02), vec3(0.012, 0.055, 0.1));
  crest = max(crest, -(p.y - 0.925));
  d = smin(d, helm, 0.02);
  d = min(d, crest);
  // a great round shield on its left side, a boss at the centre
  vec3 q = p - vec3(-0.25, 0.44, -0.06);
  q.xz = rot(0.45) * q.xz;
  float shield = max(length(q.xy) - 0.19, abs(q.z) - 0.012 + 0.02 * dot(q.xy, q.xy));
  shield = min(shield, length(q - vec3(0.0, 0.0, -0.015)) - 0.035);
  d = min(d, shield);
  // the spear held upright on its right, a long leaf blade
  float spear = sdCapsule(p, vec3(0.25, 0.0, -0.02), vec3(0.25, 1.2, -0.02), 0.007);
  float blade = sdEllipsoid(p - vec3(0.25, 1.26, -0.02), vec3(0.016, 0.07, 0.006));
  return min(d, min(spear, blade));
}
// A giant of height H standing at base b, far off in smoke: never a clean solid. The ray's closest
// approach to the figure becomes a soft, smoke-broken coverage; only a rim of forge light below and
// a faint cold edge above are seen. Returns (rgb, coverage 0..1); dist gets the depth.
vec4 nephilim(vec3 ro, vec3 rd, vec3 b, float H, float yaw, vec3 forge, vec3 cold, out float dist) {
  dist = 1e9;
  vec3 o = (ro - b) / H; vec3 d = rd;
  o.xz = rot(yaw) * o.xz; d.xz = rot(yaw) * d.xz;
  vec3 c = vec3(0.0, 0.62, 0.0); vec3 oc = o - c;
  float bb = dot(oc, d), cc = dot(oc, oc) - 0.6;
  float disc = bb * bb - cc;
  if (disc < 0.0) return vec4(0.0);
  float t = max(-bb - sqrt(disc), 0.0), t1 = -bb + sqrt(disc);
  float mind = 1e9, tm = t; vec3 pm = o; bool hit = false;
  for (int i = 0; i < 48; i++) {
    vec3 p = o + d * t;
    float h = nephUnit(p);
    if (h < mind) { mind = h; tm = t; pm = p; }
    if (h < 0.001) { hit = true; break; }
    t += max(h * 0.9, 0.004);
    if (t > t1) break;
  }
  if (mind > 0.09) return vec4(0.0);
  // the edge is eaten by drifting smoke at the figure's own scale
  float n = fbm(pm.xy * 7.0 + vec2(uTime * 0.03, -uTime * 0.05), 4);
  float n2 = fbm(pm.xy * 22.0 + vec2(-uTime * 0.08, uTime * 0.02), 3);
  float e = mind - 0.025 * (n - 0.5) - 0.01 * (n2 - 0.5);
  float cov = smoothstep(0.035, -0.02, e);
  if (hit) cov = max(cov, 0.92);
  cov *= 0.75 + 0.25 * smoothstep(0.35, 0.7, fbm(pm.xy * 4.0 + vec2(uTime * 0.02, 1.0), 3));   // thin places
  // the rim: on the body only at grazing angles; off it, a thin band just outside the outline
  float rim;
  if (hit) {
    vec2 k = vec2(0.003, -0.003);
    vec3 nn = normalize(k.xyy * nephUnit(pm + k.xyy) + k.yyx * nephUnit(pm + k.yyx) + k.yxy * nephUnit(pm + k.yxy) + k.xxx * nephUnit(pm + k.xxx));
    rim = pow(1.0 - abs(dot(nn, d)), 5.0);
  } else {
    rim = 0.0;
  }
  // only in broken patches where the smoke thins: a shoulder, the crest, the spear blade
  rim *= smoothstep(0.52, 0.7, fbm(pm.xy * 5.0 + vec2(uTime * 0.04, -uTime * 0.02), 4));
  vec3 col = vec3(0.006, 0.004, 0.004);
  col += forge * rim * smoothstep(0.85, 0.15, pm.y);
  col += cold * rim * smoothstep(0.45, 0.95, pm.y) * 0.6;
  dist = tm * H;
  return vec4(col, cov);
}
`;
