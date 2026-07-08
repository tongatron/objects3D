import * as THREE from 'three';

// Mostriciattoli pelosi che corrono nel campo: blob con ciuffi di pelo
// istanziati, occhioni, cornette e piedoni. Se ne possono aggiungere più
// d'uno, ciascuno con colore e fattura del pelo diversi. Ognuno vaga per
// conto suo cambiando direzione a intervalli casuali (frequenza regolabile),
// si inclina in curva e saltella con squash & stretch.

const FIELD_RADIUS = 9;
const BODY_RADIUS = 0.3;
const MAX_MONSTERS = 8;

// fatture del pelo: densità, lunghezza, spessore e "spettinatura" dei ciuffi
export const MONSTER_STYLES = {
  'Peloso': { count: 450, len: 0.09, width: 0.012, mess: 0.7, scaleVar: 0.8 },
  'Ispido': { count: 700, len: 0.13, width: 0.007, mess: 1.6, scaleVar: 1.1 },
  'Riccio': { count: 900, len: 0.05, width: 0.016, mess: 2.6, scaleVar: 0.5 },
  'Raso':   { count: 1400, len: 0.028, width: 0.006, mess: 0.3, scaleVar: 0.4 },
};

function furMesh(bodyRadius, baseColor, style) {
  const geo = new THREE.ConeGeometry(style.width, style.len, 5, 1);
  geo.translate(0, style.len / 2, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const fur = new THREE.InstancedMesh(geo, mat, style.count);
  const dummy = new THREE.Object3D();
  const normal = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  const base = new THREE.Color(baseColor);
  for (let i = 0; i < style.count; i++) {
    // distribuzione quasi uniforme sulla sfera (spirale di Fibonacci)
    const t = (i + 0.5) / style.count;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    normal.setFromSphericalCoords(1, phi, theta);
    dummy.position.copy(normal).multiplyScalar(bodyRadius * 0.96);
    // orientato in fuori, spettinato a caso e "pettinato" un po' in giù
    dummy.quaternion.setFromUnitVectors(up, normal);
    dummy.rotateX((Math.random() - 0.3) * style.mess);
    dummy.rotateZ((Math.random() - 0.5) * style.mess);
    const s = 1 - style.scaleVar / 2 + Math.random() * style.scaleVar;
    dummy.scale.set(s, s * (0.8 + Math.random() * 0.6), s);
    dummy.updateMatrix();
    fur.setMatrixAt(i, dummy.matrix);
    color.copy(base).offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.15);
    fur.setColorAt(i, color);
  }
  fur.castShadow = true;
  return fur;
}

