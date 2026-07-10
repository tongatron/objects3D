import * as THREE from 'three';

// Nuraghe sardo: torre troncoconica a blocchi di basalto sovrapposti a secco,
// con ingresso architravato e terrazzo sommitale. Dalla sommità eruttano
// popcorn che ricadono e si depositano sul terreno.
export function createNuraghe() {
  const group = new THREE.Group();
  group.name = 'nuraghe';

  const params = {
    popcorn: true,
    intensita: 1, // moltiplicatore della frequenza di sparo
  };

  // --- torre a blocchi di pietra (InstancedMesh per l'alta definizione) ---
  const H = 3.0;          // altezza torre
  const R_BASE = 1.7;     // raggio alla base
  const R_TOP = 1.05;     // raggio in sommità
  const ROW_H = 0.24;     // altezza di un corso di pietre
  const rows = Math.round(H / ROW_H);

  // conta prima le pietre per dimensionare l'InstancedMesh
  const placements = [];
  const doorAngle = Math.PI / 2; // ingresso rivolto verso +z (lato camera)
  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1);
    const y = ROW_H * (row + 0.5);
    // profilo leggermente convesso, tipico della muratura ciclopica
    let r = THREE.MathUtils.lerp(R_BASE, R_TOP, Math.pow(t, 0.85));
    if (row === rows - 1) r += 0.08; // corso aggettante del terrazzo
    const count = Math.max(8, Math.round((2 * Math.PI * r) / 0.42));
    const phase = (row % 2) * 0.5; // corsi sfalsati come nella posa reale
    for (let i = 0; i < count; i++) {
      const a = ((i + phase) / count) * Math.PI * 2;
      // varco dell'ingresso nei corsi bassi
      const da = Math.atan2(Math.sin(a - doorAngle), Math.cos(a - doorAngle));
      if (row < 4 && Math.abs(da) < 0.22) continue;
      placements.push({ a, y, r, row });
    }
  }
  // architrave dell'ingresso (pietra unica più lunga)
  placements.push({ a: doorAngle, y: ROW_H * 4.5, r: THREE.MathUtils.lerp(R_BASE, R_TOP, Math.pow(4.5 / (rows - 1), 0.85)), row: 4, lintel: true });
  // pietre crollate sparse intorno alla base
  const fallen = 14;
  for (let i = 0; i < fallen; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = R_BASE + 0.4 + Math.random() * 1.2;
    placements.push({ a, y: 0.09, r: d, row: -1 });
  }

  const stoneGeo = new THREE.BoxGeometry(1, 1, 1);
  const stoneMat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0.02 });
  const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, placements.length);
  stones.castShadow = true;
  stones.receiveShadow = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const euler = new THREE.Euler();
  const color = new THREE.Color();
  placements.forEach((p, i) => {
    const jr = (Math.random() - 0.5) * 0.05;
    pos.set(Math.cos(p.a) * (p.r + jr), p.y + (Math.random() - 0.5) * 0.02, Math.sin(p.a) * (p.r + jr));
    if (p.lintel) {
      scl.set(1.0, 0.26, 0.34);
    } else if (p.row === -1) {
      scl.set(0.3 + Math.random() * 0.25, 0.16 + Math.random() * 0.1, 0.25 + Math.random() * 0.2);
    } else {
      scl.set(0.34 + Math.random() * 0.12, ROW_H * (0.92 + Math.random() * 0.1), 0.26 + Math.random() * 0.1);
    }
    euler.set(
      (Math.random() - 0.5) * 0.08,
      -p.a + Math.PI / 2 + (Math.random() - 0.5) * 0.1, // pietra orientata tangente al muro
      (Math.random() - 0.5) * 0.08
    );
    q.setFromEuler(euler);
    m.compose(pos, q, scl);
    stones.setMatrixAt(i, m);
    // basalto: grigi scuri con lievi variazioni brune
    const g = 0.28 + Math.random() * 0.14;
    color.setRGB(g * (1 + Math.random() * 0.12), g, g * (0.92 + Math.random() * 0.08));
    stones.setColorAt(i, color);
  });
  stones.instanceMatrix.needsUpdate = true;
  stones.instanceColor.needsUpdate = true;
  group.add(stones);

  // camera interna scura visibile dall'ingresso
  const innerMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1, side: THREE.BackSide });
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(R_BASE * 0.7, R_BASE * 0.8, H * 0.9, 24, 1, true), innerMat);
  inner.position.y = H * 0.45;
  group.add(inner);

  // --- popcorn: fontana dalla sommità, deposito a terra ---
  const MAX_POP = 260;
  // chicco scoppiato: icosaedro con vertici perturbati (forma a nuvoletta)
  const popGeo = new THREE.IcosahedronGeometry(0.055, 1);
  {
    const p = popGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const s = 0.75 + Math.random() * 0.6;
      p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s);
    }
    popGeo.computeVertexNormals();
  }
  const popMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  const popcorn = new THREE.InstancedMesh(popGeo, popMat, MAX_POP);
  popcorn.castShadow = true;
  popcorn.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(popcorn);

  // stato per particella
  const parts = [];
  for (let i = 0; i < MAX_POP; i++) {
    parts.push({
      active: false,
      landed: false,
      landedAt: 0,
      pos: new THREE.Vector3(0, -10, 0),
      vel: new THREE.Vector3(),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
      size: 0.8 + Math.random() * 0.7,
    });
    // bianco crema con sfumature burro
    const w = 0.92 + Math.random() * 0.08;
    color.setRGB(w, w * (0.94 + Math.random() * 0.05), w * (0.78 + Math.random() * 0.12));
    popcorn.setColorAt(i, color);
    m.compose(parts[i].pos, q.identity(), scl.setScalar(0.0001));
    popcorn.setMatrixAt(i, m);
  }
  popcorn.instanceColor.needsUpdate = true;

  const GRAVITY = -5.5;
  const GROUND_Y = 0.05;
  const LIFETIME = 25; // secondi a terra prima del riciclo
  let spawnAcc = 0;

  function spawn(now) {
    // ricicla: prima gli inattivi, poi il chicco a terra da più tempo
    let p = parts.find((x) => !x.active);
    if (!p) {
      p = parts.reduce((best, x) => (x.landed && (!best || x.landedAt < best.landedAt) ? x : best), null);
      if (!p) return;
    }
    p.active = true;
    p.landed = false;
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * R_TOP * 0.5;
    p.pos.set(Math.cos(a) * r, H + 0.1, Math.sin(a) * r);
    const dir = Math.random() * Math.PI * 2;
    const out = 0.6 + Math.random() * 1.4;
    p.vel.set(Math.cos(dir) * out, 2.6 + Math.random() * 1.8, Math.sin(dir) * out);
    p.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    p.landedAt = now;
  }

  function update(time, dt) {
    if (!group.visible) return;
    if (params.popcorn) {
      spawnAcc += dt * 9 * params.intensita;
      while (spawnAcc >= 1) { spawn(time); spawnAcc -= 1; }
    }
    for (let i = 0; i < MAX_POP; i++) {
      const p = parts[i];
      if (!p.active) continue;
      if (!p.landed) {
        p.vel.y += GRAVITY * dt;
        p.pos.addScaledVector(p.vel, dt);
        p.rot.x += p.spin.x * dt;
        p.rot.y += p.spin.y * dt;
        p.rot.z += p.spin.z * dt;
        // atterraggio: fuori dal corpo della torre tocca l'erba
        const rr = Math.hypot(p.pos.x, p.pos.z);
        if (p.pos.y <= GROUND_Y && rr > R_BASE * 0.6) {
          if (Math.abs(p.vel.y) > 1.2) {
            p.pos.y = GROUND_Y;
            p.vel.y *= -0.35; // piccolo rimbalzo
            p.vel.x *= 0.6;
            p.vel.z *= 0.6;
          } else {
            p.pos.y = GROUND_Y;
            p.landed = true;
            p.landedAt = time;
          }
        }
      } else if (time - p.landedAt > LIFETIME) {
        p.active = false;
        p.pos.set(0, -10, 0);
      }
      euler.copy(p.rot);
      q.setFromEuler(euler);
      m.compose(p.pos, q, scl.setScalar(p.active ? p.size : 0.0001));
      popcorn.setMatrixAt(i, m);
    }
    popcorn.instanceMatrix.needsUpdate = true;
  }

  return { group, params, update };
}
