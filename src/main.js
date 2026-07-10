import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CompoundEyeShader } from './compoundEye.js';
import { createFloor, FLOOR_PRESETS } from './floors.js';
import { createSunflowers } from './objects/sunflowers.js';
import { createDaisies } from './objects/daisies.js';
import { createRoses } from './objects/roses.js';
import { createTeddy } from './objects/teddy.js';
import { createXiao } from './objects/xiao.js';
import { createBamboo } from './objects/bamboo.js';
import { createNuraghe } from './objects/nuraghe.js';
import { createPanda } from './panda.js';
import { createNeon } from './lights/neon.js';
import { createAmbient } from './lights/ambient.js';
import { createBulb } from './lights/bulb.js';
import { createInsects } from './insects.js';
import { createWind } from './wind.js';
import { createMonsters } from './monster.js';
import { createMower } from './mower.js';
import { createShare } from './share.js';
import { createGrass } from './grass.js';
import { createUI } from './ui.js';

const container = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.3, 7);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.6, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 2;
controls.maxDistance = 20;

// pavimento
const floor = createFloor(scene);

// vento condiviso da margherite ed erba
const wind = createWind();

// erba 3D, visibile solo sul pavimento erboso
const grass = createGrass(scene, wind);

function applyFloor(name) {
  floor.setFloor(name);
  grass.setVisible(name === 'Terra erbosa');
}

// oggetti (uno visibile alla volta)
const daisies = createDaisies();
const roses = createRoses();
const bamboo = createBamboo();
const panda = createPanda(bamboo);
bamboo.group.add(panda.group); // il panda vive nella foresta di bambù
const xiao = createXiao({ camera, dom: renderer.domElement });
const nuraghe = createNuraghe();
const objects = {
  'Girasoli': createSunflowers(),
  'Campo di margherite': daisies.group,
  'Campo di rose rosse': roses.group,
  'Foresta di bambù': bamboo.group,
  'Orsetto peluche': createTeddy(),
  'Nuraghe sardo': nuraghe.group,
  'XIAO ESP32-C3': xiao.group,
};
for (const obj of Object.values(objects)) {
  obj.visible = false;
  scene.add(obj);
}

function setObject(name) {
  for (const [key, obj] of Object.entries(objects)) {
    obj.visible = key === name;
  }
}

// luci
const neon = createNeon(scene);
const ambient = createAmbient(scene);
const bulb = createBulb(scene);

// insetti attratti dalle luci
const insects = createInsects(scene);
insects.bindLights({ neon, bulb });

// mostriciattoli che corrono nel campo (opzionali, anche più d'uno)
const monsters = createMonsters(scene);

// mostro tagliaerba (opzionale): rasa erba e fiori, che poi ricrescono
const mower = createMower(scene, { grass, daisies, roses });

// post-processing: mosaico "occhio composto" attivo solo in vista insetto
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const eyePass = new ShaderPass(CompoundEyeShader);
eyePass.enabled = false;
eyePass.uniforms.aspect.value = window.innerWidth / window.innerHeight;
composer.addPass(eyePass);
composer.addPass(new OutputPass());

// stato iniziale
const state = {
  oggetto: 'Girasoli',
  pavimento: 'Terra erbosa',
  vista: 'Orbitale',
};
setObject(state.oggetto);
applyFloor(state.pavimento);

// vista soggettiva: la camera segue la prima falena
const ORBITAL_FOV = 50;
const INSECT_FOV = 105;
const camPos = new THREE.Vector3();
const lookDir = new THREE.Vector3(1, 0, 0);
const lookAt = new THREE.Vector3();

function setVista(name) {
  const insect = name === 'Occhi di insetto';
  eyePass.enabled = insect;
  controls.enabled = !insect;
  insects.setPOVHidden(insect);
  camera.fov = insect ? INSECT_FOV : ORBITAL_FOV;
  camera.updateProjectionMatrix();
  if (!insect) {
    camera.position.set(0, 1.3, 7);
    controls.target.set(0, 0.6, 0);
  }
}

