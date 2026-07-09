import * as THREE from 'three';

// Mostra interattiva del Seeed Studio XIAO ESP32-C3 (open hardware).
// Scheda in scala 10:1 (1 unità = 10 mm) su piedistallo da museo:
// ruota lentamente, i componenti sono cliccabili e mostrano una scheda
// descrittiva; lo slider "esploso" solleva i componenti dalla PCB.

const PCB_L = 2.1;   // 21 mm
const PCB_W = 1.78;  // 17.8 mm
const PCB_T = 0.12;  // spessore
const BOARD_Y = 1.35; // quota della scheda sopra il piedistallo

const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.35 });
const steelMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.3 });
const blackIC = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.55 });

function roundedBoardGeometry() {
  const r = 0.18;
  const hl = PCB_L / 2, hw = PCB_W / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hl + r, -hw);
  shape.lineTo(hl - r, -hw);
  shape.quadraticCurveTo(hl, -hw, hl, -hw + r);
  shape.lineTo(hl, hw - r);
  shape.quadraticCurveTo(hl, hw, hl - r, hw);
  shape.lineTo(-hl + r, hw);
  shape.quadraticCurveTo(-hl, hw, -hl, hw - r);
  shape.lineTo(-hl, -hw + r);
  shape.quadraticCurveTo(-hl, -hw, -hl + r, -hw);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: PCB_T, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // dal piano XY al piano XZ, spessore da y=0 a y=PCB_T
  return geo;
}

