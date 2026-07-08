import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CompoundEyeShader } from './compoundEye.js';
import { createFloor } from './floors.js';
import { createSunflowers } from './objects/sunflowers.js';
import { createTeddy } from './objects/teddy.js';
import { createNeon } from './lights/neon.js';
import { createAmbient } from './lights/ambient.js';
import { createBulb } from './lights/bulb.js';
import { createInsects } from './insects.js';
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
camera.position.set(5, 3.2, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.9, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 2;
controls.maxDistance = 20;

// pavimento
const floor = createFloor(scene);

// oggetti (uno visibile alla volta)
const objects = {
  'Girasoli': createSunflowers(),
  'Orsetto peluche': createTeddy(),
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
floor.setFloor(state.pavimento);

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
    camera.position.set(5, 3.2, 6);
    controls.target.set(0, 0.9, 0);
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

// UI
createUI({ state, setObject, setFloor: floor.setFloor, neon, ambient, bulb, insects, setVista });

if (import.meta.env.DEV) {
  window.__debug = { insects, neon, bulb, camera, controls };
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
  if (state.vista === 'Occhi di insetto') {
    updateInsectView(dt);
  } else {
    controls.update();
  }
  composer.render();
});
