// A scene in Noe's grove: wraps the world's GLSL with a camera, per-frame uniforms and the grade.
// set(t, u) receives the uniform values (plain numbers and arrays) to change for the frame.
import { grade } from '/song/lib/look.js';
import { GROVE_GLSL, GROVE_UNIFORMS } from '/song/lib/x-grove.js';

export function groveScene(P, { name, camera, uniforms = {}, set, post, finish }) {
  return {
    name, from: P.from, to: P.to,
    frag: GROVE_GLSL + 'vec3 shade(vec2 fc) { return grove(fc); }',
    uniforms: { ...GROVE_UNIFORMS, ...uniforms },
    camera,
    update(t, u) {
      const vals = {};
      set?.(t, vals, camera(t));
      for (const [k, v] of Object.entries(vals)) {
        if (!u[k]) continue;
        if (Array.isArray(v)) {
          if (u[k].value?.set && v.length === 3) u[k].value.set(...v);
          else if (u[k].value?.set) u[k].value.set(...v);
          else u[k].value = v;
        } else u[k].value = v;
      }
    },
    post: post ?? ((t) => grade(t, {})),
    finish: finish ?? (() => ({})),
  };
}
