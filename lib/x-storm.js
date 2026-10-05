// The storm world (shared by s13, s14, s15, s16, s32): a thin lens, the night sky under cloud, the
// volumetric cumulonimbus lit from within by lightning, and the open plain. Units are metres unless a
// scene says otherwise. Everything is a pure function of uTime.
export const STORM_UNIFORMS = {
  uFocus: 50, uAper: 0.0,
};

export const STORM_COMMON = /* glsl */ `
uniform float uFocus, uAper;

// a thin lens: rd0 is the pinhole ray (for sky and things at infinity), rd the lens ray
vec3 lensRay(vec2 fc, out vec3 ro, out vec3 rd0) {
  rd0 = camRay(fc, ro);
  if (uAper <= 0.0) return rd0;
  vec3 ww = normalize(uCamTarget - uCamPos);
  vec3 up = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
  vec3 uu = normalize(cross(ww, up)), vv = cross(uu, ww);
  vec3 fp = ro + rd0 * (uFocus / dot(rd0, ww));
  vec2 j = vec2(hash12(uJitter * 917.0 + 3.1 + fc * 0.0013), hash12(uJitter * 613.0 + 7.7 + fc.yx * 0.0017));
  float r = sqrt(j.x), th = 6.2831853 * j.y;
  ro += (uu * cos(th) + vv * sin(th)) * r * uAper;
  return normalize(fp - ro);
}

// a point glow (for sparks, lamps, fires): radiance a ray picks up passing a point at distance h
float pointGlow(vec3 ro, vec3 rd, vec3 c, float r, float depth) {
  vec3 oc = c - ro; float tc = dot(oc, rd);
  if (tc < 0.0 || tc > depth) return 0.0;
  float h2 = max(dot(oc, oc) - tc * tc, 0.0);
  return r * r / (h2 + r * r * 0.15);
}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// a 3D noise that is cheap enough for clouds (4 lookups of value noise)
float cloudFbm(vec3 p, int oct) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) { if (i >= oct) break; s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}
`;
