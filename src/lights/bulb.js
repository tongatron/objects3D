import * as THREE from 'three';

const WARM = 0xffb46b; // ~2700K

export function createBulb(scene) {
  const params = {
    accesa: true,
    intensita: 17,
    altezza: 1.1,
  };

  const group = new THREE.Group();
  group.position.set(2.5, 0, 2.5);
  scene.add(group);

  const light = new THREE.PointLight(WARM, params.intensita, 30, 1.8);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  group.add(light);

  // bulbo in vetro
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xfff2dd,
    roughness: 0.1,
    transparent: true,
    opacity: 0.75,
    emissive: WARM,
    emissiveIntensity: 1.8,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), glassMat);
  bulb.scale.set(1, 1.25, 1);
  group.add(bulb);

  // attacco a vite
  const socket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.065, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0x777770, roughness: 0.4, metalness: 0.9 })
  );
  socket.position.y = 0.17;
  group.add(socket);

  // filo dal soffitto
  const cordMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), cordMat);
  group.add(cord);

  function apply() {
    light.visible = params.accesa;
    light.intensity = params.intensita;
    glassMat.emissiveIntensity = params.accesa ? 1.8 * Math.min(params.intensita / 25, 2) : 0;
    glassMat.opacity = params.accesa ? 0.9 : 0.5;
    group.position.y = params.altezza;
    const cordLen = Math.max(6 - params.altezza, 0.4);
    cord.geometry.dispose();
    cord.geometry = new THREE.CylinderGeometry(0.012, 0.012, cordLen, 6);
    cord.position.y = 0.22 + cordLen / 2;
  }
  apply();

  return { group, params, apply };
}
