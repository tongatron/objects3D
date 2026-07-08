import * as THREE from 'three';

// Campo di margherite ad alta definizione. Le piante sono tante,
// quindi ogni parte (steli, foglie, petali, centri) è un InstancedMesh:
// geometrie dense, un solo draw call per parte. Il vento ondeggia le
// piante ricalcolando per frame le matrici (petali = matrice del capolino
// moltiplicata per la matrice locale del petalo, calcolata una volta sola).

const PETALS_PER_FLOWER = 20;
const FIELD_RADIUS = 5.5;
const MAX_FLOWERS = 300;

function petalGeometry() {
  // petalo bianco a lingua, punta arrotondata, leggera conca
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.016, 0.008, 0.02, 0.05, 0.017, 0.08);
  shape.bezierCurveTo(0.014, 0.105, 0.007, 0.118, 0, 0.12);
  shape.bezierCurveTo(-0.007, 0.118, -0.014, 0.105, -0.017, 0.08);
  shape.bezierCurveTo(-0.02, 0.05, -0.016, 0.008, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 16);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, x * x * 6 + y * y * 0.35); // conca trasversale + punta sollevata
  }
  geo.computeVertexNormals();
  geo.translate(0, 0.028, 0); // incernierato appena fuori dal centro
  return geo;
}

function leafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.03, 0.015, 0.045, 0.06, 0.012, 0.1);
  shape.bezierCurveTo(0.005, 0.11, -0.005, 0.11, -0.012, 0.1);
  shape.bezierCurveTo(-0.045, 0.06, -0.03, 0.015, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 12);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, -x * x * 3);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createDaisies() {
  const params = { densita: 90 };

  const group = new THREE.Group();
  group.name = 'margherite';

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a7a2a, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f6b24, roughness: 0.9, side: THREE.DoubleSide });
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xfdfdf6, roughness: 0.65, side: THREE.DoubleSide });
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xf0b429, roughness: 0.95 });

  // geometrie condivise, dense
  const stemGeo = new THREE.CylinderGeometry(0.006, 0.009, 1, 10, 4);
  stemGeo.translate(0, 0.5, 0); // base nell'origine
  const petalGeo = petalGeometry();
  const leafGeo = leafGeometry();
  const centerGeo = new THREE.SphereGeometry(0.028, 24, 16);
  centerGeo.scale(1, 1, 0.55);

  let stems = null;
  let petals = null;
  let leaves = null;
  let centers = null;
  let flowers = []; // dati statici per pianta, per l'animazione del vento

  const dummy = new THREE.Object3D();
  const headM = new THREE.Matrix4();
  const petalM = new THREE.Matrix4();
  const faceUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const windQ = new THREE.Quaternion();
  const flowerQ = new THREE.Quaternion();
  const headQ = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const top = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const scl = new THREE.Vector3();

  function rebuild() {
    const count = Math.round(THREE.MathUtils.clamp(params.densita, 1, MAX_FLOWERS));
    for (const im of [stems, petals, leaves, centers]) {
      if (im) { group.remove(im); im.dispose(); }
    }

    stems = new THREE.InstancedMesh(stemGeo, stemMat, count);
    petals = new THREE.InstancedMesh(petalGeo, petalMat, count * PETALS_PER_FLOWER);
    leaves = new THREE.InstancedMesh(leafGeo, leafMat, count * 2);
    centers = new THREE.InstancedMesh(centerGeo, centerMat, count);
    for (const im of [stems, petals, leaves, centers]) {
      im.castShadow = true;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    flowers = [];
    let leafIdx = 0;
    for (let i = 0; i < count; i++) {
      // distribuzione: più fitto al centro, mai perfettamente in griglia
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * FIELD_RADIUS;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = 0.28 + Math.random() * 0.22;

      const tiltQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (Math.random() - 0.5) * 0.35,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.35
      ));

      // matrici locali dei petali (fisse: il vento muove tutto il capolino)
      const petalScale = 0.85 + Math.random() * 0.3;
      const rings = [];
      for (let p = 0; p < PETALS_PER_FLOWER; p++) {
        const ang = (p / PETALS_PER_FLOWER) * Math.PI * 2 + Math.random() * 0.1;
        dummy.position.set(0, 0, 0.004);
        dummy.quaternion.setFromEuler(new THREE.Euler(-0.18 + Math.random() * 0.1, 0, ang));
        dummy.scale.set(petalScale, petalScale, petalScale);
        dummy.updateMatrix();
        rings.push(dummy.matrix.clone());
      }

      flowers.push({ x, z, h, tiltQ, rings, centerScale: 0.85 + Math.random() * 0.35 });

      // due foglie alla base (statiche)
      for (let l = 0; l < 2; l++) {
        dummy.position.set(x + (Math.random() - 0.5) * 0.05, 0.005, z + (Math.random() - 0.5) * 0.05);
        dummy.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.5 + Math.random() * 0.3, Math.random() * Math.PI * 2, 0));
        const ls = 1.4 + Math.random() * 0.8;
        dummy.scale.set(ls, ls, ls);
        dummy.updateMatrix();
        leaves.setMatrixAt(leafIdx++, dummy.matrix);
      }
    }
    group.add(stems, petals, leaves, centers);
    pose(null); // posa iniziale senza vento
  }

  // ricalcola le matrici di steli, centri e petali; wind può essere null
  function pose(wind) {
    let petalIdx = 0;
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i];

      if (wind) {
        // piega attorno all'asse orizzontale perpendicolare al vento
        const sw = wind.sway(f.x, f.z) * 0.3;
        axis.set(wind.dir.y, 0, -wind.dir.x); // = cross(Y, dir)
        windQ.setFromAxisAngle(axis, -sw);
        flowerQ.copy(windQ).multiply(f.tiltQ);
      } else {
        flowerQ.copy(f.tiltQ);
      }

      dummy.position.set(f.x, 0, f.z);
      dummy.quaternion.copy(flowerQ);
      dummy.scale.set(1, f.h, 1);
      dummy.updateMatrix();
      stems.setMatrixAt(i, dummy.matrix);

      top.set(0, f.h, 0).applyQuaternion(flowerQ);
      top.x += f.x;
      top.z += f.z;

      headQ.copy(flowerQ).multiply(faceUp);

      scl.setScalar(f.centerScale);
      headM.compose(top, headQ, scl);
      centers.setMatrixAt(i, headM);

      headM.compose(top, headQ, one);
      for (const ring of f.rings) {
        petalM.multiplyMatrices(headM, ring);
        petals.setMatrixAt(petalIdx++, petalM);
      }
    }
    stems.instanceMatrix.needsUpdate = true;
    centers.instanceMatrix.needsUpdate = true;
    petals.instanceMatrix.needsUpdate = true;
  }

  function update(wind) {
    if (!group.visible) return;
    pose(wind);
  }

  rebuild();

  return { group, params, rebuild, update };
}
