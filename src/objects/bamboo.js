import * as THREE from 'three';

// Foresta di bambù: ogni canna è una pila di internodi (InstancedMesh) con
// anelli ai nodi e ciuffi di foglie lanceolate in alto. Il vento la fa
// oscillare piegandola attorno alla base, con la punta che si flette di più.
// Le canne possono essere "mangiate" (dal panda): si accorciano gradualmente
// e ricrescono con calma quando vengono lasciate in pace.

const FIELD_RADIUS = 5.5;
const MAX_CANES = 150;
const SEGMENTS = 6; // internodi per canna
const LEAVES_PER_CANE = 9;

function leafGeometry() {
  // foglia lanceolata, leggermente incurvata
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.02, 0.04, 0.022, 0.14, 0, 0.24);
  shape.bezierCurveTo(-0.022, 0.14, -0.02, 0.04, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const ny = pos.getY(i) / 0.24;
    pos.setZ(i, 0.05 * ny * ny);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createBamboo() {
  const params = { densita: 60 };

  const group = new THREE.Group();
  group.name = 'bambu';

  const caneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
  const nodeMat = new THREE.MeshStandardMaterial({ color: 0x5a7a2e, roughness: 0.7 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7a28, roughness: 0.8, side: THREE.DoubleSide });

  // internodo: y locale in [0, 1], lievemente rastremato
  const segGeo = new THREE.CylinderGeometry(0.026, 0.03, 1, 12, 1);
  segGeo.translate(0, 0.5, 0);
  const nodeGeo = new THREE.TorusGeometry(0.03, 0.007, 8, 16);
  nodeGeo.rotateX(Math.PI / 2);
  const leafGeo = leafGeometry();

  let segs = null;
  let nodes = null;
  let leaves = null;
  let canes = [];

  const dummy = new THREE.Object3D();
  const caneM = new THREE.Matrix4();
  const partM = new THREE.Matrix4();
  const windQ = new THREE.Quaternion();
  const caneQ = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const color = new THREE.Color();

  function rebuild() {
    const count = Math.round(THREE.MathUtils.clamp(params.densita, 1, MAX_CANES));
    for (const im of [segs, nodes, leaves]) {
      if (im) { group.remove(im); im.dispose(); }
    }

    segs = new THREE.InstancedMesh(segGeo, caneMat, count * SEGMENTS);
    nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, count * SEGMENTS);
    leaves = new THREE.InstancedMesh(leafGeo, leafMat, count * LEAVES_PER_CANE);
    for (const im of [segs, nodes, leaves]) {
      im.castShadow = true;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    canes = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * FIELD_RADIUS;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = 2.2 + Math.random() * 1.6;
      const thick = 0.8 + Math.random() * 0.5;
      const tiltQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (Math.random() - 0.5) * 0.12,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.12
      ));
      // foglie: offset locali fissi nella metà alta della canna
      const leafSlots = [];
      for (let l = 0; l < LEAVES_PER_CANE; l++) {
        leafSlots.push({
          t: 0.55 + Math.random() * 0.45, // quota lungo la canna (frazione)
          q: new THREE.Quaternion().setFromEuler(new THREE.Euler(
            0.7 + Math.random() * 0.9,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.6
          )),
          s: 0.8 + Math.random() * 0.7,
        });
      }
      canes.push({ x, z, h, thick, tiltQ, leafSlots, eaten: 0 });

      // tinta per canna: dal verde giovane al giallo-verde maturo
      color.setHSL(0.19 + Math.random() * 0.08, 0.45 + Math.random() * 0.2, 0.4 + Math.random() * 0.18);
      for (let sIdx = 0; sIdx < SEGMENTS; sIdx++) {
        segs.setColorAt(i * SEGMENTS + sIdx, color);
      }
    }
    group.add(segs, nodes, leaves);
    pose(null);
  }

  function pose(wind) {
    for (let i = 0; i < canes.length; i++) {
      const c = canes[i];
      const h = c.h * (1 - 0.55 * c.eaten); // canna morsicata = più corta

      if (wind) {
        // canna flessibile: oscilla attorno alla base
        const sw = wind.sway(c.x, c.z) * 0.045;
        axis.set(wind.dir.y, 0, -wind.dir.x);
        windQ.setFromAxisAngle(axis, -sw);
        caneQ.copy(windQ).multiply(c.tiltQ);
      } else {
        caneQ.copy(c.tiltQ);
      }

      dummy.position.set(c.x, 0, c.z);
      dummy.quaternion.copy(caneQ);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      caneM.copy(dummy.matrix);

      const segH = h / SEGMENTS;
      for (let sIdx = 0; sIdx < SEGMENTS; sIdx++) {
        // la punta si flette di più: piccola rotazione extra cumulativa
        const bendT = sIdx / SEGMENTS;
        dummy.position.set(0, sIdx * segH, 0);
        dummy.quaternion.identity();
        if (wind) {
          const extra = wind.sway(c.x, c.z) * 0.02 * bendT * bendT;
          dummy.quaternion.setFromAxisAngle(axis, -extra * SEGMENTS);
        }
        dummy.scale.set(c.thick, segH * 1.02, c.thick);
        dummy.updateMatrix();
        partM.multiplyMatrices(caneM, dummy.matrix);
        segs.setMatrixAt(i * SEGMENTS + sIdx, partM);

        // anello al nodo
        dummy.position.set(0, sIdx * segH, 0);
        dummy.quaternion.identity();
        dummy.scale.set(c.thick, c.thick, c.thick);
        dummy.updateMatrix();
        partM.multiplyMatrices(caneM, dummy.matrix);
        nodes.setMatrixAt(i * SEGMENTS + sIdx, partM);
      }

      for (let l = 0; l < LEAVES_PER_CANE; l++) {
        const slot = c.leafSlots[l];
        const visible = slot.t <= 1 - c.eaten * 0.9; // le foglie mangiate spariscono
        dummy.position.set(0, slot.t * h, 0);
        dummy.quaternion.copy(slot.q);
        const s = visible ? slot.s : 0.0001;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        partM.multiplyMatrices(caneM, dummy.matrix);
        leaves.setMatrixAt(i * LEAVES_PER_CANE + l, partM);
      }
    }
    segs.instanceMatrix.needsUpdate = true;
    nodes.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
  }

  // --- API per il panda ---
  function getCane(i) {
    const c = canes[i];
    return c ? { x: c.x, z: c.z, h: c.h * (1 - 0.55 * c.eaten), eaten: c.eaten } : null;
  }

  function caneCount() {
    return canes.length;
  }

  function bite(i, dt) {
    const c = canes[i];
    if (c) c.eaten = Math.min(1, c.eaten + dt * 0.09);
  }

  function update(wind, dt = 0) {
    if (!group.visible) return;
    // ricrescita lenta
    for (const c of canes) {
      if (c.eaten > 0) c.eaten = Math.max(0, c.eaten - dt * 0.008);
    }
    pose(wind);
  }

  rebuild();

  return { group, params, rebuild, update, getCane, caneCount, bite };
}
