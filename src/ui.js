import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { FLOOR_PRESETS } from './floors.js';

export function createUI({ state, setObject, setFloor, neon, ambient, bulb, insects }) {
  const gui = new GUI({ title: 'Controlli scena' });

  // --- scena ---
  gui.add(state, 'oggetto', ['Girasoli', 'Orsetto peluche'])
    .name('Oggetto')
    .onChange(setObject);

  gui.add(state, 'pavimento', Object.keys(FLOOR_PRESETS))
    .name('Pavimento')
    .onChange(setFloor);

  // --- neon bruciato ---
  const neonFolder = gui.addFolder('Neon bruciato');
  neonFolder.add(neon.params, 'acceso').name('Acceso');
  neonFolder.add(neon.params, 'intensita', 0, 40, 0.5).name('Intensità');
  neonFolder.add(neon.params, 'lunghezza', 0.5, 6, 0.1).name('Lunghezza tubo (m)')
    .onChange(() => neon.rebuildTube());
  neonFolder.add(neon.params, 'diametro', 0.02, 0.2, 0.005).name('Diametro tubo (m)')
    .onChange(() => neon.rebuildTube());
  neonFolder.add(neon.params, 'frequenzaInterruzioni', 0, 4, 0.05).name('Frequenza interruzioni');
  neonFolder.add(neon.params, 'durataInterruzioni', 0.05, 2, 0.05).name('Durata interruzioni (s)');

  // --- luce ambientale ---
  const ambFolder = gui.addFolder('Luce ambientale');
  ambFolder.add(ambient.params, 'accesa').name('Accesa').onChange(ambient.apply);
  ambFolder.add(ambient.params, 'intensita', 0, 2, 0.01).name('Intensità').onChange(ambient.apply);
  ambFolder.addColor(ambient.params, 'colore').name('Colore').onChange(ambient.apply);

  // --- lampadina a incandescenza ---
  const bulbFolder = gui.addFolder('Lampadina incandescenza');
  bulbFolder.add(bulb.params, 'accesa').name('Accesa').onChange(bulb.apply);
  bulbFolder.add(bulb.params, 'intensita', 0, 100, 1).name('Intensità').onChange(bulb.apply);
  bulbFolder.add(bulb.params, 'altezza', 1.0, 5, 0.1).name('Altezza (m)').onChange(bulb.apply);

  // --- insetti ---
  const insectFolder = gui.addFolder('Insetti (falene)');
  insectFolder.add(insects.params, 'attivi').name('Attivi');
  insectFolder.add(insects.params, 'numero', 0, 40, 1).name('Numero')
    .onChange((n) => insects.setCount(n));
  insectFolder.add(insects.params, 'velocita', 0.2, 3, 0.05).name('Velocità');
  insectFolder.add(insects.params, 'attrazione', 0, 3, 0.05).name('Attrazione alle luci');

  return gui;
}
