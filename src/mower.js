import * as THREE from 'three';

// Mostro tagliaerba: un mostriciattolo ciclope, più grande e diverso dagli
// altri, che spinge un tagliaerba rosso. Dove passa rasa l'erba e falcia i
// fiori (rose, margherite); dopo qualche secondo l'erba ricresce e i fiori
// risbocciano di colpo. Può girare da solo oppure essere guidato con le
// frecce della tastiera (su/giù avanti-retro, sinistra/destra sterzo).

const FIELD_RADIUS = 8.5;
const BODY_RADIUS = 0.55;
const CUT_RADIUS = 0.55;
const CUT_AHEAD = 1.05; // distanza del tagliaerba davanti al mostro
const CLIP_COUNT = 70; // frammenti d'erba sparati di lato durante il taglio

function furMesh(bodyRadius, base) {
  const geo = new THREE.ConeGeometry(0.016, 0.16, 5, 1);
  geo.translate(0, 0.08, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const count = 600;
  const fur = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const normal = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // spirale di Fibonacci come i mostriciattoli piccoli, ma pelo più folto
    const t = (i + 0.5) / count;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    normal.setFromSphericalCoords(1, phi, theta);
    dummy.position.copy(normal).multiplyScalar(bodyRadius * 0.96);
    dummy.position.y *= 1.12; // segue il corpo leggermente ovale
    dummy.quaternion.setFromUnitVectors(up, normal);
    dummy.rotateX((Math.random() - 0.3) * 1.1);
    dummy.rotateZ((Math.random() - 0.5) * 1.1);
    const s = 0.6 + Math.random() * 0.9;
    dummy.scale.set(s, s * (0.8 + Math.random() * 0.6), s);
    dummy.updateMatrix();
    fur.setMatrixAt(i, dummy.matrix);
    color.copy(base).offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.15);
    fur.setColorAt(i, color);
  }
  fur.castShadow = true;
  return fur;
}

function buildMonster() {
  const base = new THREE.Color('#69c94f'); // verde erba, per mimetizzarsi male

  const root = new THREE.Group();

  // gruppo interno per bob/squash senza toccare la posizione
  const body = new THREE.Group();
  body.position.y = BODY_RADIUS + 0.1;
  root.add(body);

  const skinMat = new THREE.MeshStandardMaterial({ color: base.clone().offsetHSL(0, 0, -0.06), roughness: 0.9 });
  const blob = new THREE.Mesh(new THREE.SphereGeometry(BODY_RADIUS, 32, 24), skinMat);
  blob.scale.set(1, 1.12, 0.95);
  blob.castShadow = true;
  body.add(blob);
  body.add(furMesh(BODY_RADIUS, base));

  // occhio unico enorme da ciclope (il davanti è +Z)
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x14090c, roughness: 0.3 });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), eyeWhite);
  eye.position.set(0, 0.2, BODY_RADIUS * 0.78);
  body.add(eye);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), eyeDark);
  pupil.position.set(0, 0.2, BODY_RADIUS * 0.78 + 0.125);
  body.add(pupil);

  // bocca larga con dentone da castoro
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 8, 24, Math.PI), eyeDark);
  mouth.position.set(0, -0.08, BODY_RADIUS * 0.86);
  mouth.rotation.z = Math.PI;
  body.add(mouth);
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.02), eyeWhite);
  tooth.position.set(0, -0.13, BODY_RADIUS * 0.88);
  body.add(tooth);

  // corno unico centrale con pallina
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xf6c445, roughness: 0.6 });
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.22, 8), hornMat);
  horn.position.set(0, BODY_RADIUS * 1.12 + 0.08, 0);
  body.add(horn);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), hornMat);
  ball.position.set(0, BODY_RADIUS * 1.12 + 0.2, 0);
  body.add(ball);

  // braccia protese in avanti verso il manico del tagliaerba
  const armMat = skinMat;
  for (const s of [1, -1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.5, 10), armMat);
    arm.position.set(s * 0.32, 0.02, 0.35);
    arm.rotation.x = -1.15;
    arm.rotation.z = -s * 0.25;
    arm.castShadow = true;
    body.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), armMat);
    hand.position.set(s * 0.26, -0.18, 0.58);
    body.add(hand);
  }

  // piedoni che sgambettano
  const feet = [];
  const footMat = new THREE.MeshStandardMaterial({ color: base.clone().offsetHSL(0, 0, -0.18), roughness: 0.8 });
  for (const s of [1, -1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), footMat);
    foot.scale.set(0.9, 0.5, 1.5);
    foot.position.set(s * 0.24, -BODY_RADIUS - 0.05, 0.05);
    foot.castShadow = true;
    body.add(foot);
    feet.push(foot);
  }

  return { root, body, feet, pupil };
}

