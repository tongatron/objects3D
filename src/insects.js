import * as THREE from 'three';

// Sciame di falene attratte dalle luci artificiali accese (fototassi).
// Ogni falena: seek verso il punto più vicino della sorgente + componente
// tangenziale (orbita a spirale) + jitter. Sotto la distanza di collisione
// rimbalza, resta stordita e cade per un attimo, poi riprende a volare.

const UP = new THREE.Vector3(0, 1, 0);
const BOUNDS_RADIUS = 11;
const MIN_Y = 0.25;
const MAX_Y = 5.5;

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _seg = new THREE.Vector3();

function closestPointOnSegment(p, a, b, out) {
  _seg.subVectors(b, a);
  const t = THREE.MathUtils.clamp(_v3.subVectors(p, a).dot(_seg) / _seg.lengthSq(), 0, 1);
  return out.copy(a).addScaledVector(_seg, t);
}

function makeMoth() {
  const moth = new THREE.Group();
  const shade = 0.75 + Math.random() * 0.4;
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.35 * shade, 0.28 * shade, 0.2 * shade),
    roughness: 1.0,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.55 * shade, 0.48 * shade, 0.38 * shade),
    roughness: 1.0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  // corpo allungato lungo +Z (direzione di volo)
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), bodyMat);
  body.rotation.x = Math.PI / 2;
  moth.add(body);

  // ali a goccia, incernierate alla radice, sbattono attorno all'asse di volo
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.02);
  wingShape.bezierCurveTo(0.045, 0.035, 0.075, 0.015, 0.07, -0.01);
  wingShape.bezierCurveTo(0.06, -0.03, 0.02, -0.025, 0, -0.02);
  const wingGeo = new THREE.ShapeGeometry(wingShape, 8);
  wingGeo.rotateX(-Math.PI / 2); // stesa in orizzontale, apertura lungo ±X

  const wings = [];
  for (const s of [1, -1]) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.scale.x = s;
    moth.add(wing);
    wings.push(wing);
  }
  moth.userData.wings = wings;
  return moth;
}