function updateInsectView(dt) {
  const pov = insects.getPOV();
  if (!pov) {
    setVista('Orbitale');
    state.vista = 'Orbitale';
    return;
  }
  // inseguimento smorzato: niente scatti nonostante il jitter del volo
  const k = 1 - Math.pow(0.00005, dt);
  camPos.copy(pov.pos);
  camera.position.lerp(camPos, k);
  if (pov.vel.lengthSq() > 0.01) {
    lookDir.lerp(camPos.copy(pov.vel).normalize(), 1 - Math.pow(0.002, dt)).normalize();
  }
  lookAt.copy(camera.position).add(lookDir);
  camera.lookAt(lookAt);
  // rollio da caduta quando la falena è stordita
  if (pov.stunned) camera.rotation.z += Math.sin(performance.now() * 0.02) * 0.15;
}

// condivisione impostazioni via URL: binding chiave → get/set (+ ri-applicazione)
const bindings = [
  { key: 'oggetto', get: () => state.oggetto, set: (v) => { if (objects[v]) { state.oggetto = v; setObject(v); } } },
  { key: 'pavimento', get: () => state.pavimento, set: (v) => { if (FLOOR_PRESETS[v]) { state.pavimento = v; applyFloor(v); } } },
  { key: 'vista', get: () => state.vista, set: (v) => { if (v === 'Orbitale' || v === 'Occhi di insetto') { state.vista = v; setVista(v); } } },
  { key: 'neon', get: () => neon.params.acceso, set: (v) => { neon.params.acceso = v; } },
  { key: 'neonInt', get: () => neon.params.intensita, set: (v) => { neon.params.intensita = v; } },
  { key: 'neonLun', get: () => neon.params.lunghezza, set: (v) => { neon.params.lunghezza = v; neon.rebuildTube(); } },
  { key: 'neonDia', get: () => neon.params.diametro, set: (v) => { neon.params.diametro = v; neon.rebuildTube(); } },
  { key: 'neonFreq', get: () => neon.params.frequenzaInterruzioni, set: (v) => { neon.params.frequenzaInterruzioni = v; } },
  { key: 'neonDur', get: () => neon.params.durataInterruzioni, set: (v) => { neon.params.durataInterruzioni = v; } },
  { key: 'amb', get: () => ambient.params.accesa, set: (v) => { ambient.params.accesa = v; ambient.apply(); } },
  { key: 'ambInt', get: () => ambient.params.intensita, set: (v) => { ambient.params.intensita = v; ambient.apply(); } },
  { key: 'ambCol', get: () => ambient.params.colore, set: (v) => { if (/^#[0-9a-f]{6}$/i.test(v)) { ambient.params.colore = v; ambient.apply(); } } },
  { key: 'lamp', get: () => bulb.params.accesa, set: (v) => { bulb.params.accesa = v; bulb.apply(); } },
  { key: 'lampInt', get: () => bulb.params.intensita, set: (v) => { bulb.params.intensita = v; bulb.apply(); } },
  { key: 'lampAlt', get: () => bulb.params.altezza, set: (v) => { bulb.params.altezza = v; bulb.apply(); } },
  { key: 'margherite', get: () => daisies.params.densita, set: (v) => { daisies.params.densita = v; daisies.rebuild(); } },
  { key: 'rose', get: () => roses.params.densita, set: (v) => { roses.params.densita = v; roses.rebuild(); } },
  { key: 'ventoInt', get: () => wind.params.intensita, set: (v) => { wind.params.intensita = v; } },
  { key: 'ventoVel', get: () => wind.params.velocita, set: (v) => { wind.params.velocita = v; } },
  { key: 'ventoDir', get: () => wind.params.direzione, set: (v) => { wind.params.direzione = v; } },
  { key: 'erbaAlt', get: () => grass.params.altezza, set: (v) => { grass.params.altezza = v; grass.apply(); } },
  { key: 'falene', get: () => insects.params.attivi, set: (v) => { insects.params.attivi = v; } },
  { key: 'faleneNum', get: () => insects.params.numero, set: (v) => { insects.params.numero = Math.round(v); insects.setCount(insects.params.numero); } },
  { key: 'faleneVel', get: () => insects.params.velocita, set: (v) => { insects.params.velocita = v; } },
  { key: 'faleneAttr', get: () => insects.params.attrazione, set: (v) => { insects.params.attrazione = v; } },
  { key: 'mostro', get: () => monsters.params.attivo, set: (v) => { monsters.params.attivo = v; } },
  { key: 'mostroVel', get: () => monsters.params.velocita, set: (v) => { monsters.params.velocita = v; } },
  { key: 'mostroDir', get: () => monsters.params.cambiDirezione, set: (v) => { monsters.params.cambiDirezione = v; } },
  { key: 'mostri', get: () => monsters.serialize(), set: (v) => { monsters.deserialize(v); } },
  { key: 'tagliaerba', get: () => mower.params.attivo, set: (v) => { mower.params.attivo = v; } },
  { key: 'tagliaerbaGuida', get: () => mower.params.guida, set: (v) => { if (v === 'Automatica' || v === 'Frecce') mower.params.guida = v; } },
  { key: 'tagliaerbaVel', get: () => mower.params.velocita, set: (v) => { mower.params.velocita = v; } },
  { key: 'ricrescita', get: () => mower.params.ricrescita, set: (v) => { mower.params.ricrescita = v; } },
  { key: 'xiaoEsploso', get: () => xiao.params.esploso, set: (v) => { xiao.params.esploso = v; } },
  { key: 'xiaoRot', get: () => xiao.params.rotazione, set: (v) => { xiao.params.rotazione = v; } },
  { key: 'popcorn', get: () => nuraghe.params.popcorn, set: (v) => { nuraghe.params.popcorn = v; } },
  { key: 'popcornInt', get: () => nuraghe.params.intensita, set: (v) => { nuraghe.params.intensita = v; } },
  { key: 'bambu', get: () => bamboo.params.densita, set: (v) => { bamboo.params.densita = v; bamboo.rebuild(); } },
  { key: 'panda', get: () => panda.params.attivo, set: (v) => { panda.params.attivo = v; } },
  { key: 'pandaVel', get: () => panda.params.velocita, set: (v) => { panda.params.velocita = v; } },
];
const share = createShare(bindings);
share.applyFromURL(); // prima della GUI, che così nasce già allineata

// inquadratura d'apertura per la mostra del processore: dall'alto, sul lato componenti
if (state.oggetto === 'XIAO ESP32-C3' && state.vista === 'Orbitale') {
  camera.position.set(1.6, 3.9, 4.6);
  controls.target.set(0, 1.4, 0);
}

// UI
createUI({ state, setObject, setFloor: applyFloor, neon, ambient, bulb, insects, setVista, wind, daisies, roses, grass, monsters, mower, bamboo, panda, xiao, nuraghe, share });

if (import.meta.env.DEV) {
  window.__debug = { insects, neon, bulb, camera, controls, wind, daisies, roses, grass, monsters, mower, bamboo, panda, xiao, share, state };
}

// resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  eyePass.uniforms.aspect.value = window.innerWidth / window.innerHeight;
});

// loop
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = clock.elapsedTime;
  neon.update(time, dt);
  insects.update(time, dt);
  wind.update(dt);
  mower.update(time, dt); // prima dei campi, così il taglio vale già in questo frame
  grass.update(time, mower.params.ricrescita);
  daisies.update(wind, time, mower.params.ricrescita);
  roses.update(wind, time, mower.params.ricrescita);
  bamboo.update(wind, dt);
  if (bamboo.group.visible) panda.update(time, dt);
  xiao.update(time, dt);
  nuraghe.update(time, dt);
  monsters.update(time, dt);
  if (state.vista === 'Occhi di insetto') {
    updateInsectView(dt);
  } else {
    controls.update();
  }
  composer.render();
});
