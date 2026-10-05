// s25-end: "The Lord God said to Noe, The end of all men is before Me." Night on Noe's hill: past the
// dark cedars of the grove, on the far horizon a wall of storm stretches across the whole world,
// black and immense, lightning flickering inside it and lighting it from within; a bolt falls on
// "end". The grove's clay lamp burns small on a stone in the foreground. The camera pushes slowly
// out between the trunks toward the edge of the hill.
import { grade, ease, clamp01, drift, linesAt, wordIn } from '/song/lib/look.js';
import { groveScene } from '/song/lib/x-grove-scene.js';
import { gh } from '/song/lib/x-grove.js';

export const kind = 'shader';

export default (P) => {
  const [l1, l2] = linesAt(P.from - 0.6, 'The Lord God said to Noe', 'The end of all men');
  const tEnd = wordIn(l2, 'end').start, tMe = wordIn(l2, 'Me').start, tLord = wordIn(l1, 'Lord').start;
  const span = P.to - P.from;
  // flashes inside the wall: [time, azimuth (relative, radians), strength]
  const FL = [[P.from + 0.15, -0.35, 0.5], [tLord, 0.45, 0.7], [wordIn(l1, 'Noe').start - 0.1, -0.7, 0.6], [tEnd - 0.02, 0.08, 1.6], [wordIn(l2, 'all').start + 0.1, 0.6, 0.6], [tMe - 0.02, -0.25, 1.2], [P.to - 0.25, 0.3, 0.6]];
  const env = (x) => (x < 0 ? 0 : Math.exp(-x * 5.5) * (0.65 + 0.35 * Math.cos(x * 47)) * Math.min(1, x / 0.02));
  const flashes = (t) => FL.map(([t0, az, k]) => [az, 0.3 * k * env(t - t0)]).sort((a, b) => b[1] - a[1]);
  const camera = (t) => {
    const e = ease.inOut3(clamp01((t - P.from) / span));
    const d = drift(t, 0.01);
    const x = 12.5 + 3.5 * e, z = 2.2 - 0.2 * e;
    return { pos: [x + d[0], gh(x, z) + 1.45 + d[1], z], target: [x + 60, gh(x, z) + 1.5, z + 4], fov: 50 };
  };
  const lampAt = [22.6, gh(22.6, 6.0) + 0.3, 6.0];
  return groveScene(P, {
    name: 's25-end',
    camera,
    uniforms: {
      uSunDir: [0.3, 0.6, 0.2], uSunCol: [0, 0, 0], uSunVis: 0.0, uKeyK: 0.0,
      uSkyZen: [0.012, 0.015, 0.022], uSkyHor: [0.045, 0.055, 0.075], uCloudAmb: [0.018, 0.021, 0.03], uAmbCol: [0.012, 0.014, 0.02],
      uCloud: 0.9, uGate: 0.0, uGrace: 0.0, uGapR: 0, uHaze: 0.0012, uFogCol: [0.008, 0.009, 0.014], uLampH: 0.3, uRays: 0.0,
      uWall: 1.0, uWallAz: Math.PI / 2, uLampF: lampAt, uLampFk: 0.5,
    },
    set(t, u, c) {
      const f = flashes(t);
      u.uFlash = [f[0][0], f[0][1], f[1][0], f[1][1]];
      const be = (x) => (x < 0 || x > 0.35 ? 0 : (x < 0.06 ? 1 : 0.5 + 0.5 * Math.cos(x * 70)) * Math.exp(-x * 6));
      const b1 = be(t - tEnd), b2 = be(t - tMe);
      u.uBolt = b1 >= b2 ? [0.08, b1 * 0.35, 3.0, 0] : [-0.25, b2 * 0.28, 9.0, 0];
      const k = f[0][1] + f[1][1];
      const az = Math.PI / 2 + f[0][0];
      u.uFlashL = [Math.sin(az) * 0.3 * k, 0.12 * k, -Math.cos(az) * 0.3 * k];
      u.uFocus = 40.0; u.uAper = 0.03;
    },
    post: (t) => grade(t, { exposure: 4.5, bloom: 0.14, threshold: 0.8, vignette: 0.5 }),
    finish: () => ({ grade: { shadows: [0.0, 0.01, 0.04], highlights: [0.92, 0.95, 1.0], amount: 0.5 } }),
  });
};
