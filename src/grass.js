import * as THREE from 'three';

// Fili d'erba 3D istanziati, mossi dal vento nel vertex shader.
// Il filo è una striscia rastremata con y locale in [0, 1]; lo sway è
// proporzionale a y² così la base resta ancorata al terreno.
// Ogni filo ha un fattore di crescita per-istanza (aGrow): il tagliaerba
// lo abbassa al livello "stoppia" e dopo un ritardo il filo ricresce.

const BLADE_COUNT = 7000;
const AREA_RADIUS = 9;
const STUBBLE = 0.15; // altezza relativa dell'erba appena tagliata
const REGROW_DURATION = 1.5; // secondi per tornare all'altezza piena

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
        uniform float uGrassHeight;
        attribute float aGrow;`
      )
      .replace(
        '#include <project_vertex>',
        `transformed.y *= uGrassHeight * aGrow;
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

  const geometry = bladeGeometry();
  const growArr = new Float32Array(BLADE_COUNT).fill(1);
  const growAttr = new THREE.InstancedBufferAttribute(growArr, 1);
  growAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('aGrow', growAttr);

  const mesh = new THREE.InstancedMesh(geometry, material, BLADE_COUNT);
  mesh.receiveShadow = true;

  // posizioni piatte dei fili per il test di prossimità del tagliaerba
  const bladeX = new Float32Array(BLADE_COUNT);
  const bladeZ = new Float32Array(BLADE_COUNT);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < BLADE_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * AREA_RADIUS;
    bladeX[i] = Math.cos(a) * r;
    bladeZ[i] = Math.sin(a) * r;
    dummy.position.set(bladeX[i], 0, bladeZ[i]);
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

  // stato del taglio: istante in cui il filo è stato rasato (-1 = intero)
  const cutTime = new Float32Array(BLADE_COUNT).fill(-1);
  const regrowing = new Set();

  // rasa tutti i fili nel cerchio (ripassarci sopra azzera la ricrescita)
  function cutCircle(x, z, r, time) {
    if (!mesh.visible) return;
    const r2 = r * r;
    let changed = false;
    for (let i = 0; i < BLADE_COUNT; i++) {
      const dx = bladeX[i] - x;
      const dz = bladeZ[i] - z;
      if (dx * dx + dz * dz > r2) continue;
      cutTime[i] = time;
      growArr[i] = STUBBLE;
      regrowing.add(i);
      changed = true;
    }
    if (changed) growAttr.needsUpdate = true;
  }

  // dopo il ritardo l'erba risale dolcemente all'altezza piena
  function update(time, regrowDelay) {
    if (!regrowing.size) return;
    for (const i of regrowing) {
      const t = time - cutTime[i] - regrowDelay;
      if (t <= 0) continue;
      const k = Math.min(1, t / REGROW_DURATION);
      growArr[i] = STUBBLE + (1 - STUBBLE) * k * k * (3 - 2 * k);
      if (k >= 1) {
        growArr[i] = 1;
        cutTime[i] = -1;
        regrowing.delete(i);
      }
    }
    growAttr.needsUpdate = true;
  }

  return { mesh, params, setVisible, apply, cutCircle, update };
}
