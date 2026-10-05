// The flood world's shared storm: a thin lens, the night storm sky (clouds lit from inside by
// lightning, an optional parting), lightning bolts, rain streaks lit by whatever light is near
// them, and wind-blown rain sheets. Worlds that include this define `vec3 rainLight(vec3 p)`.
// Everything is a pure function of uTime and the uniforms below.

export const SKY_UNIFORMS = {
  uFocus: 40, uAper: 0.0,
  uRain: 1.0,            // 0 dry .. 1 heavy rain
  uWind: 0.25,           // slant of the rain (x per y)
  uFlash: 0.0,           // lightning light on the world
  uLightDir: [0.3, 0.8, -0.5],
  uBolt: [0, 0, 0],      // bolt foot (x, z) and a seed in y
  uBoltOn: 0.0,          // how much of the bolt is visible
  uPart: 0.0,            // the parting of the cloud above (0 none)
  uPartDir: [0, 0.8, -0.6],
  uSkyLift: 1.0,         // overall cloud brightness
  uRainTint: [1, 1, 1],
  uWhite: 0.0,           // full-frame white of a lightning flash (cuts into and out of the vision)
  uSway: 0.5,            // wind in the trees
  uMoonDir: [0.6, 0.15, 0.6],   // where the moon glows behind the cloud
};

// Lightning: a pure function of song time from a list of strike times.
export function flashAt(t, strikes) {
  let f = 0, bolt = 0, last = null;
  for (const s of strikes) {
    const x = t - s.t;
    if (x < -0.02 || x > 1.6) continue;
    // a main stroke with two restrikes, flickering
    const k = s.k ?? 1;
    const pulse = (a, w) => Math.exp(-Math.max(0, x - a) / w) * (x >= a ? 1 : Math.exp(-(a - x) * 200));
    const v = k * (pulse(0, 0.07) + 0.7 * pulse(0.11, 0.05) + 0.45 * pulse(0.26, 0.12) + 0.08 * pulse(0.0, 0.6));
    if (v > f) { f = v; last = s; }
    if (s.bolt) bolt = Math.max(bolt, Math.min(1, v * 1.5));
  }
  return { flash: f, bolt, s: last };
}
// Lightning direction: the world-space direction toward a strike, from its foot (x, z).
export const toward = (from, x, y, z) => { const d = [x - from[0], y - from[1], z - from[2]]; const l = Math.hypot(...d); return d.map((v) => v / l); };

