# Prototype plan

## 1. Development approach

The project progresses through measurable engineering gates. Enclosure styling does not precede signal-chain and thermal validation.

## 2. Phase P0 — architecture freeze

### Work

- confirm stereo-first scope
- confirm two analog inputs
- define direct-monitor latency
- select display size
- define battery energy
- define mandatory and optional protocols
- establish compliance markets
- create interface control documents

### Exit criteria

- approved system block diagram
- approved latency budget
- approved power budget
- top ten risks assigned
- no unresolved contradiction between speaker power and battery runtime

## 3. Phase P1 — audio bench

### Hardware

- XMOS XU316 evaluation platform
- ADAU1467 evaluation board
- reference ADC board
- reference DAC board
- THAT preamp evaluation circuit
- headphone stage prototypes
- laboratory supply

### Work

- validate USB audio
- validate 44.1 and 48 kHz clock families
- implement direct monitor
- implement 15-band EQ
- measure analog latency
- measure noise and THD+N
- test mute and power sequencing
- test dry and printed recording

### Exit criteria

- ≤5 ms direct-monitor latency
- no audible clicks during gain and EQ adjustment
- 8-hour recording without dropped samples
- stable clock switching
- system measurements within 3 dB of prototype targets

## 4. Phase P2 — software and UI mule

### Hardware

- CM5 IO board
- prototype bonded display
- control-MCU board
- physical control panel
- bench audio system

### Work

- integrate project service
- add local web interface
- add accessibility paths
- add control state confirmation
- add update mechanism
- add self-contained diagnostics
- test UI restart without audio interruption

### Exit criteria

- cold boot to basic monitor ≤3 seconds
- UI ready ≤15 seconds
- touch response ≤50 ms p95
- all critical functions keyboard and physical-control accessible
- UI restart does not interrupt direct monitor

## 5. Phase P3 — acoustic mule

### Hardware

- temporary wood or printed chambers
- selected midwoofers and tweeters
- TPA3255 reference amplifier
- measurement microphone
- accelerometers

### Work

- select chamber volume
- measure driver distortion and excursion
- tune crossover
- tune limiter
- compare sealed and passive-radiator options
- measure cabinet vibration
- define amplifier power limit

### Exit criteria

- no audible panel resonance at normal listening level
- thermal limiter validated
- target response achieved with reproducible build
- driver protection survives abuse test
- battery-mode speaker profile defined

## 6. Phase P4 — integrated alpha

### Work

- first custom carrier boards
- first aluminum enclosure
- first integrated battery
- first internal speaker system
- RF antenna tuning
- thermal soak
- EMC pre-scan
- service procedure trial

### Exit criteria

- no-reboot power transfer
- all ports functional
- no RF interference in ADC or DAC measurements
- normal-mode fan off
- enclosure touch temperature within target
- 24-hour playback soak
- 8-hour record soak
- battery fault handling validated

## 7. EVT — engineering validation test

### Deliverables

- board revision A
- enclosure revision A
- manufacturing drawings
- test firmware
- calibration procedure
- preliminary compliance file
- risk register
- engineering BOM

### Gate

The design is electrically and mechanically functional. Remaining issues are documented and bounded.

## 8. DVT — design validation test

### Deliverables

- board revision B
- near-final tooling
- final display and battery sources
- full acoustic tuning
- accessibility report
- EMC, radio and safety pre-compliance
- protocol interoperability results
- reliability test results

### Gate

The product meets its written requirements across representative units.

## 9. PVT — production validation test

### Deliverables

- pilot production line
- assembly instructions
- incoming inspection
- end-of-line audio test
- battery traceability
- firmware provisioning
- serialisation
- packaging validation
- service parts

### Gate

The factory can repeatedly build and test conforming units.

## 10. Work packages

### Audio

- converter boards
- clocking
- preamps
- headphone stage
- line output
- DSP
- amplifier

### Compute and software

- CM5 carrier
- Linux image
- UI
- recorder
- project format
- update system

### Controls

- MCU firmware
- faders
- encoder
- haptic feedback
- status lighting

### Mechanical

- display bonding
- aluminum structure
- speaker chambers
- thermal design
- RF window

### Power

- adapter
- charger
- BMS
- no-reboot transfer
- rail sequencing

### Compliance

- standards map
- pre-scan
- radio
- battery transport
- product security
- accessibility

## 11. Top risks

| Risk | Impact | Mitigation |
|---|---|---|
| Converter supply or NDA barrier | redesign | qualify alternate early |
| eARC licensing complexity | schedule | keep optical baseline |
| metal enclosure blocks RF | connectivity | dedicated RF window |
| speaker vibration reaches controls | quality | isolated chambers |
| battery and amp heat combine | safety | power profiles and partition |
| Linux dropouts | recording | XMOS bridge and bounded writer |
| proprietary streaming approval | feature delay | standards-based baseline |
| touch panel lifecycle | redesign | industrial supply agreement |
| 15 faders consume panel area | enclosure growth | test control ergonomics early |
| high brightness drains battery | runtime | standard and bright SKUs |

## 12. Prototype evidence required

A design decision is not closed by a render or data sheet. Required evidence includes:

- Audio Precision or equivalent measurement
- oscilloscope latency capture
- thermal images
- battery discharge logs
- RF throughput and coexistence results
- vibration measurements
- accessibility test notes
- service disassembly trial
- EMC pre-scan report
