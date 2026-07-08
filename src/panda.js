import * as THREE from 'three';

// Panda ad alta risoluzione costruito proceduralmente: corpo e testa bianchi,
// orecchie, occhiaie, zampe e spalle nere, geometrie a molti segmenti.
// Comportamento: sceglie una canna di bambù, ci cammina fino a raggiungerla
// con passo quadrupede (zampe alternate in diagonale, corpo che ondeggia),
// poi si siede sulle zampe posteriori e mangia — la zampa porta la canna
// alla bocca, la testa mastica e la canna si accorcia davvero. Quando la
// canna è quasi finita, o dopo un po', passa alla successiva.

const EAT_DISTANCE = 0.55;

function capsule(r, len, mat, radial = 24) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, radial), mat);
  mesh.castShadow = true;
  return mesh;
}

function buildPanda() {
  const white = new THREE.MeshStandardMaterial({ color: 0xf2ede4, roughness: 0.85 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1c1a19, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0d0c0b, roughness: 0.4 });

  const root = new THREE.Group();

  // il corpo è un gruppo interno così il beccheggio non tocca la posizione
  const body = new THREE.Group();
  body.position.y = 0.42;
  root.add(body);

  // torso bianco panciuto (il davanti è +Z)
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 32), white);
  torso.scale.set(0.85, 0.8, 1.15);
  torso.castShadow = true;
  body.add(torso);

  // fascia nera su spalle e petto
  const band = new THREE.Mesh(new THREE.SphereGeometry(0.285, 48, 32), black);
  band.scale.set(0.87, 0.78, 0.5);
  band.position.z = 0.16;
  band.castShadow = true;
  body.add(band);

  // testa
  const head = new THREE.Group();
  head.position.set(0, 0.28, 0.3);
  body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 48, 32), white);
  skull.scale.set(1, 0.92, 0.95);
  skull.castShadow = true;
  head.add(skull);
  // muso
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 24), white);
  muzzle.scale.set(1, 0.75, 1);
  muzzle.position.set(0, -0.05, 0.15);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 20, 14), dark);
  nose.scale.set(1.2, 0.8, 0.9);
  nose.position.set(0, -0.03, 0.225);
  head.add(nose);
  // mandibola (mastica)
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 28, 20), white);
  jaw.scale.set(0.9, 0.5, 1);
  jaw.position.set(0, -0.1, 0.13);
  head.add(jaw);
  // occhiaie nere inclinate
  for (const s of [1, -1]) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.055, 28, 20), black);
    patch.scale.set(0.85, 1.25, 0.45);
    patch.position.set(s * 0.075, 0.03, 0.15);
    patch.rotation.z = -s * 0.5;
    head.add(patch);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), dark);
    eye.position.set(s * 0.07, 0.035, 0.185);
    head.add(eye);
    // orecchie tonde
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.062, 28, 20), black);
    ear.scale.set(1, 1, 0.55);
    ear.position.set(s * 0.135, 0.155, -0.02);
    ear.castShadow = true;
    head.add(ear);
  }

  // codina
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), black);
  tail.position.set(0, -0.05, -0.33);
  body.add(tail);

  // zampe: gruppi ancorati all'anca/spalla per farle oscillare
  function makeLeg(x, z, front) {
    const hip = new THREE.Group();
    hip.position.set(x, -0.12, z);
    body.add(hip);
    const leg = capsule(front ? 0.062 : 0.075, front ? 0.2 : 0.22, black);
    leg.position.y = -0.14;
    hip.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(front ? 0.07 : 0.082, 24, 16), black);
    paw.scale.set(1, 0.6, 1.25);
    paw.position.y = -0.28;
    paw.castShadow = true;
    hip.add(paw);
    return hip;
  }
  const legs = {
    fl: makeLeg(-0.16, 0.2, true),
    fr: makeLeg(0.16, 0.2, true),
    bl: makeLeg(-0.17, -0.2, false),
    br: makeLeg(0.17, -0.2, false),
  };

  // canna di bambù in mano (visibile solo mentre mangia)
  const caneInPaw = new THREE.Group();
  const caneMat = new THREE.MeshStandardMaterial({ color: 0x7a9a3e, roughness: 0.6 });
  const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.5, 12), caneMat);
  caneInPaw.add(cane);
  for (let i = -1; i <= 1; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.005, 6, 12), caneMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = i * 0.16;
    caneInPaw.add(ring);
  }
  caneInPaw.visible = false;
  legs.fr.add(caneInPaw);
  caneInPaw.position.set(0.02, -0.3, 0.1);

  return { root, body, head, jaw, legs, caneInPaw };
}

