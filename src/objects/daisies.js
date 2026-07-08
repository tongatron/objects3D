import * as THREE from 'three';

// Campo di margherite ad alta definizione. Le piante sono tante (~90),
// quindi ogni parte (steli, foglie, petali, centri) è un InstancedMesh:
// geometrie dense, un solo draw call per parte.

const FLOWER_COUNT = 90;
const PETALS_PER_FLOWER = 20;
const FIELD_RADIUS = 5.5;

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
  const group = new THREE.Group();

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

  const stems = new THREE.InstancedMesh(stemGeo, stemMat, FLOWER_COUNT);
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, FLOWER_COUNT * PETALS_PER_FLOWER);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, FLOWER_COUNT * 2);
  const centers = new THREE.InstancedMesh(centerGeo, centerMat, FLOWER_COUNT);
  for (const im of [stems, petals, leaves, centers]) im.castShadow = true;

  const dummy = new THREE.Object3D();
  const headM = new THREE.Matrix4();
  const ringM = new THREE.Matrix4();
  const petalM = new THREE.Matrix4();
  const faceUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const tiltQ = new THREE.Quaternion();
  const headQ = new THREE.Quaternion();
  const top = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);

  let petalIdx = 0;
  let leafIdx = 0;
  for (let i = 0; i < FLOWER_COUNT; i++) {
    // distribuzione: più fitto al centro, mai perfettamente in griglia
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * FIELD_RADIUS;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = 0.28 + Math.random() * 0.22;

    // inclinazione casuale dello stelo
    tiltQ.setFromEuler(new THREE.Euler(
      (Math.random() - 0.5) * 0.35,
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.35
    ));

    // stelo
    dummy.position.set(x, 0, z);
    dummy.quaternion.copy(tiltQ);
    dummy.scale.set(1, h, 1);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);

    // sommità dello stelo in coordinate del gruppo
    top.set(0, h, 0).applyQuaternion(tiltQ);
    top.x += x;
    top.z += z;

    // capolino rivolto verso l'alto, ereditando l'inclinazione dello stelo
    headQ.copy(tiltQ).multiply(faceUp);
    headM.compose(top, headQ, one);

    // centro giallo bombato
    dummy.position.copy(top);
    dummy.quaternion.copy(headQ);
    const cs = 0.85 + Math.random() * 0.35;
    dummy.scale.set(cs, cs, cs);
    dummy.updateMatrix();
    centers.setMatrixAt(i, dummy.matrix);

    // corona di petali
    const petalScale = 0.85 + Math.random() * 0.3;
    for (let p = 0; p < PETALS_PER_FLOWER; p++) {
      const ang = (p / PETALS_PER_FLOWER) * Math.PI * 2 + Math.random() * 0.1;
      dummy.position.set(0, 0, 0.004);
      dummy.quaternion.setFromEuler(new THREE.Euler(-0.18 + Math.random() * 0.1, 0, ang));
      dummy.scale.set(petalScale, petalScale, petalScale);
      dummy.updateMatrix();
      ringM.copy(dummy.matrix);
      petalM.multiplyMatrices(headM, ringM);
      petals.setMatrixAt(petalIdx++, petalM);
    }

    // due foglie alla base
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
  group.name = 'margherite';
  return group;
}
