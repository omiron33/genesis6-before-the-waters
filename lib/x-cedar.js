// The cedar of Lebanon, reusable. A tree is grown here in JS (deterministic from its seed) as a
// skeleton of tapered wood (trunk, the leaders it forks into, long near-horizontal limbs) and a set
// of wide, flat, ragged plates of foliage carried on the limb ends: broken tiers with gaps between
// them through which the trunk and limbs show. Old trees fork and go flat-topped; young ones are
// still narrow and layered. The GLSL draws any number of them as signed distances, with deep
// furrowed, scaly bark and an analytic shadow through the plates.
//
// Use:
//   const trees = growCedars([{ base: [x, y, z], h, r0, spread, seed, young }, ...]);
//   const glsl = cedarGLSL(trees);      // after the engine's COMMON (glsl.js)
// then in the scene's GLSL:
//   float part; vec3 lq; float d = cedarSD(p, i, part, lq);   // part 2 wood, 3 foliage; lq local
//   cedarVis(p, L)      soft visibility of the light L through all trees (0..1)
//   cedarVisCheap(p, L) the same, coarse, for haze
//   barkPat(lq, r, seed) .x relief 0 (furrow) .. 1 (plate top), .y plate id; for shading bark
// Before marching a ray, `cedarMask = cedarRayMask(ro, rd);` culls trees the ray cannot meet;
// set it back to 0x7fffffff afterwards. Define `bool gLite` (true = skip surface detail) and
// `uniform vec3 uCamPos` before including (the engine provides uCamPos).

