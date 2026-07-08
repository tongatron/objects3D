import * as THREE from 'three';

// Campo di rose rosse ad alta definizione, stesso impianto delle margherite:
// ogni parte (steli, foglie, petali, boccioli, sepali) è un InstancedMesh e il
// vento piega l'intera pianta ricalcolando le matrici per frame. La corolla è
// costruita a verticilli: petali interni quasi verticali e concavi attorno al
// bocciolo, esterni più aperti e grandi.

const FIELD_RADIUS = 5.5;
const MAX_FLOWERS = 300;

// [numero petali, apertura dal verticale (rad), raggio base, scala]
const WHORLS = [
  [5, 0.22, 0.006, 0.6],
  [7, 0.5, 0.012, 0.85],
  [9, 0.82, 0.018, 1.05],
];
const PETALS_PER_FLOWER = WHORLS.reduce((n, w) => n + w[0], 0);
const SEPALS_PER_FLOWER = 5;

function petalGeometry() {
  // petalo largo a ventaglio, concavo verso l'asse, orlo superiore ricurvo
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.03, 0.004, 0.038, 0.03, 0.032, 0.05);
  shape.bezierCurveTo(0.026, 0.062, 0.012, 0.068, 0, 0.068);
  shape.bezierCurveTo(-0.012, 0.068, -0.026, 0.062, -0.032, 0.05);
  shape.bezierCurveTo(-0.038, 0.03, -0.03, 0.004, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 16);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i) / 0.038;
    const ny = pos.getY(i) / 0.068;
    // conca + riccio dell'orlo verso l'esterno
    pos.setZ(i, 0.02 * nx * nx + 0.024 * ny * ny - 0.02 * ny * ny * ny);
  }
  geo.computeVertexNormals();
  return geo;
}

function sepalGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.01, 0.008, 0.012, 0.03, 0.004, 0.05);
  shape.lineTo(0, 0.062);
  shape.lineTo(-0.004, 0.05);
  shape.bezierCurveTo(-0.012, 0.03, -0.01, 0.008, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 8);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const ny = pos.getY(i) / 0.062;
    pos.setZ(i, 0.012 * ny * ny);
  }
  geo.computeVertexNormals();
  return geo;
}