function buildMonster(colore, stile) {
  const style = MONSTER_STYLES[stile] || MONSTER_STYLES['Peloso'];
  const base = new THREE.Color(colore);

  const root = new THREE.Group();

  // gruppo interno per bob/squash senza toccare la posizione
  const body = new THREE.Group();
  body.position.y = BODY_RADIUS + 0.08;
  root.add(body);

  const skin = base.clone().offsetHSL(0, 0, -0.06);
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.9 });
  const blob = new THREE.Mesh(new THREE.SphereGeometry(BODY_RADIUS, 32, 24), skinMat);
  blob.castShadow = true;
  body.add(blob);
  body.add(furMesh(BODY_RADIUS, base, style));

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
  const footColor = base.clone().offsetHSL(0, 0, -0.18);
  const footMat = new THREE.MeshStandardMaterial({ color: footColor, roughness: 0.8 });
  for (const s of [1, -1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), footMat);
    foot.scale.set(0.9, 0.55, 1.4);
    foot.position.set(s * 0.14, -BODY_RADIUS - 0.02, 0.04);
    foot.castShadow = true;
    body.add(foot);
    feet.push(foot);
  }

  const heading = Math.random() * Math.PI * 2;
  return {
    root, body, feet, pupils,
    colore: '#' + base.getHexString(),
    stile: MONSTER_STYLES[stile] ? stile : 'Peloso',
    heading,
    targetHeading: heading,
    phase: Math.random() * Math.PI * 2, // sfasa il saltello tra i mostri
    pos: new THREE.Vector2((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
  };
}

function disposeMonster(m) {
  m.root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
}

export function createMonsters(scene) {
  const params = {
    attivo: true,
    velocita: 1.2,
    cambiDirezione: 0.7, // cambi medi al secondo
  };

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const list = [];

  function add(colore = '#c2187a', stile = 'Peloso') {
    if (list.length >= MAX_MONSTERS) return null;
    const m = buildMonster(colore, stile);
    list.push(m);
    group.add(m.root);
    return m;
  }

  function removeLast() {
    if (list.length <= 1) return; // ne resta sempre almeno uno
    const m = list.pop();
    group.remove(m.root);
    disposeMonster(m);
  }

  function clear() {
    while (list.length) {
      const m = list.pop();
      group.remove(m.root);
      disposeMonster(m);
    }
  }

  // serializzazione compatta per il link: "rrggbb:stile|rrggbb:stile"
  function serialize() {
    return list.map((m) => `${m.colore.slice(1)}:${m.stile}`).join('|');
  }

  function deserialize(str) {
    if (typeof str !== 'string' || !str) return;
    const parsed = [];
    for (const part of str.split('|')) {
      const [hex, stile] = part.split(':');
      if (!/^[0-9a-f]{6}$/i.test(hex || '')) continue;
      parsed.push(['#' + hex, MONSTER_STYLES[stile] ? stile : 'Peloso']);
    }
    if (!parsed.length) return;
    clear();
    for (const [colore, stile] of parsed.slice(0, MAX_MONSTERS)) add(colore, stile);
  }

  function update(time, dt) {
    group.visible = params.attivo;
    if (!params.attivo || dt <= 0) return;

    for (const m of list) {
      // cambio di direzione casuale
      if (Math.random() < params.cambiDirezione * dt) {
        m.targetHeading = m.heading + (Math.random() - 0.5) * Math.PI * 1.6;
      }
      // confini morbidi: torna verso il centro
      if (m.pos.length() > FIELD_RADIUS) {
        m.targetHeading = Math.atan2(-m.pos.x, -m.pos.y);
      }

      // sterzata smorzata verso la direzione target
      let diff = m.targetHeading - m.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const turn = THREE.MathUtils.clamp(diff, -2.8 * dt, 2.8 * dt);
      m.heading += turn;

      const speed = params.velocita;
      m.pos.x += Math.sin(m.heading) * speed * dt;
      m.pos.y += Math.cos(m.heading) * speed * dt;

      m.root.position.set(m.pos.x, 0, m.pos.y);
      m.root.rotation.y = m.heading;

      // andatura: saltelli e squash & stretch a ritmo con la velocità
      const stride = time * (6 + speed * 5) + m.phase;
      const hop = Math.abs(Math.sin(stride));
      m.body.position.y = BODY_RADIUS + 0.08 + hop * 0.06 * Math.min(speed, 2.5);
      const squash = 1 + Math.sin(stride * 2) * 0.05;
      m.body.scale.set(1 / squash, squash, 1 / squash);

      // inclinazione: avanti con la velocità, di lato in curva
      m.body.rotation.x = 0.12 * Math.min(speed, 2.5);
      m.body.rotation.z = -turn / Math.max(dt, 1e-4) * 0.06;

      // piedoni alternati
      m.feet[0].position.z = 0.04 + Math.sin(stride) * 0.11;
      m.feet[1].position.z = 0.04 - Math.sin(stride) * 0.11;

      // pupille vive
      for (const p of m.pupils) {
        p.position.y = 0.09 + Math.sin(time * 3.1 + m.phase) * 0.012;
      }
    }
  }

  // il primo mostriciattolo, come prima: fucsia e peloso
  add('#d6218c', 'Peloso');

  return { group, params, list, add, removeLast, serialize, deserialize, update };
}
