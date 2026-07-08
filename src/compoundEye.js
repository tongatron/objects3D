// Shader post-process "occhio composto": distorsione fisheye, mosaico di
// ommatidi esagonali con bordi scuri e vignettatura periferica.
export const CompoundEyeShader = {
  name: 'CompoundEyeShader',
  uniforms: {
    tDiffuse: { value: null },
    aspect: { value: 1.0 },
    cells: { value: 55.0 },   // colonne di ommatidi
    facet: { value: 0.85 },   // quanto il colore è appiattito sul centro cella
    distort: { value: 0.35 }, // curvatura fisheye
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float aspect;
    uniform float cells;
    uniform float facet;
    uniform float distort;
    varying vec2 vUv;

    const vec2 S = vec2(1.0, 1.7320508);

    // centro dell'esagono più vicino (griglia pointy-top)
    vec2 hexCenter(vec2 p) {
      vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / S.xyxy) + 0.5;
      vec4 h = vec4(p - hC.xy * S, p - (hC.zw + 0.5) * S);
      return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? hC.xy * S : (hC.zw + 0.5) * S;
    }

    void main() {
      // fisheye barrel
      vec2 c = vUv - 0.5;
      c.x *= aspect;
      float r = length(c);
      vec2 uv = vec2(0.5) + (c * (1.0 - distort * r * r)) / vec2(aspect, 1.0);

      // griglia di ommatidi
      vec2 p = uv * cells;
      p.x *= aspect;
      vec2 hc = hexCenter(p);
      vec2 centerUv = hc / cells;
      centerUv.x /= aspect;

      vec4 sharp = texture2D(tDiffuse, uv);
      vec4 flat_ = texture2D(tDiffuse, centerUv);
      vec4 col = mix(sharp, flat_, facet);

      // bordo scuro tra le faccette
      float edge = length(p - hc);
      col.rgb *= 1.0 - smoothstep(0.38, 0.5, edge) * 0.45;

      // vignettatura periferica (campo visivo dell'insetto)
      col.rgb *= 1.0 - smoothstep(0.55, 0.85, r) * 0.85;

      gl_FragColor = col;
    }
  `,
};
