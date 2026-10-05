// The open plain at dusk under the storm (s15): long grass rippling in the wind in the foreground,
// a low ridge across the middle distance with a herd of cattle moving slowly along its crest as dark
// silhouettes against the last band of light under the cloud deck, and above them a great flock of
// birds wheeling as a murmuration, small and far. Metres; ground near y = 0; looking along +z.
import { STORM_COMMON } from './x-storm.js';

export const PLAIN_UNIFORMS = { uFocus: 60, uAper: 0.0, uLeave: 0 };

export const PLAIN_GLSL = STORM_COMMON + /* glsl */ `
uniform float uLeave;   // 0..1: the flock turning away and streaming off into the storm

const float ZC = 75.0;       // the ridge's crest line
float ridgeY(float x) { return 5.2 + 1.2 * sin(x * 0.02 + 1.0) + 0.8 * fbm(vec2(x * 0.03, 3.0), 3); }
float terrainH(vec2 xz) {
  float x = xz.x, z = xz.y;
  // the field rises gently to the ridge and falls away behind it
  float rise = ridgeY(x) * (z < ZC ? exp(-pow((z - ZC) / 30.0, 2.0)) : exp(-pow((z - ZC) / 14.0, 2.0)));
  float h = rise + 0.6 * fbm(xz * 0.03, 3) - 0.3;
  return h;
}
// long grass: tufts bent by the wind, only near the camera (beyond, the shading carries it)
float grassH(vec2 xz, float t) {
  if (t > 40.0) return 0.0;
  vec2 w = xz + vec2(0.0, 0.35) * sin(uTime * 2.2 + xz.x * 0.4 + xz.y * 0.3) * 0.3;
  float tuft = pow(vnoise(w * 16.0), 3.0) * 0.3 + pow(vnoise(w * 40.0 + 4.0), 4.0) * 0.18;
  return tuft * smoothstep(40.0, 10.0, t);
}
float mapP(vec3 p, float t) { return p.y - terrainH(p.xz) - grassH(p.xz, t); }
float marchP(vec3 ro, vec3 rd) {
  float t = 0.2;
  for (int i = 0; i < 260; i++) {
    vec3 p = ro + rd * t;
    float d = mapP(p, t);
    if (d < 0.002 * t) return t;
    t += max(d * 0.45, 0.01 + t * 0.002);
    if (t > 600.0) break;
  }
  return rd.y < 0.0 ? 600.0 : -1.0;
}
vec3 normP(vec3 p, float t) {
  float e = 0.01 + 0.002 * t;
  return normalize(vec3(mapP(p - vec3(e, 0, 0), t) - mapP(p + vec3(e, 0, 0), t), 2.0 * e, mapP(p - vec3(0, 0, e), t) - mapP(p + vec3(0, 0, e), t)));
}

// the sky: a heavy storm deck overhead with a band of last light under its edge on the horizon
vec3 duskSky(vec3 rd) {
  float y = rd.y;
  float az = atan(rd.x, rd.z);
  // the clear band low down: warm at the bottom, bruised violet above
  vec3 band = mix(vec3(1.4, 0.62, 0.26), vec3(0.5, 0.22, 0.36), smoothstep(0.02, 0.12, y));
  band *= 0.45 + 0.55 * exp(-pow(az + 0.15, 2.0) * 3.0);   // brightest a little left of centre
  vec3 c = band * exp(-max(y - 0.03, 0.0) * 9.0) * 0.9;
  // the cloud deck: its base lit underneath by the band, dark above
  vec2 cp = rd.xz / max(y + 0.05, 0.02);
  float cl = fbm(cp * 0.35 + vec2(uTime * 0.02, uTime * 0.05), 6);
  float deck = smoothstep(0.1, 0.17, y + 0.06 * (cl - 0.5));
  vec3 deckC = mix(vec3(0.07, 0.045, 0.06), vec3(0.016, 0.015, 0.026), smoothstep(0.12, 0.6, y));
  deckC += vec3(0.6, 0.24, 0.16) * pow(sat(1.0 - (y - 0.1) * 4.0), 3.0) * smoothstep(0.35, 0.8, cl) * 0.5 * (0.45 + 0.55 * exp(-pow(az + 0.15, 2.0) * 3.0));
  deckC *= 0.35 + 1.1 * smoothstep(0.25, 0.75, cl);
  c = mix(c, deckC, deck);
  // rain hanging under the deck far off to the right
  float rain = smoothstep(0.2, 0.6, az) * smoothstep(0.1, 0.0, y) * (0.5 + 0.5 * fbm(vec2(az * 40.0, y * 3.0), 3));
  c = mix(c, vec3(0.06, 0.05, 0.07), rain * 0.6);
  return c;
}

// the cattle on the crest, side-on silhouettes in the crest plane (x along the ridge, y up)
float cow(vec2 q, float ph, float s, float graze) {
  q /= s;
  float bob = 0.02 * sin(ph * 2.0);
  vec3 p3 = vec3(q.x, q.y - bob, 0.0);
  // barrel body, a deep chest and a hump at the withers, a little lower at the rump
  float body = sdCapsule(p3, vec3(-0.62, 1.12, 0.0), vec3(0.5, 1.15, 0.0), 0.3);
  body = smin(body, sdCapsule(p3, vec3(0.35, 1.0, 0.0), vec3(0.55, 1.26, 0.0), 0.27), 0.1);
  body = smin(body, sdCapsule(p3, vec3(-0.2, 0.96, 0.0), vec3(0.3, 0.94, 0.0), 0.22), 0.15);
  // neck down to a grazing-height head, swinging slowly
  float hs = 0.06 * sin(ph * 0.5) - 0.42 * graze + 0.03 * graze * sin(uTime * 1.3 + s * 9.0);
  float neck = sdRoundCone(p3, vec3(0.62, 1.2, 0.0), vec3(0.95, 0.95 + hs, 0.0), 0.2, 0.11);
  float head = sdRoundCone(p3, vec3(0.95, 0.98 + hs, 0.0), vec3(1.12, 0.74 + hs, 0.0), 0.11, 0.07);
  float horn = min(sdCapsule(p3, vec3(0.97, 1.05 + hs, 0.0), vec3(1.04, 1.17 + hs, 0.0), 0.022), sdCapsule(p3, vec3(0.93, 1.05 + hs, 0.0), vec3(0.88, 1.15 + hs, 0.0), 0.02));
  float d = min(min(body, smin(neck, head, 0.05)), horn);
  // four legs, walking
  for (int i = 0; i < 4; i++) {
    float fx = i < 2 ? 0.45 : -0.55;
    float off = (i == 0 || i == 3) ? 0.0 : 3.14159;
    float sw = sin(ph + off) * 0.14;
    float lift = 0.05 * max(0.0, cos(ph + off));
    vec3 hip = vec3(fx + (i % 2 == 0 ? 0.05 : -0.05), 0.95, 0.0);
    vec3 knee = vec3(fx + sw * 0.5 + (i < 2 ? 0.0 : -0.04), 0.48 + lift, 0.0);
    vec3 hoof = vec3(fx + sw, 0.03 + lift, 0.0);
    d = min(d, sdRoundCone(vec3(q, 0.0), hip, knee, 0.09, 0.05));
    d = min(d, sdCapsule(vec3(q, 0.0), knee, hoof, 0.04));
  }
  float tail = sdCapsule(p3, vec3(-0.9, 1.18, 0.0), vec3(-0.98 + 0.03 * sin(uTime * 3.0 + ph), 0.62, 0.0), 0.025);
  return min(d, tail) * s;
}
float herd(vec2 xy, out float any) {
  float d = 1e9; any = 0.0;
  float x0 = -44.0;
  for (int i = 0; i < 13; i++) {
    float fi = float(i);
    // loose groups: mostly close, now and then a long gap
    x0 += hash11(fi * 3.1) > 0.75 ? 8.0 + 6.0 * hash11(fi * 4.4) : 2.4 + 2.2 * hash11(fi * 5.9);
    float graze = step(0.72, hash11(fi * 8.3));                 // some stand grazing
    float sp = mix(0.4 + 0.5 * hash11(fi * 5.3), 0.03, graze);
    float x = x0 + (uTime - 80.0) * sp;
    float s = hash11(fi * 6.1) > 0.85 ? 0.62 : 0.92 + 0.3 * hash11(fi * 7.7);   // a few calves
    vec2 q = vec2(xy.x - x, xy.y - ridgeY(x) + 0.05);
    if (abs(q.x) > 3.0) continue;
    float ph = uTime * (2.2 + 2.0 * sp) * (1.0 - graze) + fi * 2.0;
    d = min(d, cow(q, ph, s, graze));
  }
  return d;
}

// the murmuration: a living cloud of birds far off over the ridge, in three depths
float flockDensity(vec2 p, float layer) {
  // the flock's centre drifts and at the end streams away to the right and up into the storm
  vec2 c = vec2(-14.0 + 10.0 * sin(uTime * 0.35), 64.0 + 7.0 * sin(uTime * 0.27 + 1.0));
  c += uLeave * vec2(120.0, 22.0);
  vec2 q = p - c;
  // the shape folds and turns: a rotating, breathing ribbon
  float a = uTime * 0.5 + layer * 0.4 + 0.8 * sin(uTime * 0.3);
  q = rot(a * 0.4) * q;
  q.x /= 1.0 + 1.2 * uLeave;
  vec2 w = q + 14.0 * (vec2(fbm(q * 0.03 + uTime * 0.12, 3), fbm(q * 0.03 + 7.0 - uTime * 0.1, 3)) - 0.5);
  // a murmuration's shape: a long ribbon that bends back on itself, thick and thin along its length
  float ph = uTime * 0.7 + layer * 0.3;
  float yc = 9.0 * sin(w.x * 0.05 + ph) + 5.0 * sin(w.x * 0.11 - ph * 1.3);
  float thick = 5.0 + 6.0 * (0.5 + 0.5 * sin(w.x * 0.07 + ph * 0.8)) ;
  float ribbon = exp(-pow((w.y - yc) / thick, 2.0)) * smoothstep(68.0, 40.0, abs(w.x));
  // a denser knot where it folds
  float knot = exp(-dot(w - vec2(18.0 * sin(ph * 0.6), yc), w - vec2(18.0 * sin(ph * 0.6), yc)) / 140.0);
  float folds = fbm(w * 0.08 + vec2(uTime * 0.25, 0.0), 3);
  return sat(ribbon * (0.55 + 0.6 * folds) + knot * 0.6) * (1.0 - 0.45 * uLeave);
}
float birds(vec3 ro, vec3 rd, float maxT) {
  float cover = 0.0;
  for (int L = 0; L < 3; L++) {
    float z = 220.0 + 40.0 * float(L);
    float tt = (z - ro.z) / rd.z;
    if (tt <= 0.0 || tt > maxT) continue;
    vec3 p = ro + rd * tt;
    vec2 xy = p.xy;
    float cs = 0.36;
    vec2 cell = floor(xy / cs);
    float pw = tt * 2.0 * tan(radians(uFov) * 0.5) / uRes.y;   // metres per pixel here
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 cc = cell + vec2(i, j);
      float h = hash12(cc + float(L) * 17.0);
      // each bird wanders within the flow
      vec2 o = (hash22(cc + 3.0) - 0.5) * cs + 0.25 * vec2(sin(uTime * 2.0 + h * 40.0), cos(uTime * 1.7 + h * 30.0));
      vec2 bp = (cc + 0.5) * cs + o;
      float dens = flockDensity(bp, float(L));
      if (h > dens) continue;
      float flap = 0.6 + 0.4 * abs(sin(uTime * 14.0 + h * 50.0));
      vec2 d = xy - bp;
      float r = 0.15 * flap;
      float a = sat((r + pw * 0.6 - length(d * vec2(0.6, 1.4))) / (pw * 1.2));
      cover = max(cover, a * 0.9);
    }
  }
  return cover;
}

// tall grass blades just in front of the lens, bent by the wind, silhouetted against the light
vec4 blades(vec3 ro, vec3 rd) {
  vec4 acc = vec4(0);
  for (int k = 0; k < 6; k++) {
    float z = 1.4 + 0.75 * float(k);
    float tt = (z - ro.z) / rd.z;
    if (tt <= 0.0) continue;
    vec3 p = ro + rd * tt;
    float cw = 0.06;
    float yb = p.y - terrainH(p.xz) + 0.05;
    float cx = floor((p.x - 0.17 * yb * yb) / cw);
    for (int j = -3; j <= 3; j++) {
      float c = cx + float(j);
      float h = hash12(vec2(c, float(k) * 7.0));
      if (h < 0.35) continue;
      float x0 = (c + 0.5) * cw + (hash12(vec2(c, 3.0 + float(k))) - 0.5) * cw;
      float H = 0.35 + 0.7 * pow(hash12(vec2(c, 9.0 + float(k))), 0.7);
      float y = p.y - terrainH(vec2(x0, z)) + 0.05;
      if (y < 0.0 || y > H) continue;
      float u = y / H;
      // the wind bends the blade over toward the right, gusting
      float gust = 0.5 + 0.5 * sin(uTime * 2.4 + x0 * 2.0 + float(k)) * (0.6 + 0.4 * vnoise(vec2(uTime * 1.3, x0)));
      float bend = (0.12 + 0.18 * gust) * u * u * H;
      float w = 0.004 * (1.0 - u * 0.85);
      float dx = abs(p.x - x0 - bend);
      float pw = tt * 2.0 * tan(radians(uFov) * 0.5) / uRes.y;
      float a = sat((w + pw * 0.5 - dx) / pw);
      if (a > acc.a) acc = vec4(vec3(u, gust, 0.0), a);
      // a seed head on some
      if (h > 0.8) {
        vec2 hq = vec2(p.x - x0 - bend * 1.05, p.y - terrainH(vec2(x0, z)) + 0.05 - H);
        float hd = length(hq / vec2(0.006, 0.03)) - 1.0;
        float ah = sat((-hd * 0.006 + pw * 0.5) / pw);
        if (ah > acc.a) acc = vec4(1.0, gust, 0.0, ah);
      }
    }
  }
  return acc;
}

vec3 plainScene(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float t = marchP(ro, rd);
  vec3 col;
  float depth = 1e4;
  vec3 sky = duskSky(rd0);
  if (t > 0.0) {
    vec3 p = ro + rd * t; depth = t;
    vec3 n = normP(p, t);
    // the grass: dun and olive, its tips catching the band of light as the wind bends them
    // gusts sweep across the field toward us: where the grass bends over, its pale undersides and
    // tips turn to the light in travelling bands; between them it is combed into long streaks
    float wave = sin(dot(p.xz, vec2(0.35, 0.8)) * 0.8 + uTime * 3.2 + 2.5 * fbm(p.xz * 0.06, 3));
    float gust = smoothstep(0.0, 0.9, wave) * smoothstep(0.2, 0.7, fbm(p.xz * vec2(0.15, 0.3) - vec2(uTime * 0.3, uTime * 0.8), 3));
    float comb = fbm(vec2(p.x * 9.0 + p.z * 1.5, p.z * 0.5 - uTime * 0.6), 4);
    vec3 alb = mix(vec3(0.2, 0.18, 0.12), vec3(0.3, 0.27, 0.18), fbm(p.xz * 0.5, 3)) * (0.6 + 0.8 * comb);
    vec3 Ldir = normalize(vec3(-0.3, 0.08, 1.0));
    vec3 band = vec3(1.0, 0.55, 0.3);
    // lit by the last light ahead (through the blades: translucency) and the dim sky above
    float trans = pow(sat(dot(rd, Ldir) * 0.5 + 0.5), 3.0);
    vec3 lit = band * (0.13 + 0.16 * gust) * (0.4 + 0.6 * trans) + vec3(0.09, 0.07, 0.1) * (0.5 + 0.5 * n.y);
    col = alb * lit * (1.0 + 1.5 * gust);
    // backlit by the band of light: the bent tips glow at their edges
    float rim = pow(1.0 - sat(dot(n, -rd)), 3.0) * smoothstep(30.0, 3.0, t);
    col += vec3(0.9, 0.45, 0.25) * 0.08 * rim * (0.5 + gust);
    // haze toward the band of light
    col = mix(col, vec3(0.05, 0.03, 0.045), 1.0 - exp(-t * 0.004));
  } else {
    col = sky;
    // (a ray that slipped past the ground below the crest is ground)
    float tc = (ZC - ro.z) / rd.z;
    if (ro.y + rd.y * tc < ridgeY(ro.x + rd.x * tc) - 0.2) { col = vec3(0.012, 0.01, 0.012); depth = tc; }
  }
  // the herd on the crest (in front of the sky, behind nothing beyond it)
  {
    float tt = (ZC - ro.z) / rd.z;
    if (tt > 0.0 && tt < depth + 1.0) {
      vec3 p = ro + rd * tt;
      float any;
      float d = herd(p.xy, any);
      float pw = tt * 2.0 * tan(radians(uFov) * 0.5) / uRes.y;
      float a = sat((pw * 0.7 - d) / (pw * 1.4));
      col = mix(col, vec3(0.012, 0.01, 0.012), a);
    }
  }
  // the flock
  float b = birds(ro, rd0, depth);
  col = mix(col, vec3(0.012, 0.01, 0.014), b);
  vec4 g = blades(ro, rd);
  vec3 gc = vec3(0.012, 0.01, 0.01) + vec3(1.0, 0.5, 0.25) * 0.05 * g.x * g.x * (0.6 + 0.4 * g.y);
  col = mix(col, gc, g.a);
  return col;
}
`;
