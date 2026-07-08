import * as THREE from 'three';

function createSunflower(height) {
  const flower = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f6b1e, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7a24, roughness: 0.85, side: THREE.DoubleSide });
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.7, side: THREE.DoubleSide });
  const petalBackMat = new THREE.MeshStandardMaterial({ color: 0xd99a04, roughness: 0.75, side: THREE.DoubleSide });
  const centerMat = new THREE.MeshStandardMaterial({ color: 0x4a2c0f, roughness: 1.0 });
  const seedMat = new THREE.MeshStandardMaterial({ color: 0x33200b, roughness: 1.0 });

  // stelo leggermente curvo, ad alta risoluzione
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04, height * 0.4, 0.02),
    new THREE.Vector3(-0.02, height * 0.75, 0.06),
    new THREE.Vector3(0, height, 0.12),
  ]);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.025, 16), stemMat);
  stem.castShadow = true;
  flower.add(stem);

  // foglie con nervatura centrale e leggera curvatura
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.14, 0.04, 0.18, 0.2, 0.06, 0.3);
  leafShape.bezierCurveTo(0.03, 0.34, 0.01, 0.36, 0, 0.38);
  leafShape.bezierCurveTo(-0.01, 0.36, -0.03, 0.34, -0.06, 0.3);
  leafShape.bezierCurveTo(-0.18, 0.2, -0.14, 0.04, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 24);
  // incurva la foglia lungo la nervatura
  {
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, -(x * x) * 1.6 - y * y * 0.35);
    }
    leafGeo.computeVertexNormals();
  }
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const t = 0.2 + i * 0.17;
    const p = curve.getPoint(t);
    leaf.position.copy(p);
    leaf.rotation.set(Math.PI / 3 + (Math.random() - 0.5) * 0.3, (i * Math.PI * 2) / 4 + 0.7, 0);
    const s = 1.1 - i * 0.1;
    leaf.scale.set(s, s, s);
    leaf.castShadow = true;
    flower.add(leaf);
  }

  // corolla: testa orientata in avanti/alto
  const head = new THREE.Group();
  head.position.copy(curve.getPoint(1));
  head.rotation.x = Math.PI / 2.6;

  // disco centrale bombato
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.13, 48, 32), centerMat);
  center.scale.set(1, 1, 0.45);
  center.castShadow = true;
  head.add(center);

  // semi a spirale fillotattica (angolo aureo)
  const seedGeo = new THREE.SphereGeometry(0.008, 8, 6);
  const seedCount = 140;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const seeds = new THREE.InstancedMesh(seedGeo, seedMat, seedCount);
  const m = new THREE.Matrix4();
  for (let i = 0; i < seedCount; i++) {
    const r = 0.125 * Math.sqrt(i / seedCount);
    const a = i * golden;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    // segue la bombatura del disco
    const z = 0.058 * Math.sqrt(Math.max(0, 1 - (r / 0.13) ** 2)) + 0.004;
    m.makeTranslation(x, y, z);
    seeds.setMatrixAt(i, m);
  }
  head.add(seeds);

  // petalo sagomato a punta, con leggera piega longitudinale
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.045, 0.02, 0.055, 0.09, 0.035, 0.15);
  petalShape.bezierCurveTo(0.02, 0.19, 0.008, 0.215, 0, 0.23);
  petalShape.bezierCurveTo(-0.008, 0.215, -0.02, 0.19, -0.035, 0.15);
  petalShape.bezierCurveTo(-0.055, 0.09, -0.045, 0.02, 0, 0);
  const petalGeo = new THREE.ShapeGeometry(petalShape, 24);
  {
    const pos = petalGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, x * x * 3.5 + y * y * 0.5); // conca + punta rialzata
    }
    petalGeo.computeVertexNormals();
    petalGeo.translate(0, 0.115, 0);
  }

  // doppia corona di petali sfalsati
  for (const [count, radius, tilt, mat] of [
    [22, 0.115, -0.25, petalMat],
    [22, 0.1, -0.55, petalBackMat],
  ]) {
    for (let i = 0; i < count; i++) {
      const petal = new THREE.Mesh(petalGeo, mat);
      const a = (i / count) * Math.PI * 2 + (radius === 0.1 ? Math.PI / count : 0);
      petal.position.set(Math.cos(a + Math.PI / 2) * radius * 0.3, Math.sin(a + Math.PI / 2) * radius * 0.3, -0.01);
      petal.rotation.z = a;
      petal.rotation.x = tilt;
      petal.castShadow = true;
      head.add(petal);
    }
  }

  // brattee verdi dietro la corolla
  const bractGeo = new THREE.ShapeGeometry(petalShape, 12);
  bractGeo.translate(0, 0.1, 0);
  for (let i = 0; i < 14; i++) {
    const bract = new THREE.Mesh(bractGeo, leafMat);
    bract.rotation.z = (i / 14) * Math.PI * 2;
    bract.rotation.x = -0.85;
    bract.position.z = -0.03;
    bract.scale.set(1.3, 0.9, 1);
    head.add(bract);
  }

  flower.add(head);
  return flower;
}

export function createSunflowers() {
  const group = new THREE.Group();
  const positions = [
    [0, 0, 1.5, 0],
    [-0.45, 0.25, 1.15, 1.8],
    [0.4, 0.3, 1.3, 3.5],
    [0.15, -0.4, 1.0, 5.0],
    [-0.3, -0.3, 1.25, 0.9],
  ];
  for (const [x, z, h, rot] of positions) {
    const f = createSunflower(h);
    f.position.set(x, 0, z);
    f.rotation.y = rot;
    group.add(f);
  }

  // ciuffo di terra alla base
  const mound = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 48, 24),
    new THREE.MeshStandardMaterial({ color: 0x5a4428, roughness: 1.0 })
  );
  mound.scale.set(1, 0.12, 1);
  mound.receiveShadow = true;
  group.add(mound);

  group.name = 'girasoli';
  return group;
}
