import * as THREE from 'three';

// Campo di vento condiviso: le margherite lo campionano su CPU (matrici
// istanziate), l'erba su GPU (uniforms nel vertex shader). Il tempo è
// accumulato scalato dalla velocità, così cambiarla non fa "saltare" la fase.
export function createWind() {
  const params = {
    intensita: 1.35,
    velocita: 1.5,
    direzione: 35, // gradi
  };

  const dir = new THREE.Vector2(1, 0);

  const uniforms = {
    uWindTime: { value: 0 },
    uWindStrength: { value: params.intensita },
    uWindDir: { value: dir },
  };

  function update(dt) {
    uniforms.uWindTime.value += dt * params.velocita * 1.6;
    uniforms.uWindStrength.value = params.intensita;
    const a = THREE.MathUtils.degToRad(params.direzione);
    dir.set(Math.cos(a), Math.sin(a));
  }

  // sway in [-1, 1]: onda principale + raffica secondaria, in fase spaziale
  // lungo la direzione del vento (le onde attraversano il campo)
  function sway(x, z) {
    const t = uniforms.uWindTime.value;
    const ph = (x * dir.x + z * dir.y) * 1.5;
    return params.intensita * (
      0.7 * Math.sin(t + ph) +
      0.3 * Math.sin(t * 2.33 + ph * 1.7 + 1.0)
    );
  }

  return { params, uniforms, dir, update, sway };
}
