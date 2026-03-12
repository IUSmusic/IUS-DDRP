# Builders plan

## Objective

Move the project from a concept-page repo into a buildable path with a clear split between:

1. **front-end demo**
2. **embedded audio engine**
3. **hardware platform**
4. **productisation constraints**

## Phase 1 — repo / demo readiness

### Done in this repo refresh
- working static front-end demo
- 15-band EQ sliders
- technically grounded EQ response graph
- Player / Radio / Record state machine
- 5-track monitoring overlay
- routing visibility for playback / radio / monitor
- docs expanded beyond concept notes

### Still required
- design token cleanup
- state persistence
- measured latency target document
- browser/device regression pass
- hardware control event schema

## Phase 2 — embedded software MVP

### Recommended stack
- Linux-based embedded target
- dedicated audio engine process
- UI process separated from audio engine
- GPIO / control service for physical controls
- project state persisted locally

### Audio engine responsibilities
- device I/O
- playback transport
- record arm / monitor / commit flow
- EQ coefficient generation
- per-path routing
- multitrack monitoring state
- project file management

### Suggested implementation notes
- keep UI and audio threads separate
- treat browser UI as a view, not the audio engine
- use stable low-latency audio infrastructure on Linux
- target predictable buffers before adding advanced DSP

## Phase 3 — hardware path

### Baseline concept path
- Pi-class compute
- dedicated DAC / ADC audio path
- line in / out
- headphone / monitor output
- side speakers + top spatial drivers
- offline FM / DAB input path
- mains power with backup continuity

### Better builder path
- Compute Module class carrier-board design
- single coherent audio architecture
- avoid a design that depends on stacking unrelated audio soundcards
- choose one plan for:
  - stereo-only product
  - or multichannel internal speaker product

### If stereo-first
Use:
- stereo DAC / ADC
- separate headphone amp
- stereo line out
- optional digital sync daughterboard

### If multichannel speaker-first
Use:
- multichannel DAC or DSP amp path
- dedicated stereo capture path
- separate headphone / monitor stage
- integrated digital sync path from the start

## Phase 4 — speaker / amp / acoustics

### Required decisions
- exact driver count
- exact amplifier channel count
- whether top drivers are independent channels or derived ambience channels
- enclosure volume and venting plan
- heat / PSU / acoustic isolation constraints

### Recommended rule
Do not market a branded surround format unless the shipping hardware / software / licensing path actually supports it.

## Phase 5 — power / compliance

### Power system goals
- continuous mains operation
- no-reboot continuity on power interruption
- safe battery charging and switchover
- thermally stable behaviour under playback + record + display load

### Must-track risks
- battery transport / certification requirements
- EMC / RF noise from radio and switching stages
- amplifier heat under sustained output
- storage integrity on sudden power loss

## Core feature mapping

| Feature | UI / firmware responsibility | Hardware responsibility |
|---|---|---|
| 15-band EQ | coefficient generation, routing, graph state | physical sliders / scan electronics |
| Player mode | local playback engine | storage + audio output path |
| Radio mode | tuner state + station handling | FM / DAB frontend |
| Record mode | arm / monitor / commit | input stage + ADC path |
| 5-track overlay | track state, meters, grouping | optional LED / physical feedback |
| Headphones / monitor out | gain staging, mute logic | dedicated analogue output stage |
| Side + top speakers | crossover / spatial logic | drivers, amps, enclosure |
| Backup battery | safe shutdown / state save | power board + battery pack |

## Immediate next build steps

1. keep this repo as the UI truth source
2. define the embedded state/event schema
3. choose stereo-first vs multichannel-first hardware
4. pick the actual power architecture
5. prototype one audio engine path end-to-end before expanding the hardware

## Repo acceptance target

This repo is considered **builder-ready for the next stage** when:

- the UI model is stable
- the EQ spec is frozen
- the routing matrix is frozen
- the hardware direction is no longer ambiguous
- the audio engine can be specified against these documents