function buildMower() {
  const group = new THREE.Group();
  group.position.z = CUT_AHEAD;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xd43f2f, roughness: 0.45, metalness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2f, roughness: 0.6, metalness: 0.4 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x9aa2ab, roughness: 0.35, metalness: 0.7 });

  // scocca
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.72), redMat);
  deck.position.y = 0.18;
  deck.castShadow = true;
  group.add(deck);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.33, 0.08, 20), redMat);
  skirt.position.set(0, 0.1, 0.06);
  skirt.castShadow = true;
  group.add(skirt);

  // motore con cordicella d'avviamento
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.26), darkMat);
  engine.position.set(0, 0.32, 0.02);
  engine.castShadow = true;
  group.add(engine);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), steelMat);
  cap.position.set(0, 0.42, 0.02);
  group.add(cap);

  // lama che gira sotto la scocca
  const blade = new THREE.Group();
  blade.position.set(0, 0.05, 0.06);
  for (const a of [0, Math.PI / 2]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.05), steelMat);
    bar.rotation.y = a;
    blade.add(bar);
  }
  group.add(blade);

  // quattro ruote (asse lungo X, così ruotano attorno a X quando rotolano)
  const wheelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = [];
  for (const [x, z] of [[0.3, 0.28], [-0.3, 0.28], [0.3, -0.3], [-0.3, -0.3]]) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, 0.09, z);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  }

  // manico che torna indietro verso le mani del mostro
  for (const s of [1, -1]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 8), steelMat);
    tube.position.set(s * 0.2, 0.45, -0.62);
    tube.rotation.x = 0.75;
    group.add(tube);
  }
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.46, 8), darkMat);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0, 0.73, -0.9);
  group.add(grip);

  return { group, blade, wheels };
}