export function createPanda(bamboo) {
  const params = { attivo: true, velocita: 0.6 };

  const p = buildPanda();
  const group = p.root;
  group.name = 'panda';

  // stato
  let mode = 'roam'; // 'roam' | 'eat'
  let target = -1;
  let eatTimer = 0;
  let heading = Math.random() * Math.PI * 2;
  const pos = new THREE.Vector2((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
  let sitBlend = 0; // 0 = in piedi, 1 = seduto

  function pickTarget() {
    const n = bamboo.caneCount();
    if (!n) { target = -1; return; }
    // preferisce una canna poco mangiata e non troppo lontana
    let best = -1;
    let bestScore = Infinity;
    for (let tries = 0; tries < 12; tries++) {
      const i = Math.floor(Math.random() * n);
      const c = bamboo.getCane(i);
      if (!c || c.eaten > 0.5) continue;
      const d = Math.hypot(c.x - pos.x, c.z - pos.y);
      const score = d + c.eaten * 6;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    target = best;
  }

  function update(time, dt) {
    group.visible = params.attivo;
    if (!params.attivo || dt <= 0) return;
    if (target < 0 || !bamboo.getCane(target)) pickTarget();
    if (target < 0) return;

    const c = bamboo.getCane(target);
    const dx = c.x - pos.x;
    const dz = c.z - pos.y;
    const dist = Math.hypot(dx, dz);

    if (mode === 'roam') {
      // sterzata smorzata verso la canna
      const want = Math.atan2(dx, dz);
      let diff = Math.atan2(Math.sin(want - heading), Math.cos(want - heading));
      heading += THREE.MathUtils.clamp(diff, -1.8 * dt, 1.8 * dt);

      const speed = params.velocita;
      pos.x += Math.sin(heading) * speed * dt;
      pos.y += Math.cos(heading) * speed * dt;

      if (dist < EAT_DISTANCE) {
        mode = 'eat';
        eatTimer = 6 + Math.random() * 6;
      }
    } else {
      // mangia: la canna si accorcia davvero
      bamboo.bite(target, dt);
      eatTimer -= dt;
      const cNow = bamboo.getCane(target);
      if (eatTimer <= 0 || !cNow || cNow.eaten > 0.85) {
        mode = 'roam';
        pickTarget();
      }
    }

    group.position.set(pos.x, 0, pos.y);
    group.rotation.y = heading;

    // --- animazione ---
    const sitting = mode === 'eat' ? 1 : 0;
    sitBlend += (sitting - sitBlend) * Math.min(1, dt * 3);

    const speed = params.velocita;
    const stride = time * (4 + speed * 4);
    const walk = 1 - sitBlend;

    // corpo: ondeggia in camminata, si alza e arretra da seduto
    p.body.position.y = 0.42 + Math.abs(Math.sin(stride)) * 0.02 * walk + sitBlend * 0.05;
    p.body.rotation.x = -sitBlend * 0.75 + Math.sin(stride * 2) * 0.015 * walk;
    p.body.rotation.z = Math.sin(stride) * 0.04 * walk;

    // zampe: coppie diagonali in camminata; da seduto le posteriori si piegano
    const sw = Math.sin(stride) * 0.55 * walk;
    p.legs.fl.rotation.x = sw + sitBlend * 0.5;
    p.legs.br.rotation.x = sw * 0.9 - sitBlend * 1.5;
    p.legs.fr.rotation.x = -sw + sitBlend * 0.5;
    p.legs.bl.rotation.x = -sw * 0.9 - sitBlend * 1.5;

    if (sitBlend > 0.3) {
      // zampa destra porta la canna alla bocca, con piccoli su-e-giù
      const munch = Math.sin(time * 6);
      p.legs.fr.rotation.x = -1.9 + munch * 0.08;
      p.legs.fr.rotation.z = -0.25;
      p.caneInPaw.visible = true;
      // testa china sulla canna e mastica
      p.head.rotation.x = 0.35 + munch * 0.06;
      p.jaw.position.y = -0.1 - Math.max(0, munch) * 0.02;
      p.jaw.rotation.x = Math.max(0, munch) * 0.25;
    } else {
      p.legs.fr.rotation.z = 0;
      p.caneInPaw.visible = false;
      // testa che guarda avanti con piccole occhiate in giro
      p.head.rotation.x = Math.sin(stride * 2) * 0.02 * walk;
      p.jaw.position.y = -0.1;
      p.jaw.rotation.x = 0;
    }
    p.head.rotation.y = Math.sin(time * 0.7) * 0.15 * walk;
  }

  return { group, params, update };
}
