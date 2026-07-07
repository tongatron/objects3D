import * as THREE from 'three';

export function createTeddy() {
  const bear = new THREE.Group();

  const furMat = new THREE.MeshStandardMaterial({ color: 0xa9743f, roughness: 1.0 });
  const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xd9b98a, roughness: 1.0 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.4 });

  const add = (mesh) => { mesh.castShadow = true; bear.add(mesh); return mesh; };

  // corpo seduto
  const body = add(new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 18), furMat));
  body.position.y = 0.62;
  body.scale.set(1, 1.15, 0.9);

  // pancia chiara
  const belly = add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14), muzzleMat));
  belly.position.set(0, 0.62, 0.24);
  belly.scale.set(0.85, 1.0, 0.7);

  // testa
  const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 18), furMat));
  head.position.y = 1.55;

  // muso
  const muzzle = add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), muzzleMat));
  muzzle.position.set(0, 1.44, 0.38);
  muzzle.scale.set(1.1, 0.8, 0.9);

  // naso
  const nose = add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), darkMat));
  nose.position.set(0, 1.5, 0.57);
  nose.scale.set(1.3, 0.8, 0.8);

  // occhi
  for (const s of [1, -1]) {
    const eye = add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), darkMat));
    eye.position.set(s * 0.17, 1.66, 0.4);
  }

  // orecchie
  for (const s of [1, -1]) {
    const ear = add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), furMat));
    ear.position.set(s * 0.34, 1.94, 0);
    ear.scale.set(1, 1, 0.55);
    const inner = add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), muzzleMat));
    inner.position.set(s * 0.33, 1.93, 0.07);
    inner.scale.set(1, 1, 0.4);
  }

  // braccia aperte
  for (const s of [1, -1]) {
    const arm = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.42, 8, 12), furMat));
    arm.position.set(s * 0.62, 0.95, 0.1);
    arm.rotation.z = s * 1.15;
    arm.rotation.x = -0.25;
    const paw = add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), muzzleMat));
    paw.position.set(s * 0.92, 1.12, 0.2);
  }

  // gambe distese in avanti (seduto)
  for (const s of [1, -1]) {
    const leg = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.4, 8, 12), furMat));
    leg.position.set(s * 0.32, 0.22, 0.45);
    leg.rotation.x = Math.PI / 2.15;
    const foot = add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), muzzleMat));
    foot.position.set(s * 0.32, 0.24, 0.78);
    foot.scale.set(1, 1, 0.7);
  }

  // cuciture: filo sulla testa
  const stitchMat = new THREE.MeshStandardMaterial({ color: 0x7a4f28, roughness: 1 });
  const stitch = add(new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.012, 6, 40, Math.PI * 0.7), stitchMat));
  stitch.position.y = 1.55;
  stitch.rotation.y = Math.PI / 2;
  stitch.rotation.z = Math.PI * 0.15;

  bear.name = 'orsetto';
  return bear;
}
