import * as THREE from 'three';

// Fili d'erba 3D istanziati, mossi dal vento nel vertex shader.
// Il filo è una striscia rastremata con y locale in [0, 1]; lo sway è
// proporzionale a y² così la base resta ancorata al terreno.

const BLADE_COUNT = 7000;
const AREA_RADIUS = 9;

function bladeGeometry() {
  const segs = 4;
  const positions = [];
  const indices = [];
  const halfW = 0.5; // scalato per istanza
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = halfW * (1 - t * 0.9);
    positions.push(-w, t, 0, w, t, 0);
  }
  // punta
  positions.push(0, 1.08, 0);
  for (let i = 0; i < segs; i++) {
    const b = i * 2;
    indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  indices.push(segs * 2, segs * 2 + 1, positions.length / 3 - 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createGrass(scene, wind) {
  const params = { altezza: 3.0 };
  const uHeight = { value: params.altezza };

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // il colore vero è per-istanza
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, wind.uniforms);
    shader.uniforms.uGrassHeight = uHeight;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWindTime;
        uniform float uWindStrength;
        uniform vec2 uWindDir;
        uniform float uGrassHeight;`
      )
      .replace(
        '#include <project_vertex>',
        `transformed.y *= uGrassHeight;
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        {
          float hgt = clamp(position.y, 0.0, 1.2);
          vec4 wpos = modelMatrix * mvPosition;
          float ph = dot(wpos.xz, uWindDir) * 1.5;
          float sway = uWindStrength * (0.7 * sin(uWindTime + ph)
                     + 0.3 * sin(uWindTime * 2.33 + ph * 1.7 + 1.0));
          wpos.xz += uWindDir * sway * hgt * hgt * 0.06;
          mvPosition = viewMatrix * wpos;
        }
        gl_Position = projectionMatrix * mvPosition;`
      );
  };

  const mesh = new THREE.InstancedMesh(bladeGeometry(), material, BLADE_COUNT);
  mesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < BLADE_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * AREA_RADIUS;
    dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    dummy.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.4);
    const h = 0.07 + Math.random() * 0.11;
    dummy.scale.set(0.012 + Math.random() * 0.008, h, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.setHSL(0.26 + Math.random() * 0.05, 0.5 + Math.random() * 0.2, 0.22 + Math.random() * 0.14);
    mesh.setColorAt(i, color);
  }

  scene.add(mesh);

  function setVisible(v) {
    mesh.visible = v;
  }

  function apply() {
    uHeight.value = params.altezza;
  }

  return { mesh, params, setVisible, apply };
}