export const SKY_GLSL = /* glsl */ `
uniform float uFocus, uAper;
uniform float uRain, uWind, uFlash, uBoltOn, uPart, uSkyLift;
uniform vec3 uLightDir, uBolt, uPartDir, uRainTint;
uniform float uWhite, uSway;
uniform vec3 uMoonDir;
vec3 whiteOut(vec3 c) { return mix(c, vec3(30.0, 31.0, 34.0), uWhite); }

vec3 rainLight(vec3 p);

// thin lens: returns the ray from a sampled point on the aperture through the focus plane
vec3 lensRay(vec2 fc, out vec3 ro, out vec3 rd0) {
  rd0 = camRay(fc, ro);
  if (uAper <= 0.0) return rd0;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1), hash12(uJitter * 613.0 + 7.7));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}

// the cloud deck over the world, seen along rd
float cloudN(vec3 rd) {
  vec2 uv = rd.xz / (max(rd.y, 0.0) + 0.08);
  vec2 w = vec2(uTime * 0.05, uTime * 0.012);
  vec2 q = uv * 0.42 + w;
  vec2 warp = vec2(fbm(q * 0.7 + 3.1, 2), fbm(q * 0.7 + 8.3, 2)) - 0.5;
  float n = fbm(q + warp * 1.6, 5);
  float n2 = fbm(uv * 2.4 - w * 2.3 + warp * 2.0, 3);
  return n * 0.85 + n2 * 0.22 + 0.02;
}
vec3 stormSky(vec3 rd) {
  float y = rd.y;
  float n = cloudN(rd);
  vec2 uv = rd.xz / (max(y, 0.0) + 0.08);
  float fine = fbm(uv * 5.0 + vec2(uTime * 0.12, 0.0), 4);
  // heavy billows: thick cloud dark violet-slate, thinner cloud glowing with the moon behind it
  float thick = smoothstep(0.25, 0.85, n + (fine - 0.5) * 0.12);
  vec3 thin = vec3(0.085, 0.09, 0.125), dark = vec3(0.018, 0.02, 0.03);
  vec3 c = mix(thin, dark, thick);
  // lit rims where the billows turn
  float rim = smoothstep(0.06, 0.0, abs(n - 0.5) - 0.02) * 0.35;
  c += vec3(0.06, 0.065, 0.085) * rim;
  // toward the horizon the far rain and haze glow slate-teal
  c = mix(c, vec3(0.07, 0.085, 0.10), smoothstep(0.3, 0.0, y) * 0.75);
  // the moon behind the cloud: a pale glow, strongest through the thin cloud
  float md = sat(dot(rd, normalize(uMoonDir)));
  c += vec3(0.30, 0.32, 0.38) * (pow(md, 6.0) * 0.16 + pow(md, 40.0) * 0.35) * (1.0 - 0.7 * thick);
  c *= uSkyLift;
  // lightning lights the cloud from inside: brightest toward the strike, in the thicker cloud
  float g = pow(sat(dot(rd, normalize(uLightDir)) * 0.5 + 0.5), 5.0);
  c += vec3(0.55, 0.6, 0.85) * uFlash * (0.12 + 1.6 * g) * (0.3 + smoothstep(0.3, 1.0, n)) * 0.35;
  // a parting in the cloud: a soft rift of pale gold-silver
  if (uPart > 0.0) {
    float a = dot(rd, normalize(uPartDir));
    float rift = smoothstep(0.94 - 0.03 * uPart, 0.995, a + 0.06 * (n - 0.5));
    float open = rift * (1.0 - smoothstep(0.3, 0.7, n));      // only through the thinning cloud
    c = mix(c, vec3(0.26, 0.25, 0.25), open * uPart * 0.85);
    // the torn edges of the cloud round the rift catch a pale gold
    c += vec3(1.0, 0.82, 0.55) * rift * uPart * 0.12 * smoothstep(0.25, 0.0, abs(n - 0.5));
  }
  if (y < 0.0) c *= 0.6;
  return c;
}

// a cheap sky for glossy reflections
vec3 stormSkyLo(vec3 rd) {
  vec3 c = mix(vec3(0.07, 0.085, 0.10), vec3(0.05, 0.055, 0.08), sat(rd.y * 2.0)) * uSkyLift;
  float md = sat(dot(rd, normalize(uMoonDir)));
  c += vec3(0.30, 0.32, 0.38) * (pow(md, 6.0) * 0.16 + pow(md, 40.0) * 0.3) * uSkyLift;
  float g = pow(sat(dot(rd, normalize(uLightDir)) * 0.5 + 0.5), 5.0);
  c += vec3(0.55, 0.6, 0.85) * uFlash * (0.12 + 1.6 * g) * 0.4;
  return rd.y < 0.0 ? c * 0.6 : c;
}

// a lightning bolt hanging in a vertical plane facing the camera at the strike: returns light
vec3 boltGlow(vec3 ro, vec3 rd, float depth) {
  if (uBoltOn <= 0.001) return vec3(0);
  vec3 foot = vec3(uBolt.x, -40.0, uBolt.z);
  vec3 n = normalize(vec3(ro.x - foot.x, 0.0, ro.z - foot.z));
  float dn = dot(rd, n); if (abs(dn) < 1e-4) return vec3(0);
  float t = dot(foot - ro, n) / dn; if (t < 0.0 || t > depth) return vec3(0);
  vec3 q = ro + rd * t - foot;
  vec3 side = normalize(cross(vec3(0, 1, 0), n));
  float x = dot(q, side), h = q.y;
  float top = 420.0;
  if (h < 0.0 || h > top) return vec3(0);
  float sd = uBolt.y;
  // jagged path: summed zigzags
  float px = 0.0, a = 30.0, f = 0.012;
  for (int i = 0; i < 5; i++) { px += a * (vnoise(vec2(h * f, sd + float(i) * 7.0)) - 0.5); a *= 0.5; f *= 2.3; }
  float d = abs(x - px);
  // a branch
  float hb = 0.55 * top;
  float bx = px + (h - hb) * 0.5 * (h > hb ? 1.0 : 0.0) + 8.0 * (vnoise(vec2(h * 0.05, sd + 40.0)) - 0.5);
  float db = h > hb && h < hb + 120.0 ? abs(x - bx) : 1e4;
  float pw = t * 0.0011;
  float core = exp(-d / max(pw * 1.2, 0.3)) + 0.4 * exp(-db / max(pw, 0.25));
  float halo = exp(-d / (6.0 + t * 0.006)) * 0.15 + exp(-db / 6.0) * 0.05;
  return vec3(0.75, 0.82, 1.0) * (core * 14.0 + halo * 2.0) * uBoltOn;
}

// rain streaks in depth layers in front of the camera, each lit by rainLight
vec3 rainStreaks(vec3 ro, vec3 rd, float depth) {
  if (uRain <= 0.001) return vec3(0);
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
  float rdw = dot(rd, ww);
  vec3 acc = vec3(0);
  float fall = uTime * 9.0;
  for (int k = 0; k < 26; k++) {
    float dist = 2.2 * pow(1.13, float(k));
    float t = dist / rdw;
    if (t > depth) break;
    vec3 p = ro + rd * t;
    float sc = 1.0 + dist * 0.06;
    vec2 cell = vec2(0.09, 1.1) * sc;
    vec2 q = vec2(dot(p, uu) - uWind * (p.y + fall), p.y + fall + float(k) * 0.37);
    vec2 cc = floor(q / cell);
    float h = hash12(cc + float(k) * 17.3);
    if (h > uRain * 0.6) continue;
    vec2 o = (hash22(cc + float(k) * 3.1) - 0.5) * cell * vec2(0.6, 0.2);
    vec2 f = q - (cc + 0.5) * cell - o;
    float len = 0.16 * sc;
    float d = length(vec2(f.x, max(abs(f.y) - len, 0.0)));
    float pw = t * 2.0 * tan(radians(uFov) * 0.5) / uRes.y;
    float r = 0.0009 + 0.0006 * hash12(cc + 9.0);
    float a = sat((r + pw * 0.8 - d) / (pw * 1.6)) * min(1.0, r / pw * 1.5);
    if (a <= 0.0) continue;
    float along = sat(0.5 + f.y / (2.0 * len));
    acc += rainLight(p) * a * (0.5 + 0.5 * along) * smoothstep(0.3, 1.0, t);
  }
  return acc * uRainTint * 0.45;
}

// wind-driven sheets of rain: soft moving density across the view
float rainSheets(vec3 rd) {
  float az = atan(rd.x, rd.z);
  vec2 q = vec2(az * 6.0 - uTime * 1.1 * sign(uWind + 1e-3), rd.y * 2.5 + uTime * 0.35);
  return fbm(q, 3);
}
`;
