import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let rectAreaInitialized = false;

const NEON_COLOR = 0xd6f4ff;
const HEIGHT = 4.2;

export function createNeon(scene) {
  if (!rectAreaInitialized) {
    RectAreaLightUniformsLib.init();
    rectAreaInitialized = true;
  }

  const params = {
    acceso: true,
    intensita: 12,
    lunghezza: 3.0,
    diametro: 0.06,
    frequenzaInterruzioni: 0.8, // burst medi al secondo
    durataInterruzioni: 0.35,   // durata media di un burst (s)
  };

  const group = new THREE.Group();
  group.position.set(0, HEIGHT, 0);
  scene.add(group);

  // luce principale del tubo (non proietta ombre)
  const rectLight = new THREE.RectAreaLight(NEON_COLOR, params.intensita, params.lunghezza, 0.3);
  rectLight.rotation.x = -Math.PI / 2; // punta verso il basso
  group.add(rectLight);

  // spot debole co-locato solo per le ombre
  const shadowSpot = new THREE.SpotLight(NEON_COLOR, 30, 25, Math.PI / 3, 0.5, 1.2);
  shadowSpot.castShadow = true;
  shadowSpot.shadow.mapSize.set(1024, 1024);
  shadowSpot.position.set(0, 0, 0);
  shadowSpot.target.position.set(0, -HEIGHT, 0);
  group.add(shadowSpot);
  group.add(shadowSpot.target);

  // mesh del tubo + materiale emissivo
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.2,
    emissive: NEON_COLOR,
    emissiveIntensity: 2.5,
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.5, metalness: 0.8 });
  const mountMat = new THREE.MeshStandardMaterial({ color: 0x505055, roughness: 0.6, metalness: 0.7 });

  let tube = null;
  let caps = [];
  let wires = [];

  function rebuildTube() {
    if (tube) {
      tube.geometry.dispose();
      group.remove(tube);
      for (const m of [...caps, ...wires]) { m.geometry.dispose(); group.remove(m); }
      caps = []; wires = [];
    }
    const r = params.diametro / 2;
    const len = params.lunghezza;
    const geo = new THREE.CapsuleGeometry(r, len - r * 2, 8, 16);
    geo.rotateZ(Math.PI / 2);
    tube = new THREE.Mesh(geo, tubeMat);
    group.add(tube);

    // attacchi metallici alle estremità
    const capGeo = new THREE.CylinderGeometry(r * 1.6, r * 1.6, 0.09, 12);
    capGeo.rotateZ(Math.PI / 2);
    for (const s of [1, -1]) {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.x = s * (len / 2);
      caps.push(cap);
      group.add(cap);
      // cavetti di sospensione dal soffitto
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6), mountMat);
      wire.position.set(s * (len / 2 - 0.1), 0.3, 0);
      wires.push(wire);
      group.add(wire);
    }
    rectLight.width = len;
  }
  rebuildTube();

  // --- macchina a stati dello sfarfallio ---
  // level: 0..1 moltiplicatore dell'intensità
  const flicker = {
    inBurst: false,
    burstEnd: 0,
    nextToggle: 0,
    burstOn: false,
    level: 1,
  };

  function update(time, dt) {
    if (!params.acceso) {
      applyLevel(0);
      return;
    }

    if (!flicker.inBurst) {
      // probabilità di iniziare un burst di interruzioni
      if (Math.random() < params.frequenzaInterruzioni * dt) {
        flicker.inBurst = true;
        flicker.burstEnd = time + params.durataInterruzioni * (0.5 + Math.random());
        flicker.burstOn = false;
        flicker.nextToggle = time;
      }
    }

    if (flicker.inBurst) {
      if (time >= flicker.burstEnd) {
        flicker.inBurst = false;
        flicker.level = 1;
      } else if (time >= flicker.nextToggle) {
        // dentro il burst: on/off rapidi e irregolari (starter guasto)
        flicker.burstOn = !flicker.burstOn;
        flicker.nextToggle = time + 0.02 + Math.random() * 0.08;
        flicker.level = flicker.burstOn ? 0.4 + Math.random() * 0.5 : 0.0;
      }
    } else {
      // acceso "stabile": leggero ronzio/tremolio da tubo vecchio
      flicker.level = 0.92 + 0.08 * Math.sin(time * 120) * Math.random();
    }

    applyLevel(flicker.level);
  }

  function applyLevel(level) {
    rectLight.intensity = params.intensita * level;
    rectLight.visible = level > 0.01;
    shadowSpot.intensity = 30 * level * (params.intensita / 12);
    shadowSpot.visible = level > 0.01;
    tubeMat.emissiveIntensity = 2.5 * level;
    tubeMat.color.setHex(level > 0.05 ? 0x888888 : 0x3a3a3e);
  }

  return { group, params, update, rebuildTube };
}