function rng(seed) { let s = (seed * 2654435761) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function growCedar({ base, h, r0, spread, seed = 1, young = false, straight = false }) {
  const R = rng(seed + 7);
  const limbs = [];   // [ax, ay, az, ra, bx, by, bz, rb] world
  const plates = [];  // [cx, cy, cz, rx, rz, thick, yaw, seed]
  const [bx, by, bz] = base;
  const P = (x, y, z) => [bx + x, by + y, bz + z];
  // the axis: trunk, and for old trees two or three leaders from a fork
  const axes = [];    // segments of the axis, for hanging limbs on [a, b]
  if (young) {
    limbs.push([...P(0, -0.3, 0), r0, ...P(0, h, 0), r0 * 0.12]);
    axes.push([[0, -0.3, 0], [0, h, 0]]);
  } else {
    const fork = h * (straight ? 0.55 : 0.32 + 0.18 * R());
    const lean = straight ? [0, 0] : [(R() - 0.5) * 0.6, (R() - 0.5) * 0.6];
    const F = [lean[0], fork, lean[1]];
    limbs.push([...P(0, -1.2, 0), r0 * 1.05, ...P(...F), r0 * 0.78]);
    axes.push([[0, -1.2, 0], F]);
    const nLead = r0 > 0.78 ? 3 : r0 > 0.6 ? 2 : 1;
    for (let k = 0; k < nLead; k++) {
      const a = R() * 6.283 + k * 2.1;
      const off = nLead === 1 ? 0.4 : 1.2 + 1.6 * R();
      const T = [F[0] + Math.cos(a) * off, h * (0.86 + 0.14 * R()), F[2] + Math.sin(a) * off];
      limbs.push([...P(...F), r0 * (nLead === 1 ? 0.7 : 0.55), ...P(...T), r0 * 0.12]);
      axes.push([F, T]);
    }
  }
  const axisAt = (y) => {
    // a point on one of the axes at height y (a leader chosen at random above the fork)
    const cand = axes.filter(([a, b]) => y >= a[1] - 0.01 && y <= b[1] + 0.01);
    const [a, b] = cand.length ? cand[Math.floor(R() * cand.length)] : axes[axes.length - 1];
    const t = Math.min(1, Math.max(0, (y - a[1]) / (b[1] - a[1] || 1)));
    return [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t];
  };
  // tiers of limbs, each carrying a flat plate at its end (and a second along it if long)
  const y0 = young ? h * 0.12 : h * (0.28 + 0.08 * R());
  const top = young ? h * 0.92 : h * 0.97;
  let y = y0, k = 0;
  while (y < top) {
    const f = (y - y0) / (top - y0);
    const n = young ? 3 + Math.floor(R() * 3) : (R() < 0.45 ? 2 : 1) + (f < 0.4 && R() < 0.3 ? 1 : 0);
    const az0 = k * 2.39996 + R() * 0.8;
    for (let j = 0; j < n; j++) {
      const a = az0 + (j * 6.283) / n + (R() - 0.5) * 0.9;
      const d = [Math.cos(a), Math.sin(a)];
      let len = young ? spread * Math.pow(1 - f, 0.8) * (0.55 + 0.7 * R()) + 0.12
        : spread * (0.35 + 0.65 * Math.pow(1 - f, 0.5)) * (0.55 + 0.6 * R());
      if (!young && f > 0.85) len *= 1.15;      // the flat, spreading top of an old cedar
      const S = axisAt(y);
      const rise = young ? 0.12 : 0.1 + 0.15 * R();
      const E = [S[0] + d[0] * len, y + rise * len - (young ? 0 : 0.05 * len * len / spread), S[2] + d[1] * len];
      const ra = young ? r0 * 0.25 : Math.max(0.06, r0 * 0.42 * Math.min(1, len / spread));
      if (!young) limbs.push([...P(...S), ra, ...P(...E), ra * 0.3]);
      const plate = (C, s) => {
        const rx = (young ? 0.08 + 0.3 * len : 0.7 + 0.42 * len) * s * (0.8 + 0.4 * R());
        const rz = rx * (young ? 0.4 + 0.25 * R() : 0.55 + 0.35 * R());
        const th = young ? 0.07 + 0.05 * R() : 0.32 + 0.22 * R();
        plates.push([...P(C[0], C[1] + (young ? 0 : 0.25), C[2]), rx, rz, th, a + (R() - 0.5) * 0.6, R() * 100]);
      };
      if (young) {
        limbs.push([...P(S[0], S[1], S[2]), r0 * 0.18, ...P(S[0] + d[0] * len * 0.8, y - 0.05 * len, S[2] + d[1] * len * 0.8), r0 * 0.06]);
        plate([S[0] + d[0] * len * 0.62, y - 0.08 * len + (R() - 0.5) * 0.12, S[2] + d[1] * len * 0.62], 1);
      }
      else {
        plate(E, 1);
        if (len > spread * 0.55) plate([S[0] + d[0] * len * 0.55, y + rise * len * 0.5, S[2] + d[1] * len * 0.55], 0.65);
      }
    }
    y += young ? 0.22 + 0.16 * R() : 1.9 + 1.5 * R();
    k++;
  }
  // a crown plate over each leader top
  if (!young) for (const [, T] of axes.slice(1)) plates.push([...P(T[0], T[1] + 0.2, T[2]), 1.6 + 1.4 * R(), 1.2 + 1.0 * R(), 0.45, R() * 6.28, R() * 100]);
  else plates.push([...P(0, h - 0.1, 0), 0.18, 0.15, 0.25, 0, 3]);
  // bounding radius about the base axis
  let br = 0;
  for (const p of plates) br = Math.max(br, Math.hypot(p[0] - bx, p[2] - bz) + Math.max(p[3], p[4]));
  for (const l of limbs) br = Math.max(br, Math.hypot(l[4] - bx, l[6] - bz) + l[7]);
  const nAxis = axes.length;
  return { base, h, r0, seed, young, limbs, plates, nAxis, bound: br + 0.6, top: Math.max(...plates.map((p) => p[1] + p[5])) };
}

export const growCedars = (list) => list.map(growCedar);

const f4 = (a) => `vec4(${a.map((x) => (+x).toFixed(3)).join(', ')})`;

export const CED_NB = 12;   // height buckets per tree
export function cedarGLSL(trees) {
  const LA = [], LB = [], PA = [], PB = [], TR = [], BK = [];
  for (const t of trees) {
    // plates and branch limbs sorted by height; each bucket of the tree's height gets the index
    // range of the ones that can reach into it, so a point tests only a handful
    const plates = [...t.plates].sort((a, b) => a[1] - b[1]);
    const axis = t.limbs.slice(0, t.nAxis);
    const br = t.limbs.slice(t.nAxis).sort((a, b) => Math.min(a[1], a[5]) - Math.min(b[1], b[5]));
    const limbs = [...axis, ...br];
    TR.push([LA.length, limbs.length, PA.length, plates.length]);
    for (const l of limbs) { LA.push(l.slice(0, 4)); LB.push(l.slice(4, 8)); }
    for (const p of plates) { PA.push(p.slice(0, 4)); PB.push([p[4], p[5], p[6], p[7]]); }
    const y0 = t.base[1] - 2, y1 = t.top + 1, dy = (y1 - y0) / CED_NB;
    const range = (arr, lo, hi, off) => {
      let a = -1, b = -1;
      arr.forEach((x, i) => { const [ya, yb] = lo(x); if (yb >= hi[0] && ya <= hi[1]) { if (a < 0) a = i; b = i; } });
      return a < 0 ? [0, 0] : [a + off, b + 1 + off];
    };
    for (let k = 0; k < CED_NB; k++) {
      const hi = [y0 + k * dy, y0 + (k + 1) * dy];
      const pr = range(plates, (p) => [p[1] - p[5] - (t.young ? 0.3 : 1.8), p[1] + p[5] + (t.young ? 0.3 : 1.8)], hi, 0);
      const lr = range(br, (l) => [Math.min(l[1], l[5]) - l[3] - 0.3, Math.max(l[1], l[5]) + l[3] + 0.3], hi, t.nAxis);
      BK.push([pr[0], pr[1], lr[0], lr[1]]);
    }
    t.nAxisGL = t.nAxis; t.y0 = y0; t.dy = dy;
  }
  const NT = trees.length;
  return /* glsl */ `
#define NCED ${NT}
const vec4 CED_A[NCED] = vec4[](${trees.map((t) => f4([...t.base, t.top - t.base[1]])).join(', ')});
const vec4 CED_B[NCED] = vec4[](${trees.map((t) => f4([t.r0, t.bound, t.seed * 1.37 + 0.7, t.young ? 1 : 0])).join(', ')});
// below crownLow (local y) only the trunk can be met
const float CED_LOW[NCED] = float[](${trees.map((t) => (Math.min(...t.plates.map((p) => p[1] - p[5])) - t.base[1] - 1.6).toFixed(3)).join(', ')});
const ivec4 CED_R[NCED] = ivec4[](${TR.map((r) => `ivec4(${r.join(', ')})`).join(', ')});
// per tree: axis limb count, bucket origin y and height
const vec3 CED_K[NCED] = vec3[](${trees.map((t) => `vec3(${t.nAxisGL}.0, ${t.y0.toFixed(3)}, ${t.dy.toFixed(4)})`).join(', ')});
// per tree and height bucket: plate range [x, y), branch limb range [z, w)
const ivec4 CED_BK[${BK.length}] = ivec4[](${BK.map((r) => `ivec4(${r.join(', ')})`).join(', ')});
const vec4 CED_LA[${LA.length}] = vec4[](${LA.map(f4).join(', ')});
const vec4 CED_LB[${LB.length}] = vec4[](${LB.map(f4).join(', ')});
const vec4 CED_PA[${PA.length}] = vec4[](${PA.map(f4).join(', ')});
const vec4 CED_PB[${PB.length}] = vec4[](${PB.map(f4).join(', ')});
int cedarMask = 0x7fffffff;

// bark of an old cedar: deep vertical furrows (ridged noise, long in y) between scaly grey plates
// broken by cross-cracks; q local to the axis, r its radius there. x relief 0..1, y plate id
vec2 barkPat(vec3 q, float r, float seed) {
  float a = atan(q.z, q.x);
  float u = a * max(r, 0.1);
  // long vertical fissures: ridged noise stretched up the trunk, gently wandering
  vec2 w = vec2(u * 13.0 + 0.9 * vnoise(vec2(u * 3.0, q.y * 0.3) + seed), q.y * 0.22) + seed;
  float n = vnoise(w) * 0.7 + vnoise(w * vec2(2.0, 1.5) + 4.1) * 0.3;
  float fis = smoothstep(0.7, 0.96, 1.0 - abs(2.0 * n - 1.0));
  // the ridges between are broken into scales by cross-cracks
  vec2 v = voronoiEdge(vec2(u * 26.0, q.y * 5.0) + seed * 3.0);
  float crack = (1.0 - smoothstep(0.0, 0.08, v.x)) * 0.6;
  float ridge = 1.0 - fis;
  float rough = fbm(vec2(u * 40.0, q.y * 9.0) + seed, 3);
  float h = ridge * (0.7 + 0.3 * rough) * (1.0 - 0.45 * crack) - 0.08 * vnoise(vec2(u * 90.0, q.y * 25.0)) * ridge;
  return vec2(sat(h), v.y);
}

float sdTaper(vec3 p, vec3 a, vec3 b, float ra, float rb) {
  vec3 pa = p - a, ba = b - a; float h = sat(dot(pa, ba) / dot(ba, ba));
  return length(pa - ba * h) - mix(ra, rb, h);
}

float cedarSD(vec3 p, int i, out float part, out vec3 lq) {
  vec4 A = CED_A[i], B = CED_B[i];
  vec3 q = p - A.xyz; lq = q;
  part = 2.0;
  float dxz = length(q.xz);
  float bound = max(dxz - B.y, max(q.y - A.w - 1.0, -q.y - 2.0));
  if (bound > 0.4) return bound;
  ivec4 R = CED_R[i];
  bool young = B.w > 0.5;
  float cd = length(p - uCamPos);
  bool low = q.y < CED_LOW[i];
  if (low && dxz > B.x * 2.2 + 0.5) return dxz - B.x * 2.0;
  // wood
  vec3 K = CED_K[i];
  ivec4 BKt = CED_BK[i * ${CED_NB} + int(clamp(floor((p.y - K.y) / K.z), 0.0, ${CED_NB - 1}.0))];
  int nAx = int(K.x);
  float dw = 1e5; int wj = R.x;
  int nL = low ? 1 : nAx + (BKt.w - BKt.z);
  for (int jj = 0; jj < 64; jj++) {
    if (jj >= nL) break;
    int j = jj < nAx ? jj : BKt.z + (jj - nAx);
    vec4 a = CED_LA[R.x + j], b = CED_LB[R.x + j];
    vec3 m = 0.5 * (a.xyz + b.xyz);
    if (length(p - m) - 0.5 * length(b.xyz - a.xyz) - a.w > dw) continue;
    float dd = sdTaper(p, a.xyz, b.xyz, a.w, b.w);
    if (dd < dw) { dw = dd; wj = R.x + j; }
  }
  // root flare and bark on the trunk
  if (wj == R.x && !young) {
    dw -= B.x * 0.5 * exp(-max(q.y, 0.0) * 1.5);
    if (dw < 0.2 && cd < 25.0 && !gLite) {
      float rr = dxz - dw;
      dw -= 0.13 * min(B.x * 1.3, 1.0) * (barkPat(q, rr, B.z).x - 0.6) * smoothstep(25.0, 6.0, cd);
      dw *= 0.75;
    }
  }
  float d = dw;
  // foliage plates: nearest by its plain ellipsoid, then made ragged
  float dp = 1e5; int pj = -1;
  for (int j = BKt.x; j < BKt.y; j++) {
    if (low) break;
    vec4 a = CED_PA[R.z + j], b = CED_PB[R.z + j];
    vec3 o = p - a.xyz;
    if (abs(o.y) - b.y - 1.0 > dp || length(o.xz) - max(a.w, b.x) * 1.4 > dp) continue;
    float c = cos(b.z), s = sin(b.z);
    o.xz = vec2(c * o.x + s * o.z, -s * o.x + c * o.z);
    float dd = sdEllipsoid(o, vec3(a.w, b.y, b.x));
    if (dd < dp) { dp = dd; pj = R.z + j; }
  }
  if (low) dp = CED_LOW[i] - q.y + 0.5;
  else if (pj >= 0 && dp < 1.6) {
    vec4 a = CED_PA[pj], b = CED_PB[pj];
    vec3 o = p - a.xyz;
    float c = cos(b.z), s = sin(b.z);
    o.xz = vec2(c * o.x + s * o.z, -s * o.x + c * o.z);
    // ragged, lobed outline; thinner and drooping toward the rim
    float th = atan(o.z / b.x, o.x / a.w);
    float lobe = 1.0 + 0.2 * sin(3.0 * th + b.w) + 0.14 * sin(5.0 * th + 2.1 * b.w) + 0.1 * sin(9.0 * th + b.w * 3.3) + 0.35 * (vnoise(vec2(th * 2.5, b.w)) - 0.5);
    vec2 e = o.xz / vec2(a.w, b.x) / lobe;
    float rr = length(e);
    o.y += (young ? 0.6 : 0.25) * b.y * rr * rr;
    float thick = b.y * (1.0 - 0.45 * rr * rr);
    dp = (rr - 1.0) * min(a.w, b.x) * lobe * 0.8;
    dp = max(dp, abs(o.y) - max(thick, 0.06));
    if (!gLite) {
      float sc = young ? 4.5 : 1.5;
      dp += (fbm(p * sc + b.w, cd < 25.0 ? 3 : cd < 70.0 ? 2 : 1) - 0.5) * (young ? 0.12 : 0.8 + 0.12 * min(a.w, 5.0)) + (young ? 0.01 : 0.12);
      // ragged rims: sprays reaching out and notches between them
      if (!young) dp += smoothstep(0.55, 1.05, rr) * ((vnoise(o.xz * 1.6 + b.w) - 0.35) * 0.9 + (vnoise(o.xz * 4.5 + b.w * 2.0) - 0.4) * 0.45);
      // gaps through the sprays
      if (!young) dp += 0.9 * smoothstep(0.55, 0.78, vnoise(p * 0.9 + b.w));
      // fine needle tufts near the lens
      if (dp < 0.35) {
        dp += (vnoise(p * (young ? 22.0 : 6.0)) - 0.5) * (young ? 0.05 : 0.3);
        // fine sprays at the edges: small tufts and holes, faded out where they would alias
        float k = smoothstep(90.0, 20.0, cd);
        if (k > 0.0) dp += (vnoise(p * (young ? 50.0 : 17.0) + b.w) - 0.45) * (young ? 0.03 : 0.16) * k;
      }
    } else dp += young ? 0.02 : 0.15;
    dp *= 0.6;
  }
  if (dp < d) { d = dp; part = 3.0; }
  return d;
}

// cull trees a ray cannot meet (xz distance of the ray to each tree's axis)
int cedarRayMask(vec3 ro, vec3 rd) {
  int m = 0;
  float l2 = dot(rd.xz, rd.xz);
  for (int i = 0; i < NCED; i++) {
    vec2 oc = CED_A[i].xz - ro.xz;
    float R = CED_B[i].y + 1.0;
    float tc = l2 > 1e-8 ? max(dot(oc, rd.xz) / l2, 0.0) : 0.0;
    vec2 cp = ro.xz + rd.xz * tc - CED_A[i].xz;
    if (dot(cp, cp) > R * R && length(oc) > R) continue;
    float y = ro.y + rd.y * tc - CED_A[i].y;
    if (y > CED_A[i].w + 2.0 && rd.y > 0.0) continue;
    m |= 1 << i;
  }
  return m;
}

// light through the trees: trunks and leaders, and every plate the light ray crosses
float cedarVis(vec3 p, vec3 L) {
  float od = 0.0;
  vec2 ld = normalize(L.xz + 1e-5);
  float slope = length(L.xz) / max(L.y, 0.05);
  for (int i = 0; i < NCED; i++) {
    vec4 A = CED_A[i], B = CED_B[i];
    // the light ray's xz line must pass near the tree, above p
    vec2 w = A.xz - p.xz;
    float along = dot(w, ld);
    float perp = abs(w.x * ld.y - w.y * ld.x);
    if (perp > B.y + 0.5 || along < -B.y - 0.5 || along > (A.y + A.w - p.y) * slope + B.y + 0.5) continue;
    ivec4 R = CED_R[i];
    for (int j = 0; j < 64; j++) {
      if (j >= R.w) break;
      vec4 a = CED_PA[R.z + j], b = CED_PB[R.z + j];
      float s = (a.y - p.y) / L.y;
      if (s <= 0.0) continue;
      vec2 hp = p.xz + L.xz * s - a.xz;
      if (dot(hp, hp) > 1.2 * max(a.w, b.x) * max(a.w, b.x)) continue;
      float c = cos(b.z), sn = sin(b.z);
      vec2 o = vec2(c * hp.x + sn * hp.y, -sn * hp.x + c * hp.y) / vec2(a.w, b.x);
      float e = dot(o, o);
      if (e > 1.2) continue;
      od += smoothstep(1.1, 0.5, e) * (0.35 + 1.3 * smoothstep(0.35, 0.75, vnoise(hp * 1.4 + b.w)));
    }
    // the trunk
    float s = dot(w, L.xz) / max(dot(L.xz, L.xz), 1e-5);
    if (s > 0.0) {
      float dist = length(p.xz + L.xz * s - A.xz);
      float y = p.y + L.y * s - A.y;
      if (y > -1.0 && y < A.w * 0.6) od += 6.0 * smoothstep(B.x + 0.06, B.x - 0.1, dist);
    }
  }
  return exp(-od * 1.3);
}

float cedarVisCheap(vec3 p, vec3 L) {
  float od = 0.0;
  vec2 ld = normalize(L.xz + 1e-5);
  float slope = length(L.xz) / max(L.y, 0.05);
  for (int i = 0; i < NCED; i++) {
    vec4 A = CED_A[i], B = CED_B[i];
    vec2 w = A.xz - p.xz;
    float along = dot(w, ld);
    float perp = abs(w.x * ld.y - w.y * ld.x);
    if (perp > B.y || along < -B.y || along > (A.y + A.w - p.y) * slope + B.y) continue;
    ivec4 R = CED_R[i];
    for (int j = 0; j < 64; j++) {
      if (j >= R.w) break;
      vec4 a = CED_PA[R.z + j], b = CED_PB[R.z + j];
      float s = (a.y - p.y) / L.y;
      if (s <= 0.0) continue;
      vec2 hp = p.xz + L.xz * s - a.xz;
      float e = dot(hp, hp) / (a.w * b.x);
      od += smoothstep(1.0, 0.4, e) * 0.9;
    }
  }
  return exp(-od * 1.2);
}
`;
}
