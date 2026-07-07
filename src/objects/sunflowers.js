import * as THREE from 'three';

function createSunflower(height) {
  const flower = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f6b1e, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4a7a24, roughness: 0.85, side: THREE.DoubleSide });
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.7, side: THREE.DoubleSide });
  const centerMat = new THREE.MeshStandardMaterial({ color: 0x4a2c0f, roughness: 1.0 });

  // stelo leggermente curvo
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04, height * 0.4, 0.02),
    new THREE.Vector3(-0.02, height * 0.75, 0.06),
    new THREE.Vector3(0, height, 0.12),
  ]);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.025, 8), stemMat);
  stem.castShadow = true;
  flower.add(stem);

  // foglie
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.12, 0.05, 0.16, 0.2, 0, 0.32);
  leafShape.bezierCurveTo(-0.16, 0.2, -0.12, 0.05, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 8);
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const t = 0.25 + i * 0.2;
    const p = curve.getPoint(t);
    leaf.position.copy(p);
    leaf.rotation.set(Math.PI / 3, (i * Math.PI * 2) / 3, 0);
    leaf.castShadow = true;
    flower.add(leaf);
  }

  // corolla: testa orientata in avanti/alto
  const head = new THREE.Group();
  const top = curve.getPoint(1);
  head.position.copy(top);
  head.rotation.x = Math.PI / 2.6;

  const center = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 12), centerMat);
  center.scale.set(1, 1, 0.45);
  center.castShadow = true;
  head.add(center);

  const petalGeo = new THREE.CircleGeometry(0.09, 8);
  petalGeo.scale(0.5, 1, 1);
  petalGeo.translate(0, 0.17, 0);
  const petalCount = 18;
  for (let i = 0; i < petalCount; i++) {
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.rotation.z = (i / petalCount) * Math.PI * 2;
    petal.rotation.x = -0.15;
    petal.castShadow = true;
    head.add(petal);
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
    new THREE.SphereGeometry(0.8, 24, 12),
    new THREE.MeshStandardMaterial({ color: 0x5a4428, roughness: 1.0 })
  );
  mound.scale.set(1, 0.12, 1);
  mound.receiveShadow = true;
  group.add(mound);

  group.name = 'girasoli';
  return group;
}
