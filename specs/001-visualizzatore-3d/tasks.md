# Tasks: Visualizzatore 3D interattivo di oggetti

**Input**: Design documents from `specs/001-visualizzatore-3d/`

## Phase 1: Setup

- [x] T001 Inizializzare progetto Vite con dipendenza three (`package.json`, `index.html`)

## Phase 2: Foundational

- [x] T002 Scena base in `src/main.js`: renderer con ombre e tone mapping, camera, OrbitControls, loop di render, resize
- [x] T003 [P] Pavimenti e sfondi procedurali in `src/floors.js` (erba, garage, parquet)

## Phase 3: User Story 1 — Oggetti (P1) 🎯 MVP

- [x] T004 [P] [US1] Girasoli procedurali in `src/objects/sunflowers.js`
- [x] T005 [P] [US1] Yaris ibrida stilizzata in `src/objects/yaris.js`
- [x] T006 [P] [US1] Orsetto peluche in `src/objects/teddy.js`
- [x] T007 [US1] Selettore oggetto (show/hide) in `src/main.js`

## Phase 4: User Story 2 — Pavimenti (P2)

- [x] T008 [US2] Selettore pavimento con aggiornamento sfondo/nebbia in `src/main.js`

## Phase 5: User Story 3 — Luci (P2)

- [x] T009 [P] [US3] Neon bruciato con flicker/interruzioni parametrizzati in `src/lights/neon.js`
- [x] T010 [P] [US3] Luce ambientale in `src/lights/ambient.js`
- [x] T011 [P] [US3] Lampadina a incandescenza in `src/lights/bulb.js`

## Phase 6: Polish

- [x] T012 Pannello lil-gui in italiano in `src/ui.js` (oggetto, pavimento, tutte le luci con on/off e parametri)
- [x] T013 Verifica visiva combinazioni, console pulita, resize
