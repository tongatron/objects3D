import * as THREE from 'three';

// Mostriciattolo peloso che corre nel campo: blob fucsia con ~450 ciuffi di
// pelo istanziati, occhioni, cornette e piedoni. Vaga cambiando direzione a
// intervalli casuali (frequenza regolabile), si inclina in curva e saltella
// con squash & stretch proporzionale alla velocità.

const FIELD_RADIUS = 9;
const BODY_RADIUS = 0.3;

function furMesh(bodyRadius, count, baseColor) {
  const geo = new THREE.ConeGeometry(0.012, 0.09, 5, 1);
  geo.translate(0, 0.045, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const fur = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const normal = new THREE.Vector3();
  const color = new THREE.Color();
  const base = new THREE.Color(baseColor);
  for (let i = 0; i < count; i++) {
    // distribuzione quasi uniforme sulla sfera (spirale di Fibonacci)
    const t = (i + 0.5) / count;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    normal.setFromSphericalCoords(1, phi, theta);
    dummy.position.copy(normal).multiplyScalar(bodyRadius * 0.96);
    // orientato in fuori, spettinato a caso e "pettinato" un po' in giù
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    dummy.rotateX((Math.random() - 0.3) * 0.7);
    dummy.rotateZ((Math.random() - 0.5) * 0.7);
    const s = 0.7 + Math.random() * 0.8;
    dummy.scale.set(s, s * (0.8 + Math.random() * 0.6), s);
    dummy.updateMatrix();
    fur.setMatrixAt(i, dummy.matrix);
    color.copy(base).offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.15);
    fur.setColorAt(i, color);
  }
  fur.castShadow = true;
  return fur;
}

export function createMonster(scene) {
  const params = {
    attivo: true,
    velocita: 1.2,
    cambiDirezione: 0.7, // cambi medi al secondo
  };

  const monster = new THREE.Group();
  monster.visible = false;
  scene.add(monster);

  // gruppo interno per bob/squash senza toccare la posizione
  const body = new THREE.Group();
  body.position.y = BODY_RADIUS + 0.08;
  monster.add(body);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc2187a, roughness: 0.9 });
  const blob = new THREE.Mesh(new THREE.SphereGeometry(BODY_RADIUS, 32, 24), skinMat);
  blob.castShadow = true;
  body.add(blob);
  body.add(furMesh(BODY_RADIUS, 450, 0xd6218c));

  // occhioni sbarrati (il davanti è +Z)
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x14090c, roughness: 0.3 });
  const pupils = [];
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), eyeWhite);
    eye.position.set(s * 0.11, 0.09, BODY_RADIUS * 0.82);
    body.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), eyeDark);
    pupil.position.set(s * 0.11, 0.09, BODY_RADIUS * 0.82 + 0.062);
    body.add(pupil);
    pupils.push(pupil);
  }

  // bocca larga divertita
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.018, 8, 24, Math.PI),
    eyeDark
  );
  mouth.position.set(0, -0.05, BODY_RADIUS * 0.9);
  mouth.rotation.z = Math.PI;
  body.add(mouth);

  // cornette con pallina
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xf6c445, roughness: 0.6 });
  for (const s of [1, -1]) {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.14, 8), hornMat);
    horn.position.set(s * 0.13, BODY_RADIUS + 0.05, 0);
    horn.rotation.z = -s * 0.35;
    body.add(horn);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), hornMat);
    ball.position.set(s * 0.16, BODY_RADIUS + 0.13, 0);
    body.add(ball);
  }

  // piedoni che sgambettano
  const feet = [];
  const footMat = new THREE.MeshStandardMaterial({ color: 0x8e1157, roughness: 0.8 });
  for (const s of [1, -1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), footMat);
    foot.scale.set(0.9, 0.55, 1.4);
    foot.position.set(s * 0.14, -BODY_RADIUS - 0.02, 0.04);
    foot.castShadow = true;
    body.add(foot);
    feet.push(foot);
  }

  // stato di corsa
  let heading = Math.random() * Math.PI * 2;
  let targetHeading = heading;
  const pos = new THREE.Vector2(
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 6
  );

  function update(time, dt) {
    monster.visible = params.attivo;
    if (!params.attivo || dt <= 0) return;

    // cambio di direzione casuale
    if (Math.random() < params.cambiDirezione * dt) {
      targetHeading = heading + (Math.random() - 0.5) * Math.PI * 1.6;
    }
    // confini morbidi: torna verso il centro
    if (pos.length() > FIELD_RADIUS) {
      targetHeading = Math.atan2(-pos.x, -pos.y);
    }

    // sterzata smorzata verso la direzione target
    let diff = targetHeading - heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const turn = THREE.MathUtils.clamp(diff, -2.8 * dt, 2.8 * dt);
    heading += turn;

    const speed = params.velocita;
    pos.x += Math.sin(heading) * speed * dt;
    pos.y += Math.cos(heading) * speed * dt;

    monster.position.set(pos.x, 0, pos.y);
    monster.rotation.y = heading;

    // andatura: saltelli e squash & stretch a ritmo con la velocità
    const stride = time * (6 + speed * 5);
    const hop = Math.abs(Math.sin(stride));
    body.position.y = BODY_RADIUS + 0.08 + hop * 0.06 * Math.min(speed, 2.5);
    const squash = 1 + Math.sin(stride * 2) * 0.05;
    body.scale.set(1 / squash, squash, 1 / squash);

    // inclinazione: avanti con la velocità, di lato in curva
    body.rotation.x = 0.12 * Math.min(speed, 2.5);
    body.rotation.z = -turn / Math.max(dt, 1e-4) * 0.06;

    // piedoni alternati
    feet[0].position.z = 0.04 + Math.sin(stride) * 0.11;
    feet[1].position.z = 0.04 - Math.sin(stride) * 0.11;

    // pupille vive
    for (const p of pupils) {
      p.position.y = 0.09 + Math.sin(time * 3.1) * 0.012;
    }
  }

  return { group: monster, params, update };
}
