// Packing the cold lights (the fallen ones) for the uWat uniform of lib/x-mount-near.js.
// Each light: { p: [x, y, z] km, k: brightness, trail: [x, y, z] km (back along its way), wing: 0..1 }
export function packWatchers(list) {
  const a = new Array(64).fill(0);
  list.slice(0, 8).forEach((w, i) => {
    a.splice(i * 8, 8, w.p[0], w.p[1], w.p[2], w.k ?? 1, ...(w.trail ?? [0, 0, 0]), w.wing ?? 0);
  });
  return a;
}
export const SUMMIT = [1.72, 1.69, -0.007];
// a point placed relative to a camera: dist ahead, right, up (km)
export function camPoint(cam, dist, right, up) {
  const f = cam.target.map((v, i) => v - cam.pos[i]); const fl = Math.hypot(...f); const fw = f.map((v) => v / fl);
  const r = [fw[2] * 0 - fw[1] * 0, 0, 0];
  const rr = [-fw[2], 0, fw[0]]; const rl = Math.hypot(...rr); const rn = rr.map((v) => v / rl);
  const u = [rn[1] * fw[2] - rn[2] * fw[1], rn[2] * fw[0] - rn[0] * fw[2], rn[0] * fw[1] - rn[1] * fw[0]];
  return [0, 1, 2].map((i) => cam.pos[i] + fw[i] * dist + rn[i] * right + u[i] * up);
}