function leafGeometry() {
  // fogliolina ovale dentellata (semplificata) della rosa
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.028, 0.01, 0.036, 0.05, 0.01, 0.085);
  shape.bezierCurveTo(0.004, 0.093, -0.004, 0.093, -0.01, 0.085);
  shape.bezierCurveTo(-0.036, 0.05, -0.028, 0.01, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 12);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, -x * x * 2.5);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createRoses() {
  const params = { densita: 300 };

  const group = new THREE.Group();
  group.name = 'rose';

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2f5a1e, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2c5222, roughness: 0.85, side: THREE.DoubleSide });
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xb3122e, roughness: 0.5, side: THREE.DoubleSide });
  const budMat = new THREE.MeshStandardMaterial({ color: 0x6e0a1c, roughness: 0.55 });
  const sepalMat = new THREE.MeshStandardMaterial({ color: 0x3a6626, roughness: 0.9, side: THREE.DoubleSide });

  const stemGeo = new THREE.CylinderGeometry(0.008, 0.012, 1, 10, 4);
  stemGeo.translate(0, 0.5, 0);
  const petalGeo = petalGeometry();
  const sepalGeo = sepalGeometry();
  const leafGeo = leafGeometry();
  const budGeo = new THREE.SphereGeometry(0.013, 20, 14);
  budGeo.scale(1, 1, 1.25);
  budGeo.translate(0, 0, 0.002);

  let stems = null;
  let petals = null;
  let leaves = null;
  let buds = null;
  let sepals = null;
  let flowers = [];

  const dummy = new THREE.Object3D();
  const headM = new THREE.Matrix4();
  const partM = new THREE.Matrix4();
  const faceUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const qz = new THREE.Quaternion();
  const qx = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const windQ = new THREE.Quaternion();
  const flowerQ = new THREE.Quaternion();
  const headQ = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const top = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const scl = new THREE.Vector3();

  // matrice locale di un petalo/sepalo nel frame del capolino (Z = asse fiore)
  function ringMatrix(ang, opening, r0, scale, zBase) {
    qz.setFromAxisAngle(Z, ang);
    qx.setFromAxisAngle(X, -(Math.PI / 2 - opening));
    dummy.quaternion.copy(qz).multiply(qx);
    dummy.position.set(-Math.sin(ang) * r0, Math.cos(ang) * r0, zBase);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    return dummy.matrix.clone();
  }

  function rebuild() {
    const count = Math.round(THREE.MathUtils.clamp(params.densita, 1, MAX_FLOWERS));
    for (const im of [stems, petals, leaves, buds, sepals]) {
      if (im) { group.remove(im); im.dispose(); }
    }

    stems = new THREE.InstancedMesh(stemGeo, stemMat, count);
    petals = new THREE.InstancedMesh(petalGeo, petalMat, count * PETALS_PER_FLOWER);
    leaves = new THREE.InstancedMesh(leafGeo, leafMat, count * 3);
    buds = new THREE.InstancedMesh(budGeo, budMat, count);
    sepals = new THREE.InstancedMesh(sepalGeo, sepalMat, count * SEPALS_PER_FLOWER);
    for (const im of [stems, petals, leaves, buds, sepals]) {
      im.castShadow = true;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    flowers = [];
    let leafIdx = 0;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * FIELD_RADIUS;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = 0.5 + Math.random() * 0.35;

      const tiltQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        (Math.random() - 0.5) * 0.3,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.3
      ));

      const headScale = 0.8 + Math.random() * 0.4;
      const rings = [];
      for (const [n, opening, r0, s] of WHORLS) {
        const phase = Math.random() * Math.PI * 2;
        for (let p = 0; p < n; p++) {
          const ang = phase + (p / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
          rings.push(ringMatrix(ang, opening + (Math.random() - 0.5) * 0.12, r0 * headScale, s * headScale, 0.002));
        }
      }
      const sepalRings = [];
      for (let p = 0; p < SEPALS_PER_FLOWER; p++) {
        const ang = (p / SEPALS_PER_FLOWER) * Math.PI * 2;
        sepalRings.push(ringMatrix(ang, 1.45, 0.012 * headScale, headScale, -0.004));
      }

      flowers.push({ x, z, h, tiltQ, rings, sepalRings, headScale });

      // tre foglioline basse sullo stelo (statiche)
      for (let l = 0; l < 3; l++) {
        dummy.position.set(x + (Math.random() - 0.5) * 0.06, 0.02 + Math.random() * 0.1, z + (Math.random() - 0.5) * 0.06);
        dummy.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.6 + Math.random() * 0.4, Math.random() * Math.PI * 2, 0));
        const ls = 1.1 + Math.random() * 0.6;
        dummy.scale.set(ls, ls, ls);
        dummy.updateMatrix();
        leaves.setMatrixAt(leafIdx++, dummy.matrix);
      }
    }
    group.add(stems, petals, leaves, buds, sepals);
    pose(null);
  }

  function pose(wind) {
    let petalIdx = 0;
    let sepalIdx = 0;
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i];

      if (wind) {
        // stelo legnoso: si piega meno delle margherite
        const sw = wind.sway(f.x, f.z) * 0.16;
        axis.set(wind.dir.y, 0, -wind.dir.x);
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

      scl.setScalar(f.headScale);
      headM.compose(top, headQ, scl);
      // bocciolo al centro della corolla
      partM.copy(headM);
      buds.setMatrixAt(i, partM);

      headM.compose(top, headQ, one);
      for (const ring of f.rings) {
        partM.multiplyMatrices(headM, ring);
        petals.setMatrixAt(petalIdx++, partM);
      }
      for (const ring of f.sepalRings) {
        partM.multiplyMatrices(headM, ring);
        sepals.setMatrixAt(sepalIdx++, partM);
      }
    }
    stems.instanceMatrix.needsUpdate = true;
    buds.instanceMatrix.needsUpdate = true;
    petals.instanceMatrix.needsUpdate = true;
    sepals.instanceMatrix.needsUpdate = true;
  }

  function update(wind) {
    if (!group.visible) return;
    pose(wind);
  }

  rebuild();

  return { group, params, rebuild, update };
}