export function createInsects(scene) {
  const params = {
    attivi: true,
    numero: 14,
    velocita: 1.0,
    attrazione: 1.0,
  };

  const group = new THREE.Group();
  scene.add(group);

  const moths = [];

  function spawnPosition() {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 5;
    return new THREE.Vector3(Math.cos(a) * r, 1 + Math.random() * 3.5, Math.sin(a) * r);
  }

  function setCount(n) {
    while (moths.length < n) {
      const mesh = makeMoth();
      const m = {
        mesh,
        pos: spawnPosition(),
        vel: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5) * 0.4, (Math.random() - 0.5)),
        wander: new THREE.Vector3(),
        wanderTimer: 0,
        stun: 0,
        spin: 0,
        flapPhase: Math.random() * Math.PI * 2,
        flapFreq: 22 + Math.random() * 10,
        orbitDir: Math.random() < 0.5 ? 1 : -1,
        speedMul: 0.8 + Math.random() * 0.5,
      };
      mesh.position.copy(m.pos);
      group.add(mesh);
      moths.push(m);
    }
    while (moths.length > n) {
      const m = moths.pop();
      group.remove(m.mesh);
    }
  }
  setCount(params.numero);

  // sorgenti luminose registrate: ognuna espone punto più vicino, raggio e livello
  let neonRef = null;
  let bulbRef = null;
  function bindLights({ neon, bulb }) {
    neonRef = neon;
    bulbRef = bulb;
  }

  const attractors = [];
  function collectAttractors() {
    attractors.length = 0;
    if (neonRef) {
      const level = neonRef.getLevel();
      if (level > 0.05) {
        const half = neonRef.params.lunghezza / 2;
        const a = _v1.set(-half, 0, 0);
        const b = _v2.set(half, 0, 0);
        neonRef.group.localToWorld(a);
        neonRef.group.localToWorld(b);
        attractors.push({
          type: 'segment',
          a: a.clone(),
          b: b.clone(),
          radius: neonRef.params.diametro / 2 + 0.03,
          level,
        });
      }
    }
    if (bulbRef && bulbRef.params.accesa) {
      attractors.push({
        type: 'point',
        p: bulbRef.group.position.clone(),
        radius: 0.16,
        level: Math.min(bulbRef.params.intensita / 25, 1.5),
      });
    }
  }

  const target = new THREE.Vector3();
  const steer = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  function update(time, dt) {
    group.visible = params.attivi;
    if (!params.attivi || dt <= 0) return;

    collectAttractors();

    for (const m of moths) {
      // --- stordimento dopo un urto: tumbling in caduta ---
      if (m.stun > 0) {
        m.stun -= dt;
        m.vel.y -= 4.5 * dt;           // gravità
        m.vel.multiplyScalar(1 - 1.2 * dt); // attrito aria
        m.pos.addScaledVector(m.vel, dt);
        m.mesh.position.copy(m.pos);
        m.mesh.rotation.x += m.spin * dt;
        m.mesh.rotation.z += m.spin * 0.7 * dt;
        if (m.pos.y < MIN_Y) { m.pos.y = MIN_Y; m.vel.y = Math.abs(m.vel.y) * 0.3; }
        continue;
      }

      // --- scelta dell'attrattore: il più "appetibile" (livello / distanza) ---
      let best = null;
      let bestScore = 0;
      for (const att of attractors) {
        const cp = att.type === 'segment'
          ? closestPointOnSegment(m.pos, att.a, att.b, _v1)
          : _v1.copy(att.p);
        const d = Math.max(m.pos.distanceTo(cp), 0.05);
        const score = att.level / (0.4 + d * d * 0.06);
        if (score > bestScore) {
          bestScore = score;
          best = att;
          target.copy(cp);
        }
      }

      steer.set(0, 0, 0);
      const maxSpeed = 2.3 * params.velocita * m.speedMul;

      if (best && params.attrazione > 0) {
        _v2.subVectors(target, m.pos);
        const dist = _v2.length();
        _v2.normalize();

        // attrazione radiale + orbita tangenziale: la classica spirale della falena
        const pull = 3.2 * params.attrazione * Math.min(best.level, 1.2);
        steer.addScaledVector(_v2, pull);
        tangent.crossVectors(_v2, UP).normalize().multiplyScalar(m.orbitDir * pull * 0.85);
        steer.add(tangent);

        // ogni tanto inverte il senso dell'orbita
        if (Math.random() < 0.3 * dt) m.orbitDir *= -1;

        // --- collisione con la sorgente ---
        if (dist < best.radius + 0.05) {
          _v3.subVectors(m.pos, target).normalize();
          m.pos.copy(target).addScaledVector(_v3, best.radius + 0.06);
          m.vel.reflect(_v3.negate()).multiplyScalar(0.35);
          m.vel.addScaledVector(_v3, -1.2); // spinta via dalla sorgente
          m.stun = 0.25 + Math.random() * 0.6;
          m.spin = (Math.random() - 0.5) * 30;
          continue;
        }
      } else {
        // nessuna luce accesa: volo erratico
        m.wanderTimer -= dt;
        if (m.wanderTimer <= 0) {
          m.wanderTimer = 1.5 + Math.random() * 2;
          m.wander.copy(spawnPosition());
        }
        steer.addScaledVector(_v2.subVectors(m.wander, m.pos).normalize(), 1.2);
      }

      // jitter: le falene non volano mai dritte
      steer.x += (Math.random() - 0.5) * 6;
      steer.y += (Math.random() - 0.5) * 5;
      steer.z += (Math.random() - 0.5) * 6;

      // confini morbidi
      const horiz = Math.hypot(m.pos.x, m.pos.z);
      if (horiz > BOUNDS_RADIUS) steer.addScaledVector(_v2.set(-m.pos.x, 0, -m.pos.z).normalize(), 4);
      if (m.pos.y < MIN_Y + 0.3) steer.y += 4;
      if (m.pos.y > MAX_Y) steer.y -= 4;

      m.vel.addScaledVector(steer, dt);
      const sp = m.vel.length();
      if (sp > maxSpeed) m.vel.multiplyScalar(maxSpeed / sp);
      if (sp < 0.4) m.vel.multiplyScalar(1 + 2 * dt);

      m.pos.addScaledVector(m.vel, dt);
      m.mesh.position.copy(m.pos);

      // orientamento lungo la velocità + battito d'ali
      _v3.copy(m.pos).add(m.vel);
      m.mesh.lookAt(_v3);
      const flap = Math.sin(time * m.flapFreq + m.flapPhase) * 0.9 + 0.15;
      const [wl, wr] = m.mesh.userData.wings;
      wl.rotation.z = flap;
      wr.rotation.z = -flap;
    }
  }

  // punto di vista della prima falena, per la camera soggettiva
  let povHidden = false;
  function getPOV() {
    const m = moths[0];
    if (!m || !params.attivi) return null;
    m.mesh.visible = !povHidden;
    return { pos: m.pos, vel: m.vel, stunned: m.stun > 0 };
  }

  // in vista soggettiva la falena seguita non deve occludere la camera
  function setPOVHidden(hidden) {
    povHidden = hidden;
    if (moths[0]) moths[0].mesh.visible = !hidden;
  }

  return { params, group, update, setCount, bindLights, getPOV, setPOVHidden };
}
