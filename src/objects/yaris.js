import * as THREE from 'three';

// Yaris ibrida stilizzata (hatchback compatta, bi-tone con tetto nero).
export function createYaris() {
  const car = new THREE.Group();

  const paintMat = new THREE.MeshStandardMaterial({ color: 0xb51f2e, roughness: 0.35, metalness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4, metalness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1b2733, roughness: 0.05, metalness: 0.9 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x999da3, roughness: 0.25, metalness: 0.9 });

  const width = 1.6;

  // profilo laterale della carrozzeria (hatchback: frontale corto, coda tronca)
  const body = new THREE.Shape();
  body.moveTo(-1.85, 0.3);                                  // paraurti posteriore basso
  body.lineTo(-1.85, 0.75);                                 // coda tronca
  body.quadraticCurveTo(-1.8, 0.95, -1.55, 1.02);           // portellone inclinato
  body.quadraticCurveTo(-1.0, 1.28, -0.55, 1.32);           // tetto posteriore
  body.quadraticCurveTo(0.15, 1.32, 0.55, 1.05);            // parabrezza molto inclinato
  body.quadraticCurveTo(1.15, 0.82, 1.65, 0.72);            // cofano corto
  body.quadraticCurveTo(1.95, 0.62, 1.95, 0.45);            // muso
  body.lineTo(1.95, 0.3);                                   // paraurti anteriore
  body.lineTo(-1.85, 0.3);

  const bodyGeo = new THREE.ExtrudeGeometry(body, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 4,
  });
  bodyGeo.translate(0, 0, -width / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, paintMat);
  bodyMesh.castShadow = true;
  car.add(bodyMesh);

  // fascia sottoporta / paraurti
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.18, width + 0.16), trimMat);
  skirt.position.y = 0.28;
  skirt.position.x = 0.05;
  skirt.castShadow = true;
  car.add(skirt);

  // tetto nero (bi-tone)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, width - 0.15), roofMat);
  roof.position.set(-0.35, 1.34, 0);
  roof.castShadow = true;
  car.add(roof);

  // vetratura: fascia che avvolge l'abitacolo
  const glassShape = new THREE.Shape();
  glassShape.moveTo(-1.45, 0.95);
  glassShape.quadraticCurveTo(-1.0, 1.22, -0.55, 1.26);
  glassShape.quadraticCurveTo(0.1, 1.26, 0.5, 1.0);
  glassShape.lineTo(0.25, 0.92);
  glassShape.lineTo(-1.3, 0.9);
  glassShape.lineTo(-1.45, 0.95);
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, { depth: width + 0.02, bevelEnabled: false });
  glassGeo.translate(0, 0.02, -(width + 0.02) / 2);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  car.add(glass);

  // ruote
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 24);
  wheelGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.26, 5);
  rimGeo.rotateX(Math.PI / 2);
  for (const [x, z] of [[1.25, width / 2], [1.25, -width / 2], [-1.2, width / 2], [-1.2, -width / 2]]) {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(x, 0.34, z);
    wheel.castShadow = true;
    car.add(wheel);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.copy(wheel.position);
    car.add(rim);
  }

  // fari anteriori affusolati
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xd8e6ee, roughness: 0.1, metalness: 0.4,
    emissive: 0x8899aa, emissiveIntensity: 0.25,
  });
  const headGeo = new THREE.SphereGeometry(0.12, 12, 8);
  headGeo.scale(1.6, 0.7, 1);
  for (const s of [1, -1]) {
    const head = new THREE.Mesh(headGeo, lightMat);
    head.position.set(1.85, 0.62, s * (width / 2 - 0.18));
    head.rotation.y = s * 0.5;
    car.add(head);
  }

  // fanali posteriori
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x7a0f14, roughness: 0.2, emissive: 0x550a0c, emissiveIntensity: 0.4 });
  const tailGeo = new THREE.BoxGeometry(0.06, 0.14, 0.3);
  for (const s of [1, -1]) {
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(-1.93, 0.82, s * (width / 2 - 0.12));
    car.add(tail);
  }

  // griglia anteriore a nido d'ape (semplificata)
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, width - 0.5), trimMat);
  grille.position.set(1.98, 0.45, 0);
  car.add(grille);

  // badge "hybrid" laterale
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0x2266cc, roughness: 0.3, metalness: 0.7, emissive: 0x113366, emissiveIntensity: 0.3 });
  for (const s of [1, -1]) {
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.02), badgeMat);
    badge.position.set(-1.55, 0.85, s * (width / 2 + 0.11));
    car.add(badge);
  }

  // specchietti
  const mirrorGeo = new THREE.BoxGeometry(0.1, 0.08, 0.16);
  for (const s of [1, -1]) {
    const mirror = new THREE.Mesh(mirrorGeo, roofMat);
    mirror.position.set(0.45, 1.0, s * (width / 2 + 0.14));
    mirror.castShadow = true;
    car.add(mirror);
  }

  car.name = 'yaris';
  return car;
}
