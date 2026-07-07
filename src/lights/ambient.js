import * as THREE from 'three';

export function createAmbient(scene) {
  const params = {
    accesa: true,
    intensita: 0.4,
    colore: '#b8c4d0',
  };

  const ambient = new THREE.AmbientLight(params.colore, params.intensita);
  const hemi = new THREE.HemisphereLight(0x8899aa, 0x443322, params.intensita * 0.5);
  scene.add(ambient, hemi);

  function apply() {
    ambient.visible = hemi.visible = params.accesa;
    ambient.intensity = params.intensita;
    hemi.intensity = params.intensita * 0.5;
    ambient.color.set(params.colore);
  }

  return { params, apply };
}