// serigrafia: nomi dei pin e logo disegnati su una texture trasparente
function silkscreenTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 868;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = '#e8e8e8';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 54px monospace';
  g.fillText('XIAO', 512, 300);
  g.font = 'bold 40px monospace';
  g.fillText('ESP32-C3', 512, 360);
  g.font = 'bold 30px monospace';
  const left = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'];
  const right = ['5V', 'GND', '3V3', 'D10', 'D9', 'D8', 'D7'];
  for (let i = 0; i < 7; i++) {
    const x = 178 + i * 111.4; // stesse posizioni dei pad castellati
    g.fillText(left[i], x, 812);
    g.fillText(right[i], x, 56);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createXiao({ camera, dom }) {
  const group = new THREE.Group();
  group.name = 'xiao-esp32c3';

  const params = { esploso: 0, rotazione: true };

  // --- piedistallo da museo ---
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.15, 0.9, 48),
    new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.6, metalness: 0.2 })
  );
  pedestal.position.y = 0.45;
  pedestal.castShadow = pedestal.receiveShadow = true;
  group.add(pedestal);
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 0.05, 48),
    new THREE.MeshStandardMaterial({ color: 0x44474f, roughness: 0.4, metalness: 0.5 })
  );
  plate.position.y = 0.925;
  plate.castShadow = true;
  group.add(plate);

  // faretto da museo puntato sulla scheda
  const spot = new THREE.SpotLight(0xfff2dd, 30, 12, 0.5, 0.5, 1.6);
  spot.position.set(2.2, 4.5, 2.2);
  spot.castShadow = true;
  group.add(spot, spot.target);
  spot.target.position.set(0, BOARD_Y, 0);

  // --- scheda: gira su un "piatto" inclinato verso il visitatore ---
  const spin = new THREE.Group();
  spin.position.y = BOARD_Y;
  group.add(spin);
  const board = new THREE.Group();
  board.rotation.x = 0.5; // inclinata come in una teca, così il lato componenti si vede anche da lontano
  spin.add(board);

  // parti cliccabili e parti "esplodibili"
  const hitParts = [];
  const exploding = [];

  // aggiunge un componente: mesh/gruppo, quota di esplosione, info per il click
  function part(obj, explodeY, info) {
    obj.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    if (info) {
      obj.traverse((m) => { if (m.isMesh) { m.userData.info = info; hitParts.push(m); } });
    }
    if (explodeY > 0) exploding.push({ obj, baseY: obj.position.y, explodeY });
    board.add(obj);
    return obj;
  }

  // PCB nera
  const pcb = new THREE.Mesh(
    roundedBoardGeometry(),
    new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.7, metalness: 0.05 })
  );
  part(pcb, 0, {
    nome: 'PCB (circuito stampato)',
    testo: 'La scheda misura appena 21 × 17,8 mm nella realtà: qui è ingrandita 10 volte. Il design è open hardware: schemi e file di produzione sono pubblici.',
  });

  // serigrafia bianca sopra la PCB
  const silk = new THREE.Mesh(
    new THREE.PlaneGeometry(PCB_L, PCB_W),
    new THREE.MeshBasicMaterial({ map: silkscreenTexture(), transparent: true, depthWrite: false })
  );
  silk.rotation.x = -Math.PI / 2;
  silk.position.y = PCB_T + 0.002;
  silk.renderOrder = 1; // disegnata dopo la PCB, altrimenti la sovrascrive (depthWrite off)
  board.add(silk);

  // SoC ESP32-C3 (QFN 5×5 mm) con tacca pin-1
  const soc = new THREE.Group();
  const socBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.5), blackIC);
  socBody.position.y = PCB_T + 0.045;
  soc.add(socBody);
  const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.005, 20),
    new THREE.MeshStandardMaterial({ color: 0x555a63, roughness: 0.4 }));
  dot.position.set(-0.17, PCB_T + 0.093, -0.17);
  soc.add(dot);
  soc.position.set(-0.35, 0, 0);
  part(soc, 0.55, {
    nome: 'SoC ESP32-C3',
    testo: 'Il cuore della scheda: microcontrollore RISC-V single-core a 160 MHz con Wi-Fi 2,4 GHz e Bluetooth 5 (LE), 400 KB di SRAM e 4 MB di flash integrata.',
  });

  // connettore USB-C sul bordo anteriore
  const usb = new THREE.Group();
  const usbBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.74), steelMat);
  usbBody.position.y = PCB_T + 0.13;
  usb.add(usbBody);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.6), blackIC);
  mouth.position.set(0.45, PCB_T + 0.13, 0);
  usb.add(mouth);
  usb.position.set(PCB_L / 2 - 0.42, 0, 0);
  part(usb, 0.4, {
    nome: 'Connettore USB-C',
    testo: 'Serve per alimentare la scheda e programmarla: l’ESP32-C3 ha USB nativa, quindi non serve un chip convertitore seriale esterno.',
  });

  // pulsanti RESET e BOOT ai lati della USB
  const btnInfo = {
    RESET: 'Riavvia il microcontrollore senza togliere l’alimentazione.',
    BOOT: 'Tenuto premuto all’accensione mette il chip in modalità di caricamento firmware via USB.',
  };
  for (const [i, name] of ['RESET', 'BOOT'].entries()) {
    const btn = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.2), steelMat);
    base.position.y = PCB_T + 0.04;
    btn.add(base);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 20),
      new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.6 }));
    cap.position.y = PCB_T + 0.1;
    btn.add(cap);
    btn.position.set(PCB_L / 2 - 0.3, 0, (i === 0 ? -1 : 1) * 0.62);
    part(btn, 0.45, { nome: `Pulsante ${name}`, testo: btnInfo[name] });
  }

  // connettore U.FL per l'antenna esterna
  const ufl = new THREE.Group();
  const uflBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.26), goldMat);
  uflBase.position.y = PCB_T + 0.025;
  ufl.add(uflBase);
  const uflRing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 24), steelMat);
  uflRing.position.y = PCB_T + 0.09;
  ufl.add(uflRing);
  ufl.position.set(-PCB_L / 2 + 0.28, 0, -PCB_W / 2 + 0.3);
  part(ufl, 0.5, {
    nome: 'Connettore antenna (U.FL)',
    testo: 'Qui si aggancia l’antenna esterna per Wi-Fi e Bluetooth: la scheda è così piccola che non c’è spazio per un’antenna integrata.',
  });

  // LED di ricarica (rosso)
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xaa1105, roughness: 0.3 }));
  led.position.set(-PCB_L / 2 + 0.3, PCB_T + 0.03, PCB_W / 2 - 0.3);
  part(led, 0.4, {
    nome: 'LED di ricarica',
    testo: 'Si accende rosso mentre la batteria collegata ai pad sul retro è in carica.',
  });

  // regolatore di tensione 3,3 V
  const reg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), blackIC.clone());
  reg.position.set(0.25, PCB_T + 0.05, -0.45);
  part(reg, 0.35, {
    nome: 'Regolatore 3,3 V e ricarica',
    testo: 'Abbassa i 5 V della USB ai 3,3 V usati dal chip e gestisce la ricarica di una batteria LiPo collegata sul retro.',
  });

  // quarzo 40 MHz
  const xtal = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.16), steelMat.clone());
  xtal.position.set(0.15, PCB_T + 0.035, 0.42);
  part(xtal, 0.3, {
    nome: 'Quarzo 40 MHz',
    testo: 'L’oscillatore al quarzo dà il "battito" di riferimento che scandisce il tempo del microcontrollore.',
  });

  // condensatori e resistenze sparsi (non cliccabili)
  const passiveMat = new THREE.MeshStandardMaterial({ color: 0x8a7355, roughness: 0.6 });
  const passives = [
    [-0.75, 0.35], [-0.7, -0.35], [0.0, -0.6], [-0.1, 0.62], [0.45, 0.3], [0.5, -0.15],
  ];
  for (const [x, z] of passives) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.06), passiveMat);
    p.position.set(x, PCB_T + 0.025, z);
    p.rotation.y = (x * 7 + z * 3) % 1.5;
    part(p, 0.25);
  }

  // pad castellati dorati lungo i bordi lunghi (7 per lato)
  const padInfo = {
    nome: 'Pad castellati (14 pin)',
    testo: '11 GPIO digitali (di cui 4 anche analogici), più I2C, UART e SPI, e i pin di alimentazione 5V, 3V3 e GND. I bordi "smerlati" permettono di saldare la scheda direttamente su un’altra PCB.',
  };
  for (let i = 0; i < 7; i++) {
    const x = -0.75 + i * 0.25;
    for (const s of [1, -1]) {
      const half = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, PCB_T + 0.004, 16), goldMat);
      half.position.set(x, (PCB_T + 0.004) / 2, s * PCB_W / 2);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.006, 20), goldMat);
      top.position.set(x, PCB_T + 0.003, s * (PCB_W / 2 - 0.07));
      const g = new THREE.Group();
      g.add(half, top);
      part(g, 0, padInfo);
    }
  }

  // pad batteria sul retro
  for (const [i, sign] of ['+', '−'].entries()) {
    const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.006, 24), goldMat);
    bp.position.set(-0.3 + i * 0.6, -0.003, 0.25);
    part(bp, 0, {
      nome: `Pad batteria (${sign})`,
      testo: 'Sul retro della scheda: qui si salda una batteria LiPo da 3,7 V per usare la scheda senza cavo USB. La ricarica avviene automaticamente quando si collega la USB.',
    });
  }

  // --- scheda descrittiva (overlay HTML) ---
  const card = document.createElement('div');
  Object.assign(card.style, {
    position: 'fixed',
    left: 'max(12px, env(safe-area-inset-left))',
    bottom: 'max(12px, env(safe-area-inset-bottom))',
    maxWidth: 'min(340px, calc(100vw - 24px))',
    padding: '14px 40px 14px 16px',
    borderRadius: '12px',
    background: 'rgba(20,20,20,0.75)',
    color: '#fff',
    font: '14px/1.45 system-ui, sans-serif',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
    zIndex: '999',
    display: 'none',
  });
  const cardTitle = document.createElement('div');
  Object.assign(cardTitle.style, { fontWeight: '700', marginBottom: '6px', fontSize: '15px' });
  const cardText = document.createElement('div');
  cardText.style.opacity = '0.9';
  const cardClose = document.createElement('button');
  cardClose.textContent = '✕';
  cardClose.setAttribute('aria-label', 'Chiudi');
  Object.assign(cardClose.style, {
    position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px',
    border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '14px',
  });
  card.append(cardTitle, cardText, cardClose);
  document.body.appendChild(card);

  // selezione: evidenzia il componente e mostra la scheda
  let selected = null;
  function clearSelection() {
    if (selected) {
      for (const m of selected.meshes) {
        if (m.material.emissive) m.material.emissive.setHex(m.userData.baseEmissive);
      }
      selected = null;
    }
    card.style.display = 'none';
  }
  cardClose.addEventListener('click', clearSelection);

  function select(mesh) {
    clearSelection();
    const info = mesh.userData.info;
    // evidenzia tutte le mesh che condividono la stessa info (es. tutti i pad)
    const meshes = hitParts.filter((m) => m.userData.info === info);
    for (const m of meshes) {
      if (m.material.emissive) {
        if (m.userData.baseEmissive === undefined) m.userData.baseEmissive = m.material.emissive.getHex();
        m.material = m.material.clone();
        m.material.emissive.setHex(0x2266ff);
        m.material.emissiveIntensity = 0.6;
      }
    }
    selected = { meshes };
    cardTitle.textContent = info.nome;
    cardText.textContent = info.testo;
    card.style.display = 'block';
  }

  // click (non trascinamento) → raycast sui componenti
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downX = 0, downY = 0;
  dom.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
  dom.addEventListener('pointerup', (e) => {
    if (!group.visible) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; // era un drag
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(hitParts, false);
    if (hits.length) select(hits[0].object);
    else clearSelection();
  });

  // cursore a manina sopra i componenti
  dom.addEventListener('pointermove', (e) => {
    if (!group.visible || e.pointerType !== 'mouse') return;
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    dom.style.cursor = raycaster.intersectObjects(hitParts, false).length ? 'pointer' : '';
  });

  let explodeCur = 0;
  function update(time, dt) {
    if (!group.visible) { if (card.style.display !== 'none') clearSelection(); return; }
    if (params.rotazione) spin.rotation.y += dt * 0.25;
    // esplosione smorzata verso il valore dello slider
    explodeCur += (params.esploso - explodeCur) * Math.min(1, dt * 6);
    for (const p of exploding) {
      p.obj.position.y = p.baseY + explodeCur * p.explodeY;
    }
  }

  return { group, params, update };
}
