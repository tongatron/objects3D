import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFloor } from './floors.js';
import { createSunflowers } from './objects/sunflowers.js';
import { createTeddy } from './objects/teddy.js';
import { createNeon } from './lights/neon.js';
import { createAmbient } from './lights/ambient.js';
import { createBulb } from './lights/bulb.js';
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

// stato iniziale
const state = {
  oggetto: 'Girasoli',
  pavimento: 'Terra erbosa',
};
setObject(state.oggetto);
floor.setFloor(state.pavimento);

// UI
createUI({ state, setObject, setFloor: floor.setFloor, neon, ambient, bulb });

// resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// loop
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = clock.elapsedTime;
  neon.update(time, dt);
  controls.update();
  renderer.render(scene, camera);
});
