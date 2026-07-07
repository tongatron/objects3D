# Feature Specification: Visualizzatore 3D interattivo di oggetti

**Feature Branch**: `001-visualizzatore-3d`

**Created**: 2026-07-07

**Status**: Approved

**Input**: User description: "Pagina con vista interattiva di oggetti 3D (girasoli, Yaris ibrida ultimo modello, orsetto peluche) con variabili di sfondo/pavimento (terra erbosa, garage, parquet) e illuminazione (neon bruciato con interruzioni, luce ambientale, lampadina a incandescenza)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizzare un oggetto 3D e ruotarlo (Priority: P1)

L'utente apre la pagina, vede un oggetto 3D al centro della scena e può ruotare/zoomare la vista con il mouse. Può scegliere quale oggetto visualizzare tra girasoli, Yaris ibrida e orsetto peluche.

**Why this priority**: è il nucleo del prodotto: senza vista interattiva e selezione oggetto non c'è valore.

**Independent Test**: aprire la pagina, verificare che un oggetto sia visibile, trascinare per orbitare, usare la rotella per zoomare, cambiare oggetto dal pannello e verificare che la scena si aggiorni.

**Acceptance Scenarios**:

1. **Given** la pagina caricata, **When** l'utente trascina con il mouse, **Then** la camera orbita attorno all'oggetto.
2. **Given** la pagina caricata, **When** l'utente seleziona "Yaris ibrida" dal pannello, **Then** l'oggetto corrente viene sostituito dal modello dell'auto.

### User Story 2 - Cambiare pavimento/ambiente (Priority: P2)

L'utente sceglie il pavimento su cui poggia l'oggetto: terra erbosa, garage o parquet. Il cambio aggiorna anche l'atmosfera dello sfondo per coerenza.

**Why this priority**: dà contesto agli oggetti ma dipende dalla scena base (US1).

**Independent Test**: selezionare ciascun pavimento dal pannello e verificare che texture del suolo e sfondo cambino.

**Acceptance Scenarios**:

1. **Given** un oggetto visibile, **When** l'utente seleziona "Garage", **Then** il pavimento diventa cemento da garage con segnaletica e lo sfondo si adegua.

### User Story 3 - Controllare le luci (Priority: P2)

L'utente attiva/disattiva e regola tre sorgenti: un neon bruciato che sfarfalla con interruzioni (con controlli per intensità, dimensioni del tubo e frequenza/durata delle interruzioni), una luce ambientale e una lampadina a incandescenza.

**Why this priority**: è la parte "sperimentale" della pagina; richiede la scena base.

**Independent Test**: per ogni luce, usare il pannello per accenderla/spegnerla e variarne i parametri, osservando l'effetto su oggetto e ombre.

**Acceptance Scenarios**:

1. **Given** il neon attivo, **When** l'utente aumenta la frequenza delle interruzioni, **Then** il neon si spegne/riaccende più spesso, con il tubo emissivo sincronizzato alla luce emessa.
2. **Given** il neon attivo, **When** l'utente modifica la lunghezza del tubo, **Then** la mesh del neon e l'area luminosa si ridimensionano.
3. **Given** la lampadina attiva, **When** l'utente ne aumenta l'intensità, **Then** la scena si illumina con tonalità calda e le ombre si intensificano.

### Edge Cases

- Tutte le luci spente: la scena resta navigabile (oggetto in silhouette, non nero assoluto grazie a un minimo di esposizione).
- Neon con interruzioni al massimo: lo sfarfallio non deve bloccare il rendering né superare frequenze fastidiose (>15 Hz medi).
- Ridimensionamento della finestra: canvas e camera si adattano.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Il sistema DEVE mostrare una scena 3D con controlli orbit (rotazione, zoom, pan).
- **FR-002**: L'utente DEVE poter selezionare uno tra tre oggetti: girasoli, Yaris ibrida stilizzata, orsetto peluche.
- **FR-003**: I modelli DEVONO essere generati proceduralmente in codice (nessun asset esterno da scaricare).
- **FR-004**: L'utente DEVE poter selezionare uno tra tre pavimenti: terra erbosa, garage, parquet; le texture sono generate proceduralmente.
- **FR-005**: Il sistema DEVE fornire una luce neon "bruciata" con sfarfallio e interruzioni casuali, con parametri regolabili: intensità, lunghezza e larghezza del tubo, frequenza e durata delle interruzioni.
- **FR-006**: Il sistema DEVE fornire una luce ambientale con intensità regolabile.
- **FR-007**: Il sistema DEVE fornire una lampadina a incandescenza (luce puntuale calda con mesh del bulbo) con intensità regolabile.
- **FR-008**: Ogni luce DEVE poter essere attivata/disattivata indipendentemente.
- **FR-009**: Gli oggetti DEVONO proiettare e ricevere ombre dalle luci direzionabili.
- **FR-010**: L'interfaccia dei controlli DEVE essere in italiano.

### Key Entities

- **Oggetto**: modello procedurale selezionabile; uno solo visibile alla volta.
- **Pavimento**: piano con texture procedurale + colore di sfondo/nebbia associato.
- **Luce**: sorgente con stato on/off e parametri propri; il neon ha anche uno stato temporale di sfarfallio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La pagina è utilizzabile entro 2 secondi dal caricamento su hardware desktop recente.
- **SC-002**: Il rendering mantiene ≥30 fps con qualunque combinazione di oggetto/pavimento/luci.
- **SC-003**: Ogni combinazione oggetto × pavimento × luci è raggiungibile in ≤3 interazioni dal pannello.

## Assumptions

- Target: browser desktop moderni con WebGL2; mobile fuori scope per v1.
- Estetica stilizzata/low-poly accettata (confermata dall'utente): la Yaris è una rappresentazione riconoscibile, non fotorealistica.
- Stack confermato dall'utente: Vite + three.js, modelli procedurali.
- Nessuna persistenza delle impostazioni richiesta.
