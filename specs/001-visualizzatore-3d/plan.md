# Implementation Plan: Visualizzatore 3D interattivo di oggetti

**Input**: `specs/001-visualizzatore-3d/spec.md`

## Technical Context

- **Stack**: Vite 6 + three.js (ultima release), JavaScript ES modules, nessun framework UI.
- **Pannello controlli**: `lil-gui` (bundled negli addons di three: `three/addons/libs/lil-gui.module.min.js`).
- **Camera/interazione**: `OrbitControls`.
- **Neon**: `RectAreaLight` (richiede `RectAreaLightUniformsLib.init()`) + mesh a capsula emissiva; sfarfallio gestito da una macchina a stati temporale nel loop di render (buzz continuo + burst di interruzioni casuali). I parametri GUI pilotano intensità, dimensioni (ricostruzione geometria) e distribuzione delle interruzioni.
- **Lampadina**: `PointLight` calda (~2700K) con ombre + mesh bulbo/filamento emissivo appesa a un filo.
- **Ambientale**: `AmbientLight` (+ leggera `HemisphereLight` opzionale inclusa nel controllo).
- **Pavimenti**: texture generate con canvas 2D (erba: noise verde con fili d'erba; garage: cemento con macchie e riga gialla; parquet: doghe di legno con venature). Ogni preset imposta anche colore sfondo/nebbia.
- **Modelli procedurali**: gruppi di primitive three.js (Sphere/Capsule/Cylinder/Extrude/Lathe) con `MeshStandardMaterial`.
- **Ombre**: `PCFSoftShadowMap`; la RectAreaLight non proietta ombre → il neon è affiancato da una piccola SpotLight sincronizzata per le ombre.
- **Tone mapping**: `ACESFilmicToneMapping`, esposizione minima per l'edge case "tutte le luci spente".

## Project Structure

```
objects3D/
├── index.html
├── package.json
├── specs/001-visualizzatore-3d/{spec,plan,tasks}.md
└── src/
    ├── main.js            # bootstrap: renderer, camera, loop, resize, orchestrazione
    ├── ui.js              # pannello lil-gui in italiano
    ├── floors.js          # texture procedurali + preset pavimento/sfondo
    ├── lights/
    │   ├── neon.js        # tubo neon + RectAreaLight + spot ombre + flicker
    │   ├── ambient.js     # luce ambientale
    │   └── bulb.js        # lampadina a incandescenza
    └── objects/
        ├── sunflowers.js  # cespo di girasoli
        ├── yaris.js       # Yaris ibrida stilizzata
        └── teddy.js       # orsetto peluche
```

## Decisions & Trade-offs

1. **RectAreaLight vs PointLight per il neon**: RectAreaLight dà la caratteristica luce "a lama" del tubo, ma non proietta ombre; si aggiunge una SpotLight debole co-locata e sincronizzata con lo stato di flicker per non perdere le ombre.
2. **Ricostruzione geometria neon al variare delle dimensioni**: le geometrie vengono ricreate e le vecchie `dispose()`-ate; costo trascurabile perché avviene solo su input utente.
3. **Texture canvas vs immagini**: canvas mantiene il progetto autocontenuto (FR-003) e pesa zero sul repo; risoluzione 512–1024px con `RepeatWrapping`.
4. **Un solo oggetto visibile alla volta**: gli oggetti vengono costruiti una volta (lazy) e mostrati/nascosti via `visible`, evitando ricostruzioni.

## Verification

- Avvio `npm run dev`, ispezione visiva delle 3×3 combinazioni oggetto/pavimento e dei controlli luce.
- Controllo console browser senza errori; resize della finestra.
