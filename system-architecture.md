# System architecture

## Top-level architecture

```mermaid
flowchart LR
  PSU[Mains PSU + continuity battery] --> PMIC[Power management]
  PMIC --> HOST[Main compute]
  CTRL[Buttons / encoder / EQ scan] --> HOST
  HOST --> UI[Display UI]
  HOST --> ENGINE[Audio engine]
  STORAGE[Local media / projects] --> ENGINE
  RADIO[FM / DAB frontend] --> ENGINE
  LINEIN[Line input] --> ENGINE
  SPDIFIN[S/PDIF input target] --> ENGINE
  ENGINE --> ROUTE[Routing matrix]
  ROUTE --> EQ[15-band EQ]
  EQ --> OUT[Output matrix]
  OUT --> HP[Headphones / monitor out]
  OUT --> LINEOUT[Line out]
  OUT --> SPDIFOUT[S/PDIF output target]
  OUT --> SPK[Speaker amp + side/top drivers]
```

## Functional modes

### 1. Player
- local library playback
- EQ graph shown by default
- transport and preset access
- 5-track overlay available for grouped playback / monitoring view

### 2. Radio
- offline radio path
- station view + scanning controls
- EQ may be applied if radio routing is enabled

### 3. Record
- line / radio capture path
- monitor bus remains visible
- record policy can be dry + metadata or printed EQ

### 4. Mixer / overlay view
- shows 5 visible tracks
- appears during EQ interaction or direct track-toggle action

## Control architecture

- UI layer = visual state + user intent
- control layer = physical input decoding / debouncing / event dispatch
- audio engine = timing, routing, EQ, transport, capture
- project state = saved locally for offline-first behaviour

## MVP rule

Do not mix the UI prototype and the future audio engine into one undefined layer.  
The repo now treats the UI as a front-end truth source and the future embedded audio engine as a separate responsibility.
