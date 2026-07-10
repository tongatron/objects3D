import * as THREE from 'three';

// capsula orientata tra due punti (usata per busto, arti, dita)
function capsuleBetween(a, b, radius, material, capSegments = 8, radialSegments = 16) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const bodyLength = Math.max(length - radius * 2, 0.001);
  const geo = new THREE.CapsuleGeometry(radius, bodyLength, capSegments, radialSegments);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  const up = new THREE.Vector3(0, 1, 0);
  mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
  return mesh;
}

export function createCrucifix() {
  const root = new THREE.Group();
  root.name = 'crocifisso';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.85, metalness: 0.02 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xcf9f7a, roughness: 0.65, metalness: 0.0 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.7 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xe4dcc8, roughness: 0.95 });
  const bloodMat = new THREE.MeshStandardMaterial({ color: 0x5c0e10, roughness: 0.35, metalness: 0.05 });
  const nailMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.4, metalness: 0.8 });
  const thornMat = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.9 });
  const haloMat = new THREE.MeshStandardMaterial({ color: 0xd8b558, roughness: 0.35, metalness: 0.6, emissive: 0x3a2a08, emissiveIntensity: 0.4 });

  const add = (mesh) => { mesh.castShadow = true; root.add(mesh); return mesh; };

  // --- croce di legno ---
  const upright = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.2), woodMat));
  upright.position.y = 1.75;
  const crossbar = add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.2), woodMat));
  crossbar.position.y = 2.35;
  // titulus INRI
  const titulusMat = new THREE.MeshStandardMaterial({ color: 0xcabb8e, roughness: 0.8 });
  const titulus = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.03), titulusMat));
  titulus.position.set(0, 2.95, 0.12);
  titulus.rotation.x = -0.1;

  // --- corpo ---
  const hipL = new THREE.Vector3(-0.09, 0.98, 0.02);
  const hipR = new THREE.Vector3(0.09, 0.98, 0.02);
  const kneeL = new THREE.Vector3(-0.13, 0.55, 0.08);
  const kneeR = new THREE.Vector3(0.1, 0.58, 0.06);
  const ankleL = new THREE.Vector3(0.02, 0.14, 0.1);
  const ankleR = new THREE.Vector3(0.06, 0.16, 0.1);

  // gambe (leggermente flesse, incrociate alle caviglie)
  add(capsuleBetween(hipL, kneeL, 0.075, skinMat));
  add(capsuleBetween(kneeL, ankleL, 0.06, skinMat));
  add(capsuleBetween(hipR, kneeR, 0.075, skinMat));
  add(capsuleBetween(kneeR, ankleR, 0.06, skinMat));
  const kneeCapL = add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 18), skinMat));
  kneeCapL.position.copy(kneeL);
  const kneeCapR = add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 18), skinMat));
  kneeCapR.position.copy(kneeR);

  // piedi sovrapposti, trafitti da un unico chiodo
  const footL = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 8, 16), skinMat));
  footL.position.set(0.02, 0.09, 0.16);
  footL.rotation.set(Math.PI / 2 - 0.15, 0.1, 0);
  const footR = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 8, 16), skinMat));
  footR.position.set(0.06, 0.12, 0.14);
  footR.rotation.set(Math.PI / 2 - 0.1, -0.1, 0.15);
  const footNail = add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 10), nailMat));
  footNail.position.set(0.04, 0.1, 0.19);
  footNail.rotation.x = Math.PI / 2 - 0.1;

  // busto: leggera contrazione toracica da sforzo, capsule affiancate per costole percepite
  const torso = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.62, 12, 24), skinMat));
  torso.position.set(0, 1.36, 0.02);
  torso.scale.set(1.05, 1, 0.82);
  torso.rotation.x = -0.06;
  const chest = add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), skinMat));
  chest.position.set(0, 1.62, 0.04);
  chest.scale.set(1.05, 0.75, 0.78);
  const belly = add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), skinMat));
  belly.position.set(0, 1.12, -0.01);
  belly.scale.set(0.92, 0.85, 0.72);

  // bacino coperto dal perizoma
  const loin = add(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.32, 20, 1, true), clothMat));
  loin.position.set(0, 0.95, 0);
  loin.rotation.x = 0.05;
  const loinKnot = add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), clothMat));
  loinKnot.position.set(0.15, 1.02, 0.12);
  const loinDrape = add(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 12, 1, true), clothMat));
  loinDrape.position.set(0.13, 0.82, 0.13);
  loinDrape.rotation.z = 0.3;

  // ferita al costato
  const wound = add(new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), bloodMat));
  wound.position.set(0.19, 1.42, 0.06);
  wound.scale.set(1, 1.6, 0.6);
  const woundTrail = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.28, 6, 8), bloodMat));
  woundTrail.position.set(0.18, 1.2, 0.08);
  woundTrail.rotation.z = 0.15;

  // --- braccia distese lungo la traversa, capo chiodato ---
  const shoulderL = new THREE.Vector3(-0.19, 1.74, 0.0);
  const shoulderR = new THREE.Vector3(0.19, 1.74, 0.0);
  const elbowL = new THREE.Vector3(-0.55, 1.95, 0.02);
  const elbowR = new THREE.Vector3(0.55, 1.95, 0.02);
  const handL = new THREE.Vector3(-0.92, 2.32, 0.06);
  const handR = new THREE.Vector3(0.92, 2.32, 0.06);

  add(capsuleBetween(shoulderL, elbowL, 0.075, skinMat));
  add(capsuleBetween(elbowL, handL, 0.062, skinMat));
  add(capsuleBetween(shoulderR, elbowR, 0.075, skinMat));
  add(capsuleBetween(elbowR, handR, 0.062, skinMat));
  const shoulderCapL = add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), skinMat));
  shoulderCapL.position.copy(shoulderL);
  const shoulderCapR = add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), skinMat));
  shoulderCapR.position.copy(shoulderR);
  const elbowCapL = add(new THREE.Mesh(new THREE.SphereGeometry(0.068, 18, 14), skinMat));
  elbowCapL.position.copy(elbowL);
  const elbowCapR = add(new THREE.Mesh(new THREE.SphereGeometry(0.068, 18, 14), skinMat));
  elbowCapR.position.copy(elbowR);

  // mani aperte, dita ripiegate intorno al chiodo
  for (const [hand, side] of [[handL, -1], [handR, 1]]) {
    const palm = add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), skinMat));
    palm.position.copy(hand);
    palm.scale.set(1, 0.75, 0.5);
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const fingerBase = hand.clone().add(new THREE.Vector3(side * (0.04 + t * 0.03), -0.04 - t * 0.005, 0.05));
      const fingerTip = fingerBase.clone().add(new THREE.Vector3(side * 0.02, -0.09, 0.03));
      add(capsuleBetween(fingerBase, fingerTip, 0.016, skinMat, 6, 8));
    }
    const nail = add(new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.26, 10), nailMat));
    nail.position.copy(hand).add(new THREE.Vector3(0, 0, 0.02));
    nail.rotation.x = Math.PI / 2;
    const nailBlood = add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), bloodMat));
    nailBlood.position.copy(hand).add(new THREE.Vector3(0, -0.02, 0.04));
  }

  // --- collo e testa reclinata ---
  const neck = add(capsuleBetween(new THREE.Vector3(0, 1.78, 0), new THREE.Vector3(0.02, 1.9, 0.02), 0.075, skinMat));

  const head = new THREE.Group();
  head.position.set(0.03, 2.05, 0.03);
  head.rotation.set(0.55, 0.25, 0.35); // capo chino di lato, in segno di dolore/morte
  root.add(head);
  const headAdd = (mesh) => { mesh.castShadow = true; head.add(mesh); return mesh; };

  const skull = headAdd(new THREE.Mesh(new THREE.SphereGeometry(0.14, 28, 22), skinMat));
  skull.scale.set(0.88, 1.0, 0.95);
  const jaw = headAdd(new THREE.Mesh(new THREE.SphereGeometry(0.1, 22, 18), skinMat));
  jaw.position.set(0, -0.11, 0.03);
  jaw.scale.set(0.82, 0.65, 0.8);
  const nose = headAdd(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 12), skinMat));
  nose.position.set(0, -0.02, 0.135);
  nose.rotation.x = Math.PI / 2 + 0.3;

  // occhi socchiusi
  for (const s of [1, -1]) {
    const eyelid = headAdd(new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), skinMat));
    eyelid.position.set(s * 0.05, -0.02, 0.115);
    eyelid.scale.set(1, 0.5, 0.6);
  }

  // capelli lunghi e barba
  const hair = headAdd(new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), hairMat));
  hair.position.set(0, 0.02, -0.02);
  hair.scale.set(1.02, 1.05, 1.0);
  for (const s of [1, -1]) {
    const lock = headAdd(new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 8, 12), hairMat));
    lock.position.set(s * 0.13, -0.14, -0.03);
    lock.rotation.z = s * 0.15;
  }
  const beard = headAdd(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 16, 1, true), hairMat));
  beard.position.set(0, -0.18, 0.02);
  beard.rotation.x = Math.PI;
  const mustache = headAdd(new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.09, 6, 10), hairMat));
  mustache.position.set(0, -0.08, 0.13);
  mustache.rotation.z = Math.PI / 2;

  // corona di spine
  const crown = headAdd(new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.018, 10, 32), thornMat));
  crown.position.set(0, 0.03, 0);
  crown.rotation.x = Math.PI / 2;
  const thornCount = 14;
  for (let i = 0; i < thornCount; i++) {
    const a = (i / thornCount) * Math.PI * 2;
    const thorn = headAdd(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05, 6), thornMat));
    thorn.position.set(Math.cos(a) * 0.145, 0.03 + Math.sin(a) * 0.145 * 0.15, Math.sin(a) * 0.145);
    thorn.lookAt(thorn.position.clone().multiplyScalar(1.6).add(head.position));
    thorn.rotateX(Math.PI / 2);
  }
  // rivoli di sangue dalla fronte
  for (let i = 0; i < 3; i++) {
    const drip = headAdd(new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.05 + i * 0.01, 6, 8), bloodMat));
    drip.position.set(-0.06 + i * 0.06, -0.03, 0.12);
    drip.rotation.z = 0.1 * (i - 1);
  }

  // aureola dorata, sottile, dietro il capo
  const halo = add(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 10, 48), haloMat));
  halo.position.set(0.03, 2.1, -0.14);
  halo.rotation.x = Math.PI / 2 + 0.1;

  return root;
}
