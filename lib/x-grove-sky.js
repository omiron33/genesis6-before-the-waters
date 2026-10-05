// Noe's grove, the sky: a dusk or night sky, the storm cloud over the land (a slab of cloud whose
// gap opens above the grove when grace breaks through: the gap is a column along the light, so the
// gold that falls on the grove, the hole in the cloud and the shaft in the haze all agree), and the
// wall of storm across the horizon (s25) with lightning inside it.
// Everything is a pure function of uTime and the scene's uniforms.

export const SKY_UNIFORMS = {
  uSunDir: [-0.45, 0.8, -0.4], uSunCol: [8.0, 6.2, 3.8], uSunVis: 0.0,
  uCloudAmb: [0.12, 0.1, 0.16], uSkyZen: [0.02, 0.02, 0.035], uSkyHor: [0.08, 0.07, 0.09], uAmbCol: [0.06, 0.06, 0.08],
  uGapR: 0.0, uGapC: [0.0, 0.0], uGrace: 0.0, uCloud: 0.7, uCloudLo: 0.0,
  uWall: 0.0, uWallAz: 0.0, uFlash: [0, 0, 0, 0], uBolt: [0, 0, 0, 0],
};

export const SKY_GLSL = /* glsl */ `
uniform vec3 uSunDir, uSunCol, uSkyZen, uSkyHor, uAmbCol, uCloudAmb;
uniform float uSunVis, uGapR, uGrace, uCloud, uCloudLo, uWall, uWallAz;
uniform vec2 uGapC;
uniform vec4 uFlash;    // az0, k0, az1, k1 (azimuths relative to the wall's centre)
uniform vec4 uBolt;     // az, k, seed, -

const float CB = 240.0, CT = 900.0;

// the gap in the cloud: a column along the light through uGapC on the ground plane
vec2 gapProj(vec3 p) { return p.xz - uSunDir.xz / max(uSunDir.y, 0.05) * p.y; }
float gapEdge(vec2 g) {
  if (uGapR <= 0.0) return 1e4;
  vec2 q = g + vec2(uTime * 1.5, 0.0);
  return length(g - uGapC) - uGapR * (0.7 + 0.5 * fbm(q * 0.012 + 1.3, 3) + 0.3 * (vnoise(q * 0.06) - 0.5));
}
// 1 where the gap's light reaches a point
float gapMask(vec3 p) { return 1.0 - smoothstep(-14.0, 14.0, gapEdge(gapProj(p))); }

float cloudD(vec3 p) {
  float hf = (p.y - CB) / (CT - CB);
  if (hf < 0.0 || hf > 1.0) return 0.0;
  vec3 q = p * vec3(0.0026, 0.004, 0.0026) + vec3(uTime * 0.012, -uTime * 0.004, uTime * 0.007);
  float n = fbm(q, 4);
  float shape = smoothstep(0.0, 0.1, hf) * smoothstep(1.0, 0.4, hf);
  float d = (n - 0.62 + 0.5 * uCloud) * 3.2 * shape;
  float ge = gapEdge(gapProj(p));
  d -= (1.0 - smoothstep(-30.0, 90.0, ge)) * 1.6;
  return max(d, 0.0);
}

vec3 skyBase(vec3 rd) {
  float e = rd.y;
  vec3 c = mix(uSkyHor, uSkyZen, pow(sat(e + 0.02), 0.55));
  float sd = max(dot(rd, uSunDir), 0.0);
  c += uSunCol * uSunVis * (pow(sd, 6.0) * 0.05 + pow(sd, 40.0) * 0.2);
  return c;
}

// the wall of storm across the horizon (uWall 0..1): returns the colour, coverage in w
vec4 stormWall(vec3 rd) {
  if (uWall <= 0.0) return vec4(0.0);
  float az = atan(rd.x, -rd.z) - uWallAz;
  float e = rd.y;
  float top = 0.17 + 0.1 * fbm(vec2(az * 2.2, 3.1), 4) + 0.025 * sin(az * 1.7 + 0.6);
  float cov = smoothstep(top + 0.004, top - 0.01, e) * uWall;
  if (cov <= 0.0) return vec4(0.0);
  float n = fbm(vec2(az * 7.0, e * 18.0) + vec2(uTime * 0.03, uTime * 0.05), 5);
  // the shelf: banded tiers of cloud, each lit a little along its upper lip
  float tier = fract(e / top * 3.2 + 0.35 * fbm(vec2(az * 4.0, e * 9.0), 3));
  float shelf = smoothstep(0.4, 0.95, tier) * smoothstep(1.0, 0.96, tier) * (0.3 + n);
  vec3 c = vec3(0.005, 0.006, 0.009) * (0.3 + 1.4 * n) + vec3(0.007, 0.008, 0.012) * shelf * smoothstep(0.03, 0.12, e);
  // the billowed top catches what little light the night has
  c += vec3(0.03, 0.035, 0.05) * smoothstep(top - 0.03, top, e) * n * n;
  // far-off flicker deep inside, never quite still
  float fl = smoothstep(0.72, 0.95, vnoise(vec2(uTime * 4.0, floor(az * 3.0) * 7.3))) * exp(-pow(fract(az * 3.0) - 0.5, 2.0) * 12.0);
  c += vec3(0.25, 0.3, 0.45) * 0.05 * fl * n * smoothstep(top, top - 0.08, e);
  // rain curtains falling from the base to the horizon
  float rain = smoothstep(top - 0.03, top - 0.08, e) * (0.5 + 0.5 * fbm(vec2(az * 70.0, e * 3.0 + uTime * 0.6), 3));
  c = mix(c, vec3(0.014, 0.016, 0.024), rain * 0.45);
  // lightning inside it: a broad glow through the cloud, brighter at its billows
  for (int k = 0; k < 2; k++) {
    float a0 = k == 0 ? uFlash.x : uFlash.z, kk = k == 0 ? uFlash.y : uFlash.w;
    if (kk <= 0.0) continue;
    float da = az - a0;
    float g = exp(-da * da / 0.05) * smoothstep(top + 0.03, top - 0.08, e) * smoothstep(-0.01, 0.06, e);
    float core = exp(-(da * da) / 0.01 - pow((e - top * 0.65) / 0.07, 2.0));
    c += vec3(0.55, 0.62, 0.9) * kk * (g * (0.25 + 1.6 * n * n) + core * 1.4 * n);
  }
  // a bolt from the cloud base to the ground
  if (uBolt.y > 0.0) {
    float yb = clamp(e / max(top * 0.7, 0.01), 0.0, 1.0);
    float off = (fbm(vec2(e * 90.0, uBolt.z), 4) - 0.5) * 0.05 + (fbm(vec2(e * 18.0, uBolt.z + 7.0), 3) - 0.5) * 0.06;
    float dx = abs(az - uBolt.x - off);
    float inb = step(e, top * 0.7) * step(-0.002, e);
    c += vec3(0.8, 0.85, 1.0) * uBolt.y * inb * (exp(-dx / 0.0009) * 18.0 + exp(-dx / 0.012) * 0.8);
  }
  return vec4(c, cov);
}

// the storm cloud through a ray; returns light in rgb, transmittance in a
vec4 cloudSlab(vec3 ro, vec3 rd, float tmax, float jit) {
  if (abs(rd.y) < 1e-3) return vec4(0, 0, 0, 1);
  float ta = (CB - ro.y) / rd.y, tb = (CT - ro.y) / rd.y;
  float t0 = max(min(ta, tb), 0.0), t1 = min(max(ta, tb), tmax);
  t1 = min(t1, t0 + 6000.0);
  if (t1 <= t0) return vec4(0, 0, 0, 1);
  float dt = (t1 - t0) / 20.0;
  vec3 L = vec3(0); float T = 1.0;
  for (int i = 0; i < 20; i++) {
    float t = t0 + (float(i) + jit) * dt;
    vec3 p = ro + rd * t;
    float d = cloudD(p);
    if (d > 0.002) {
      float hf = (p.y - CB) / (CT - CB);
      float ge = gapEdge(gapProj(p));
      float ls = cloudD(p + uSunDir * 110.0) * 2.0;
      vec3 sc = uCloudAmb * (0.25 + 1.2 * hf * hf) * (0.35 + 1.0 * exp(-ls * 0.8));
      // the walls of the gap lit gold by the light pouring through
      sc += uSunCol * uGrace * exp(-max(ge, 0.0) / 45.0) * 0.45 * exp(-ls * 1.2);
      float a = 1.0 - exp(-d * dt * 0.022);
      L += T * a * sc; T *= 1.0 - a;
      if (T < 0.02) break;
    }
  }
  float far = exp(-t0 * 0.00022);
  return vec4(L * far, mix(1.0, T, far));
}

// the underside of the storm cloud as a surface: heavy pendulous lumps (billows at two scales)
// hanging from a deck at CB, rising in ragged walls into the break; lit by the gold pouring through
// the break and, everywhere else, only by the dim storm light.
float billow(vec2 x) { float n = vnoise(x); return 1.0 - abs(2.0 * n - 1.0); }
float baseH(vec2 x, out float lump) {
  vec2 w = vec2(uTime * 1.2, uTime * 0.5);
  vec2 q = (x + w) * 0.0045;
  float l1 = billow(q) * 0.65 + billow(q * 2.1 + 3.7) * 0.35;
  float l2 = billow(q * 4.6 + 1.3);
  lump = l1;
  float b = CB + 160.0 * fbm(q * 0.35, 2) - 150.0 * l1 * l1 - 40.0 * l2;
  float ge = gapEdge(gapProj(vec3(x.x, CB, x.y)));
  b += 380.0 * (1.0 - smoothstep(-35.0, 50.0 + 50.0 * l1, ge));
  return b;
}
// the storm base as a volume: a soft shell of cloud above the lumpy surface baseH(), with billowed
// detail. Lit by the dim storm light (lighter on the lump bellies, dark in the creases and deeper
// in) and, near the break, by gold scattering through its ragged walls; brightest at the rim.
float cloudVol(vec3 p, out float lump, out float ge) {
  float b = baseH(p.xz, lump);
  float h = p.y - b;
  ge = gapEdge(gapProj(vec3(p.x, CB, p.z)));
  if (h < -40.0) return 0.0;
  float det = fbm(p * vec3(0.012, 0.02, 0.012) + vec3(uTime * 0.02, 0.0, 0.0), 3);
  return sat((h + 50.0 * det) / 22.0) * (0.45 + 1.1 * det);
}
vec4 cloudBase(vec3 ro, vec3 rd, float jit) {
  vec3 L = normalize(uSunDir);
  float sd = sat(dot(rd, L));
  // the clear sky above, seen through the break
  vec3 g = mix(uSunCol, vec3(dot(uSunCol, vec3(0.33))), 0.2);
  vec2 hp = ro.xz + rd.xz * (2600.0 - ro.y) / max(rd.y, 0.05);
  float ci = fbm(hp * 0.0012 + vec2(uTime * 0.01, 0.0), 4);
  vec3 above = smoothstep(0.1, 0.25, rd.y) * g * uGrace * ((0.05 + 0.12 * pow(sd, 3.0) + 0.35 * pow(sd, 24.0)) + 0.12 * smoothstep(0.45, 0.8, ci));
  if (rd.y < 0.002) return vec4(uSkyHor, 1.0);
  float t0 = max((CB - 160.0 - ro.y) / rd.y, 0.0);
  float t1 = (CB + 260.0 - ro.y) / rd.y;
  t1 = min(t1, t0 + 3500.0);
  float dt = (t1 - t0) / 26.0;
  vec3 acc = vec3(0); float T = 1.0;
  vec2 gc = uGapC + L.xz / max(L.y, 0.05) * CB;
  for (int i = 0; i < 26; i++) {
    float t = t0 + (float(i) + jit) * dt;
    vec3 p = ro + rd * t;
    float lump, ge;
    float d = cloudVol(p, lump, ge);
    if (d <= 0.001) continue;
    float depth = sat((p.y - baseH(p.xz, lump) + 40.0) / 220.0);
    // storm light: lit from below and the sides by the dusk, darker deeper in
    vec3 c = uCloudAmb * (0.2 + 1.3 * lump * lump * lump) * (1.0 - 0.85 * depth) * (0.4 + 0.8 * d);
    // gold through the break: strongest at the ragged rim, glowing into the walls
    float near = exp(-max(ge, 0.0) / 60.0);
    float rim = exp(-abs(ge + 6.0) / 16.0);
    c += uSunCol * uGrace * (near * 0.12 * (1.0 - 0.6 * depth) + rim * 0.45 * (0.4 + 0.9 * pow(sd, 2.0)) * (1.0 - 0.4 * depth));
    float a = 1.0 - exp(-d * dt * 0.035);
    acc += T * a * c; T *= 1.0 - a;
    if (T < 0.02) break;
  }
  float f = exp(-t0 * 0.0005) * smoothstep(0.03, 0.12, rd.y);
  vec3 hz = uSkyHor * (0.7 + 0.6 * smoothstep(0.12, 0.0, rd.y));
  vec3 c = acc + T * above;
  c = mix(hz, c, f);
  return vec4(c, 1.0);
}

// the whole sky behind everything (no terrain)
vec3 skyFull(vec3 ro, vec3 rd, float jit) {
  vec3 c = skyBase(rd);
  if (uCloud > 0.0) {
    vec4 cl = cloudBase(ro, rd, jit);
    c = mix(c, cl.rgb, uCloud);
  }
  vec4 w = stormWall(rd);
  c = mix(c, w.rgb, w.a);
  return c;
}
`;
