// The road out of the valley city at night (s24-all-flesh): the consequence of the street. A paved
// road, its slabs cracked and heaved, winds away from the burning city into smoke. On it, what was
// left with no one there: a cart tipped on its side with a wheel broken off, its load of jars and
// sacks spilled and smashed, grain scattered; the chain from the street lying across the paving; a
// boundary stone toppled across the verge; a small roadside shrine overturned; the bones of a beast
// of burden; a torch dropped on the road, still burning, the only near light. The city's glow lies
// behind the camera; ahead the smoke thickens. Road along +z, its centre line bends gently.
export const ROAD_GLSL = /* glsl */ `
float roadX(float z) { return 2.5 * sin(z * 0.045) + 1.2 * sin(z * 0.11 + 1.0); }
const vec3 TORCHD = vec3(-0.9, 0.08, 13.0);     // the dropped torch (head end), relative to the road centre
vec3 torchHead() { return vec3(roadX(TORCHD.z) + TORCHD.x, 0.12, TORCHD.z); }
vec3 torchCol3() { return vec3(1.0, 0.45, 0.13) * flick(4.0); }
vec3 R(float x, float y, float z) { return vec3(roadX(z) + x, y, z); }
vec3 cartFire() { return R(1.3, 0.1, 17.6); }

float sdCylZ(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

// id: 1 road paving, 2 earth verge, 3 timber (cart), 4 clay (jars), 5 sacking, 6 stone (boundary,
//     shrine), 7 iron/bronze chain, 8 bone, 9 torch shaft
float mapR(vec3 p, out float id) {
  float rx = p.x - roadX(p.z);
  // ground: the road slightly raised, the verge rough dry earth
  float road = smoothstep(3.6, 3.2, abs(rx));
  float g = p.y - 0.06 * road + 0.12 * (1.0 - road) * fbm(p.xz * 0.6, 3);
  // heaved slabs: some tilted a few cm
  vec2 sl = vec2(rx * 1.5 + 0.5 * mod(floor(p.z / 0.75), 2.0), p.z / 0.75);
  float hs = hash12(floor(sl));
  g -= road * (hs > 0.8 ? 0.025 * (fract(sl.x) - 0.5) + 0.012 : 0.0);
  float d = g; id = road > 0.5 ? 1.0 : 2.0;
  // debris scattered over the road: stones, sherds, bits of wood (one per cell, a few cells empty)
  {
    vec2 g = p.xz / 0.45; vec2 id0 = floor(g);
    float dd = 1e9;
    for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++) {
      vec2 cid = floor(g - 0.5) + vec2(float(i), float(j));
      float h = hash12(cid + 17.0);
      vec2 cw = (cid + 0.5) * 0.45;
      float onRoad = smoothstep(4.0, 2.5, abs(cw.x - roadX(cw.y)));
      if (h > 0.5 * onRoad * (0.4 + 0.6 * smoothstep(0.3, 0.6, vnoise(cid * 0.3)))) continue;
      vec2 o = (cid + 0.2 + 0.6 * hash22(cid)) * 0.45;
      vec3 q = p - vec3(o.x, 0.065, o.y);
      q.xz = rot(h * 40.0) * q.xz; q.xy = rot((hash11(h * 9.0) - 0.5) * 0.6) * q.xy;
      vec3 sz = vec3(0.02 + 0.045 * hash11(h * 13.0), 0.01 + 0.015 * hash11(h * 7.0), 0.02 + 0.035 * hash11(h * 3.0));
      if (h < 0.12) sz = vec3(0.18 * hash11(h * 5.0) + 0.06, 0.012, 0.012);   // a splinter of wood
      dd = min(dd, sdBox(q, sz) - 0.006 - 0.004 * vnoise(q.xz * 80.0));
    }
    if (dd < d) { d = dd; id = 10.0; }
  }
  // the cart, tipped on its side across the right of the road, one wheel off
  {
    vec3 q = p - R(1.6, 0.0, 17.0);
    if (length(q) < 4.0) {
      vec3 c = q - vec3(0.0, 0.75, 0.0);
      c.xy = rot(1.15) * c.xy; c.xz = rot(0.35) * c.xz;
      // the bed: planks laid across, with gaps; two long bearers under them
      float bed = sdBox(c, vec3(0.75, 0.04, 1.2));
      float pz = mod(c.z + 0.11, 0.22) - 0.11;
      bed = max(bed, 0.012 - abs(pz));
      bed = min(bed, sdBox(vec3(abs(c.x) - 0.45, c.y + 0.07, c.z), vec3(0.06, 0.05, 1.25)));
      // the sides: three boards each with gaps, held by stakes
      float by = mod(c.y - 0.04, 0.17) - 0.085;
      float boards = max(abs(by) - 0.07, abs(c.y - 0.27) - 0.24);
      float sides = max(min(sdBox(c - vec3(0.72, 0.27, 0.0), vec3(0.025, 0.25, 1.2)), sdBox(c - vec3(-0.72, 0.27, 0.0), vec3(0.025, 0.25, 1.2))), boards);
      sides = min(sides, max(sdBox(c - vec3(0.0, 0.27, 1.17), vec3(0.75, 0.25, 0.025)), boards));
      float sz = mod(c.z + 0.4, 0.8) - 0.4;
      sides = min(sides, max(sdBox(vec3(abs(c.x) - 0.76, c.y - 0.25, sz), vec3(0.03, 0.3, 0.035)), abs(c.z) - 1.2));   // stakes
      // a broken side board hanging loose
      vec3 hb = c - vec3(-0.85, 0.05, -0.5); hb.xy = rot(0.6) * hb.xy;
      sides = min(sides, sdBox(hb, vec3(0.02, 0.07, 0.6)));
      float shafts = min(sdCapsule(c, vec3(0.35, -0.05, 1.1), vec3(0.4, -0.15, 3.0), 0.05), sdCapsule(c, vec3(-0.35, -0.05, 1.1), vec3(-0.6, -0.1, 2.9), 0.05));
      // the wheel still on its axle
      vec3 w = c - vec3(0.85, -0.2, -0.1); w = w.zyx;
      float wheel = max(abs(length(w.xy) - 0.62) - 0.05, abs(w.z) - 0.06);
      vec2 sp = w.xy; float a = atan(sp.y, sp.x); float sa = mod(a + 0.3927, 0.7854) - 0.3927;
      float spoke = max(abs(sin(sa) * length(sp)) - 0.025, max(length(sp) - 0.6, abs(w.z) - 0.03));
      wheel = min(wheel, min(spoke, sdCylZ(w, 0.12, 0.1)));
      float cart = min(min(bed, sides), min(shafts, wheel));
      // the other wheel lying flat in the road, broken
      vec3 w2 = q - vec3(-2.6, 0.06, -2.2);
      float wh2 = max(abs(length(w2.xz) - 0.62) - 0.05, abs(w2.y) - 0.05);
      wh2 = max(wh2, -(dot(w2.xz, normalize(vec2(1.0, 0.4))) - 0.45));      // a piece of the rim gone
      float sp2a = atan(w2.z, w2.x); float sp2 = mod(sp2a + 0.3927, 0.7854) - 0.3927;
      wh2 = min(wh2, max(abs(sin(sp2) * length(w2.xz)) - 0.025, max(length(w2.xz) - 0.6, abs(w2.y) - 0.03)));
      cart = min(cart, wh2);
      if (cart < d) { d = cart; id = 3.0; }
    }
  }
  // spilled jars and sacks, grain
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec3 c = R(-0.4 + 1.6 * sin(fi * 2.1), 0.0, 14.0 + 1.3 * fi + 0.6 * cos(fi * 1.7));
    vec3 q = p - c;
    if (length(q) > 1.0) continue;
    if (i < 4) {
      // a jar on its side, its mouth broken
      q.xz = rot(fi * 1.3) * q.xz;
      vec3 jq = q - vec3(0.0, 0.22, 0.0);
      float body = abs(sdEllipsoid(jq, vec3(0.22, 0.2, 0.36))) - 0.015;
      body = max(body, jq.z - 0.18 + 0.12 * hash11(fi));                 // the broken end
      float neck = max(abs(length(jq.xy) - 0.07) - 0.012, abs(jq.z - 0.35) - 0.08);
      neck = max(neck, jq.z - 0.18 + 0.12 * hash11(fi));
      float j = min(body, neck);
      // sherds lying round it
      vec3 sq = q - vec3(0.35, 0.02, 0.4); sq.xz = rot(fi) * sq.xz;
      j = min(j, sdBox(sq, vec3(0.08, 0.015, 0.06)));
      if (j < d) { d = j; id = 4.0; }
    } else {
      float s = sdEllipsoid(q - vec3(0.0, 0.16, 0.0), vec3(0.32, 0.17, 0.24)) - 0.02 * vnoise(q.xz * 20.0);
      if (s < d) { d = s; id = 5.0; }
    }
  }
  // the chain lying across the road in a loose curve
  {
    vec3 q = p - R(0.0, 0.0, 9.0);
    if (abs(q.z) < 1.5 && abs(q.x) < 3.0 && q.y < 0.4) {
      float u = q.x;
      float cz = 0.5 * sin(u * 1.1) + 0.2 * sin(u * 2.7);
      float k = floor(u / 0.17 + 0.5);
      vec3 lq = vec3(u - k * 0.17, q.y - 0.03, q.z - cz);
      float l = mod(k, 2.0) < 0.5 ? length(vec2(length(lq.xz * vec2(0.7, 1.0)) - 0.075, lq.y - 0.0)) - 0.022 : length(vec2(length((lq - vec3(0.0, 0.05, 0.0)).xy * vec2(0.7, 1.0)) - 0.075, lq.z)) - 0.022;
      l = max(l, abs(u) - 2.6);
      if (l < d) { d = l; id = 7.0; }
    }
  }
  // the boundary stone, toppled across the left verge, and its broken socket
  {
    vec3 q = p - R(-3.6, 0.0, 25.0);
    if (length(q) < 3.0) {
      vec3 b = q - vec3(0.4, 0.22, 0.0); b.xz = rot(0.5) * b.xz; b.xy = rot(0.08) * b.xy;
      float st = sdBox(b, vec3(1.1, 0.2, 0.32)) - 0.04;
      st = min(st, sdEllipsoid(b - vec3(1.12, 0.0, 0.0), vec3(0.15, 0.2, 0.32)));    // the rounded head
      float sock = max(sdBox(q - vec3(-0.9, 0.12, -0.4), vec3(0.5, 0.12, 0.45)), -sdBox(q - vec3(-0.9, 0.2, -0.4), vec3(0.22, 0.12, 0.35)));
      st = min(st, sock);
      if (st < d) { d = st; id = 6.0; }
    }
  }
  // the overturned shrine: a small stone niche on its back, its little roof broken off
  {
    vec3 q = p - R(3.9, 0.0, 31.0);
    if (length(q) < 2.5) {
      vec3 s = q - vec3(0.0, 0.35, 0.0); s.xy = rot(1.4) * s.xy;
      float box = max(sdBox(s, vec3(0.45, 0.6, 0.35)), -sdBox(s - vec3(0.0, 0.1, -0.2), vec3(0.3, 0.4, 0.3)));
      vec3 r = q - vec3(-0.9, 0.12, 0.6); r.xz = rot(0.7) * r.xz;
      float roof = max(sdBox(r, vec3(0.5, 0.12, 0.4)), dot(r, normalize(vec3(0.0, 1.0, 0.6))) - 0.05);
      float sh = min(box, roof);
      if (sh < d) { d = sh; id = 6.0; }
    }
  }
  // the bones of a beast: a few ribs and a long bone at the verge
  {
    vec3 q = p - R(-2.9, 0.0, 20.5);
    if (length(q) < 1.8) {
      float b = 1e9;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec3 r = q - vec3(-0.5 + fi * 0.17, 0.0, 0.0);
        r.xz = rot(0.15 * sin(fi * 2.0)) * r.xz;
        r.xy = rot(1.25) * r.xy;          // the ribcage has fallen on its side
        float rib = abs(length(r.yz) - 0.42 + 0.03 * fi) - 0.02;
        rib = max(rib, max(abs(r.x) - 0.022, -r.y));
        b = min(b, rib);
      }
      b = min(b, sdCapsule(q, vec3(0.8, 0.03, -0.6), vec3(1.45, 0.03, -0.1), 0.035));
      if (b < d) { d = b; id = 8.0; }
    }
  }
  // the dropped torch: a shaft lying on the road, its head still burning
  {
    vec3 h = torchHead();
    float s = sdCapsule(p, h, h + vec3(0.55, -0.06, -0.55), 0.035);
    s = min(s, sdEllipsoid(p - h, vec3(0.09, 0.08, 0.09)));
    if (s < d) { d = s; id = 9.0; }
  }
  return d;
}
float mapRd(vec3 p) { float i; return mapR(p, i); }
vec3 normR(vec3 p, float t) {
  vec2 e = vec2(1.0, -1.0) * (0.0015 + 0.0005 * t);
  return normalize(e.xyy * mapRd(p + e.xyy) + e.yyx * mapRd(p + e.yyx) + e.yxy * mapRd(p + e.yxy) + e.xxx * mapRd(p + e.xxx));
}
float marchR(vec3 ro, vec3 rd, out float id) {
  float t = 0.05;
  for (int i = 0; i < 140; i++) {
    float d = mapR(ro + rd * t, id);
    if (abs(d) < 0.0004 * t) return t;
    t += d * 0.8;
    if (t > 160.0) break;
  }
  id = -1.0; return 160.0;
}
float shadowR(vec3 p, vec3 lp) {
  vec3 L = lp - p; float maxt = length(L) - 0.15; L = normalize(L);
  float s = 1.0, t = 0.03;
  for (int i = 0; i < 24; i++) {
    float d = mapRd(p + L * t);
    s = min(s, 10.0 * d / t);
    t += clamp(d, 0.02, 1.0);
    if (s < 0.01 || t > maxt) break;
  }
  return sat(s);
}

vec3 cityRoad(vec2 fc) {
  vec3 ro, rd0; vec3 rd = lensRay(fc, ro, rd0);
  float id; float t = marchR(ro, rd, id);
  // sky: black smoke lit red from the city behind, darker ahead
  float skn = fbm(rd.xz / max(rd.y + 0.2, 0.05) * 0.8 + vec2(uTime * 0.03, uTime * 0.01), 5);
  vec3 col = mix(vec3(0.004, 0.003, 0.004), vec3(0.03, 0.008, 0.006), smoothstep(0.3, 0.8, skn)) + vec3(0.2, 0.05, 0.02) * exp(-max(rd.y, 0.0) * 7.0) * (0.6 + 0.6 * skn);
  if (id > 0.0) {
    vec3 p = ro + rd * t, n = normR(p, t), v = -rd;
    vec3 alb; float rough = 0.85, metal = 0.0;
    float rx = p.x - roadX(p.z);
    if (id == 1.0) {
      vec2 sl = vec2(rx * 1.5 + 0.5 * mod(floor(p.z / 0.75), 2.0), p.z / 0.75);
      vec2 f = fract(sl), e = min(f, 1.0 - f);
      float joint = smoothstep(0.04, 0.0, min(e.x * 1.1, e.y));
      float hs = hash12(floor(sl));
      alb = vec3(0.25, 0.22, 0.19) * (0.7 + 0.5 * hs) * (0.7 + 0.5 * fbm(p.xz * 2.0, 4));
      float crack = smoothstep(0.03, 0.0, voronoiEdge(p.xz * 1.1).x) * step(0.45, hs);
      alb *= 1.0 - 0.8 * max(joint, crack);
      // dust and grain blown over the slabs, ruts
      alb = mix(alb, vec3(0.42, 0.35, 0.22), smoothstep(0.55, 0.75, fbm(p.xz * 1.5 + 5.0, 3)) * 0.6);
      float grain = smoothstep(1.6, 0.3, length(p.xz - R(-0.2, 0.0, 15.5).xz)) * smoothstep(0.4, 0.7, fbm(p.xz * 12.0, 3));
      alb = mix(alb, vec3(0.75, 0.62, 0.38), grain * 0.8);
      rough = 0.8 + 0.2 * joint;
      // each slab sits a little off level, its face worn and pitted, dirt packed in the joints
      vec2 tilt = (hash22(floor(sl) + 3.0) - 0.5) * 0.12;
      n = normalize(n + vec3(tilt.x, 0.0, tilt.y));
      n = bumpN(p, n, 3.0, 0.08); n = bumpN(p, n, 18.0, 0.12);
      alb *= 0.75 + 0.35 * fbm(p.xz * 9.0, 3);
      alb = mix(alb, vec3(0.12, 0.09, 0.07), smoothstep(0.06, 0.0, min(e.x * 1.1, e.y)) * 0.7);
      // scorch marks
      alb *= 1.0 - 0.6 * smoothstep(0.62, 0.8, fbm(p.xz * 0.6 + 11.0, 4));
    } else if (id == 2.0) {
      alb = vec3(0.17, 0.13, 0.1) * (0.6 + 0.6 * fbm(p.xz * 3.0, 4));
      // dry scrub
      alb = mix(alb, vec3(0.1, 0.09, 0.05), smoothstep(0.6, 0.8, fbm(p.xz * 5.0 + 9.0, 3)));
      n = bumpN(p, n, 4.0, 0.25);
    } else if (id == 3.0) {
      alb = vec3(0.3, 0.2, 0.11) * (0.55 + 0.6 * fbm(vec2(p.y * 3.0 + p.x, p.z * 18.0), 4)) * (0.75 + 0.5 * hash11(floor(p.z / 0.22) + floor(p.y / 0.17) * 7.0));
      alb *= 1.0 - 0.6 * smoothstep(0.55, 0.8, fbm(p.xz * 3.0 + p.y, 3));   // charred
      rough = 0.8; n = bumpN(p, n, 14.0, 0.15);
    } else if (id == 4.0) {
      alb = vec3(0.52, 0.28, 0.16) * (0.75 + 0.35 * fbm(p.xz * 30.0, 3)); rough = 0.7;
    } else if (id == 5.0) {
      alb = vec3(0.42, 0.34, 0.24) * (0.75 + 0.35 * sin(p.x * 300.0) * sin(p.z * 300.0) * 0.3 + 0.2 * fbm(p.xz * 20.0, 2)); rough = 0.95;
    } else if (id == 10.0) {
      alb = vec3(0.2, 0.17, 0.14) * (0.6 + 0.6 * hash12(floor(p.xz * 3.0))); rough = 0.85;
      alb = mix(alb, vec3(0.45, 0.24, 0.13), step(0.7, hash12(floor(p.xz / 0.7))));   // sherds of red clay
    } else if (id == 6.0) {
      alb = vec3(0.46, 0.42, 0.37) * (0.65 + 0.45 * fbm(p.xz * 4.0 + p.y * 2.0, 4)); rough = 0.85;
      n = bumpN(p, n, 7.0, 0.18);
    } else if (id == 7.0) {
      alb = vec3(0.6, 0.4, 0.24); metal = 1.0; rough = 0.35;
    } else if (id == 8.0) {
      alb = vec3(0.72, 0.66, 0.55); rough = 0.6;
    } else {
      alb = vec3(0.12, 0.08, 0.05); rough = 0.8;
    }
    // the dropped torch's light
    vec3 lp = torchHead() + vec3(0.0, 0.35, 0.0);
    vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2);
    float sh = shadowR(p + n * 0.02, lp);
    col = brdf(n, v, L, alb, rough, metal, torchCol3() * 6.0 / (d2 + 0.05)) * sh;
    // the city burning behind us: a broad low red light from -z
    vec3 Lc = normalize(vec3(0.2, 0.18, -1.0));
    col += brdf(n, v, Lc, alb, rough, metal, vec3(1.0, 0.25, 0.07) * 0.9);
    col += alb * vec3(0.09, 0.03, 0.02) * (0.4 + 0.6 * n.y);
    // the cart's load smouldering: a low fire in the wreck
    vec3 cf = cartFire() + vec3(0.0, 0.5, 0.0);
    vec3 Lf = cf - p; float df2 = dot(Lf, Lf); Lf *= inversesqrt(df2);
    col += brdf(n, v, Lf, alb, rough, metal, torchCol3() * 14.0 / (df2 + 0.3)) * shadowR(p + n * 0.02, cf);
    { vec3 ff = R(0.8, 1.2, 46.0); vec3 Lg = ff - p; float dg2 = dot(Lg, Lg); col += brdf(n, v, Lg * inversesqrt(dg2), alb, rough, metal, torchCol3() * 60.0 / (dg2 + 1.0)); }
    if (metal > 0.5) col += vec3(0.3, 0.06, 0.02) * fresnelR(n, v, alb, metal) * 0.5;
    // ahead the road runs into smoke
    float fogk = 1.0 - exp(-max(t - 8.0, 0.0) * 0.03);
    col = mix(col, vec3(0.1, 0.028, 0.016) + vec3(0.1, 0.025, 0.012) * fbm(p.xz * 0.08 + vec2(uTime * 0.1, 0.0), 3), fogk);
  }
  // drifting smoke near the ground ahead
  {
    vec3 acc = vec3(0); float tr = 1.0;
    float j = hash12(gl_FragCoord.xy + uJitter * 31.0);
    for (int i = 0; i < 8; i++) {
      float tt = 4.0 + (float(i) + j) * 6.0;
      if (tt > t) break;
      vec3 q = ro + rd * tt;
      float n = fbm(q * vec3(0.18, 0.35, 0.18) + vec3(-uTime * 0.25, -uTime * 0.05, 0.0), 4);
      float den = smoothstep(0.45, 0.75, n) * smoothstep(5.0, 0.0, q.y) * smoothstep(8.0, 30.0, q.z - ro.z + 8.0) * 0.15;
      float a = 1.0 - exp(-den * 6.0);
      acc += tr * a * (vec3(0.16, 0.045, 0.022) * (0.6 + 0.8 * smoothstep(10.0, 40.0, q.z - ro.z)) + torchCol3() * 0.2 / (1.0 + dot(q - torchHead(), q - torchHead())));
      tr *= 1.0 - a;
    }
    col = col * tr + acc;
  }
  // the smouldering cart: low flames licking from the wreck
  col += flame(ro, rd, cartFire(), 1.3, 1.3, 11.0, t, 5.0);
  col += flame(ro, rd, cartFire() + vec3(0.5, 0.0, -0.4), 0.8, 1.0, 17.0, t, 4.0);
  col += torchCol3() * glowLine(ro, rd, cartFire() + vec3(0.0, 0.6, 0.0), t) * 0.006;
  // far down the road in the smoke, something else burning
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float z = 46.0 + fi * fi * 9.0 + 14.0 * fi;
    vec3 ff = R((hash11(fi * 3.3) - 0.5) * 9.0 + (i == 0 ? 1.0 : 0.0), 0.0, z);
    float far = exp(-(z - 40.0) * 0.012);
    col += flame(ro, rd, ff, (2.2 + 2.0 * hash11(fi)) * (1.0 + fi * 0.4), 1.6, 23.0 + fi * 7.0, t, 1.2 * far);
    col += torchCol3() * glowLine(ro, rd, ff + vec3(0.0, 1.5, 0.0), t) * 0.03 * (1.0 + fi);
  }
  // the burning valley on the horizon ahead, through the smoke
  col += vec3(0.5, 0.1, 0.03) * 0.25 * exp(-max(rd.y, 0.0) * 25.0) * smoothstep(-0.05, 0.0, rd.y) * (0.5 + fbm(vec2(atan(rd.x, rd.z) * 10.0, uTime * 0.1), 3));
  // the torch flame on the road and its glow
  col += flame(ro, rd, torchHead() + vec3(0.0, 0.0, 0.0), 0.75, 0.9, 5.0, t, 7.0);
  col += torchCol3() * glowLine(ro, rd, torchHead() + vec3(0.0, 0.3, 0.0), t) * 0.004;
  col += embers(ro, rd, t, 2, ro.z + 1.5, 2.5, 8, 0.6, 0.9, vec3(-20.0, 0.0, -10.0), vec3(20.0, 8.0, 120.0), 0.5);
  return col;
}
`;
