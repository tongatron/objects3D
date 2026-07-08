import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { FLOOR_PRESETS } from './floors.js';

export function createUI({ state, setObject, setFloor, neon, ambient, bulb, insects, setVista, wind, daisies, roses, grass, monster, share }) {
  const gui = new GUI({ title: 'Impostazioni' });

  // --- condivisione ---
  const shareBtn = gui.add({
    async copia() {
      const ok = await share.copyLink();
      shareBtn.name(ok ? 'Link copiato ✓' : 'Copia fallita — URL aggiornato');
      setTimeout(() => shareBtn.name('Copia link impostazioni'), 2000);
    },
  }, 'copia').name('Copia link impostazioni');

  // --- scena ---
  gui.add(state, 'oggetto', ['Girasoli', 'Campo di margherite', 'Campo di rose rosse', 'Orsetto peluche'])
    .name('Oggetto')
    .onChange(setObject);

  gui.add(state, 'pavimento', Object.keys(FLOOR_PRESETS))
    .name('Pavimento')
    .onChange(setFloor);

  const vistaCtrl = gui.add(state, 'vista', ['Orbitale', 'Occhi di insetto'])
    .name('Vista')
    .onChange(setVista);
  // se le falene spariscono, la vista torna orbitale: tieni il menu allineato
  setInterval(() => vistaCtrl.updateDisplay(), 500);

  // --- margherite ---
  const daisyFolder = gui.addFolder('Margherite');
  daisyFolder.add(daisies.params, 'densita', 10, 300, 5).name('Densità (piante)')
    .onFinishChange(() => daisies.rebuild());

  // --- rose ---
  const roseFolder = gui.addFolder('Rose rosse');
  roseFolder.add(roses.params, 'densita', 10, 300, 5).name('Densità (piante)')
    .onFinishChange(() => roses.rebuild());

  // --- vento ---
  const windFolder = gui.addFolder('Vento');
  windFolder.add(wind.params, 'intensita', 0, 2, 0.05).name('Intensità');
  windFolder.add(wind.params, 'velocita', 0.1, 3, 0.05).name('Velocità');
  windFolder.add(wind.params, 'direzione', 0, 360, 5).name('Direzione (°)');

  // --- erba ---
  const grassFolder = gui.addFolder('Erba');
  grassFolder.add(grass.params, 'altezza', 0.2, 3, 0.05).name('Altezza').onChange(grass.apply);

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

  // --- mostriciattolo ---
  const monsterFolder = gui.addFolder('Mostriciattolo');
  monsterFolder.add(monster.params, 'attivo').name('Attivo');
  monsterFolder.add(monster.params, 'velocita', 0.2, 4, 0.05).name('Velocità');
  monsterFolder.add(monster.params, 'cambiDirezione', 0, 3, 0.05).name('Cambi di direzione');

  // --- insetti ---
  const insectFolder = gui.addFolder('Insetti (falene)');
  insectFolder.add(insects.params, 'attivi').name('Attivi');
  insectFolder.add(insects.params, 'numero', 0, 40, 1).name('Numero')
    .onChange((n) => insects.setCount(n));
  insectFolder.add(insects.params, 'velocita', 0.2, 3, 0.05).name('Velocità');
  insectFolder.add(insects.params, 'attrazione', 0, 3, 0.05).name('Attrazione alle luci');

  // --- pannello nascosto di default, apribile con l'icona ingranaggio ---
  const panel = gui.domElement;
  panel.style.display = 'none';

  // icona impostazioni (ingranaggio), gradevole anche da mobile
  const btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Impostazioni');
  btn.title = 'Impostazioni';
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  Object.assign(btn.style, {
    position: 'fixed',
    top: 'max(12px, env(safe-area-inset-top))',
    right: 'max(12px, env(safe-area-inset-right))',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(20,20,20,0.6)',
    color: '#fff',
    cursor: 'pointer',
    zIndex: '1000',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
    touchAction: 'manipulation',
  });

  function setOpen(open) {
    panel.style.display = open ? '' : 'none';
    btn.style.display = open ? 'none' : 'flex';
  }
  btn.addEventListener('click', () => setOpen(true));

  // pulsante di chiusura nella barra del titolo del pannello
  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Chiudi');
  closeBtn.title = 'Chiudi';
  closeBtn.textContent = '✕';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '34px',
    height: '34px',
    lineHeight: '34px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    zIndex: '2',
  });
  closeBtn.addEventListener('click', () => setOpen(false));
  panel.appendChild(closeBtn);

  document.body.appendChild(btn);

  return gui;
}