export function createMower(scene, fields) {
  const params = {
    attivo: true,
    guida: 'Automatica', // oppure 'Frecce' (tastiera)
    velocita: 1.95,
    ricrescita: 7.5, // secondi prima che erba e fiori ricrescano
  };

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const monster = buildMonster();
  const mower = buildMower();
  monster.root.add(mower.group);
  group.add(monster.root);

  // frammenti d'erba sparati di lato durante il taglio (in coordinate mondo)
  const clipGeo = new THREE.BoxGeometry(0.03, 0.008, 0.055);
  const clipMat = new THREE.MeshStandardMaterial({ color: 0x4d8a2a, roughness: 1 });
  const clips = new THREE.InstancedMesh(clipGeo, clipMat, CLIP_COUNT);
  clips.frustumCulled = false;
  group.add(clips);
  const clipData = [];
  for (let i = 0; i < CLIP_COUNT; i++) {
    clipData.push({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, spin: Math.random() * Math.PI * 2 });
  }
  let clipNext = 0;
  let clipAccum = 0;

  let heading = 0;
  let targetHeading = 0;
  const pos = new THREE.Vector2(3, 3);

  // tastiera: frecce per guidare (attive solo in modalità 'Frecce')
  const keys = { up: false, down: false, left: false, right: false };
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  function onKey(e, pressed) {
    const k = KEYMAP[e.key];
    if (!k) return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    keys[k] = pressed;
    if (params.attivo && params.guida === 'Frecce') e.preventDefault();
  }
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  const dummy = new THREE.Object3D();

  function spawnClip(cx, cz) {
    const c = clipData[clipNext];
    clipNext = (clipNext + 1) % CLIP_COUNT;
    c.pos.set(cx + (Math.random() - 0.5) * 0.4, 0.12, cz + (Math.random() - 0.5) * 0.4);
    // espulsi sul lato destro del tagliaerba, con un po' di caos
    const side = heading + Math.PI / 2;
    c.vel.set(
      Math.sin(side) * (0.8 + Math.random()) + (Math.random() - 0.5) * 0.6,
      1.2 + Math.random() * 1.4,
      Math.cos(side) * (0.8 + Math.random()) + (Math.random() - 0.5) * 0.6
    );
    c.life = 0.6 + Math.random() * 0.4;
    c.spin = Math.random() * Math.PI * 2;
  }

  function updateClips(dt) {
    for (let i = 0; i < CLIP_COUNT; i++) {
      const c = clipData[i];
      if (c.life > 0) {
        c.life -= dt;
        c.vel.y -= 6 * dt;
        c.pos.addScaledVector(c.vel, dt);
        if (c.pos.y < 0.01) c.pos.y = 0.01;
        dummy.position.copy(c.pos);
        dummy.rotation.set(c.spin, c.spin * 1.7, c.spin * 0.6);
        c.spin += dt * 6;
        dummy.scale.setScalar(Math.min(1, c.life * 4));
      } else {
        dummy.position.set(0, -10, 0);
        dummy.scale.setScalar(0.0001);
      }
      dummy.updateMatrix();
      clips.setMatrixAt(i, dummy.matrix);
    }
    clips.instanceMatrix.needsUpdate = true;
  }

  function update(time, dt) {
    group.visible = params.attivo;
    if (!params.attivo || dt <= 0) return;

    let speed;
    let turn = 0;
    if (params.guida === 'Frecce') {
      const steer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
      turn = steer * 2.4 * dt;
      heading += turn;
      speed = ((keys.up ? 1 : 0) - (keys.down ? 0.6 : 0)) * params.velocita;
    } else {
      // vagabondaggio automatico, sterzate dolci da vero tosaerba
      if (Math.random() < 0.35 * dt) {
        targetHeading = heading + (Math.random() - 0.5) * Math.PI * 1.4;
      }
      if (pos.length() > FIELD_RADIUS - 0.5) {
        targetHeading = Math.atan2(-pos.x, -pos.y);
      }
      let diff = targetHeading - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      turn = THREE.MathUtils.clamp(diff, -1.6 * dt, 1.6 * dt);
      heading += turn;
      speed = params.velocita;
    }

    pos.x += Math.sin(heading) * speed * dt;
    pos.y += Math.cos(heading) * speed * dt;
    if (pos.length() > FIELD_RADIUS) pos.setLength(FIELD_RADIUS); // recinto

    monster.root.position.set(pos.x, 0, pos.y);
    monster.root.rotation.y = heading;

    // andatura: passo pesante, spinge con impegno
    const gait = Math.abs(speed) > 0.05;
    const stride = time * (5 + Math.abs(speed) * 4);
    const hop = gait ? Math.abs(Math.sin(stride)) : 0;
    monster.body.position.y = BODY_RADIUS + 0.1 + hop * 0.05;
    const squash = 1 + Math.sin(stride * 2) * (gait ? 0.04 : 0.01);
    monster.body.scale.set(1 / squash, squash, 1 / squash);
    monster.body.rotation.x = 0.1 * Math.min(Math.abs(speed), 2);
    monster.feet[0].position.z = 0.05 + (gait ? Math.sin(stride) * 0.14 : 0);
    monster.feet[1].position.z = 0.05 - (gait ? Math.sin(stride) * 0.14 : 0);
    monster.pupil.position.y = 0.2 + Math.sin(time * 2.7) * 0.012;

    // il tagliaerba vibra col motore, la lama gira, le ruote rotolano
    mower.group.rotation.z = Math.sin(time * 43) * 0.008;
    mower.blade.rotation.y += 40 * dt;
    for (const wheel of mower.wheels) wheel.rotation.x += (speed / 0.09) * dt;

    // taglio: cerchio davanti al mostro, sotto la scocca
    const cx = pos.x + Math.sin(heading) * CUT_AHEAD;
    const cz = pos.y + Math.cos(heading) * CUT_AHEAD;
    let cutting = false;
    if (fields.grass.mesh.visible) {
      fields.grass.cutCircle(cx, cz, CUT_RADIUS, time);
      cutting = true;
    }
    if (fields.daisies.group.visible) {
      fields.daisies.cutCircle(cx, cz, CUT_RADIUS, time);
      cutting = true;
    }
    if (fields.roses.group.visible) {
      fields.roses.cutCircle(cx, cz, CUT_RADIUS, time);
      cutting = true;
    }

    // sputa frammenti d'erba solo quando avanza su qualcosa da tagliare
    if (cutting && Math.abs(speed) > 0.1) {
      clipAccum += dt * 30;
      while (clipAccum >= 1) {
        clipAccum -= 1;
        spawnClip(cx, cz);
      }
    }
    updateClips(dt);
  }

  return { group, params, update };
}
