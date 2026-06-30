# Product requirements

## 1. Product definition

**Product:** IUS DRRP Desktop  
**Category:** premium desktop recorder, player, monitor controller and local radio platform  
**Baseline channel architecture:** stereo playback, two-channel recording, five-track project workflow  
**Primary environments:** home studio, music room, creative workspace, broadcast preparation and accessible home listening

## 2. Product goals

The system shall:

1. reproduce and capture audio transparently
2. provide a deterministic wired monitoring path
3. remain usable without an internet connection
4. connect to consumer and professional equipment without unusual adapters
5. expose all critical functions through physical controls
6. provide an accessible visual and remote interface
7. continue operation through short mains interruptions
8. be serviceable, modular and thermally quiet
9. provide a credible path from prototype to certified production

## 3. Non-goals for the first hardware release

- replacing a large-format studio console
- five simultaneous microphone preamplifier channels
- zero-latency wireless monitoring
- production support for every proprietary streaming ecosystem at launch
- Dolby Atmos decoding without the required commercial licences
- outdoor weatherproof operation
- battery-first portable use
- user-replaceable mains power electronics

## 4. Audio performance targets

These are system-level targets. Converter data-sheet figures are not accepted as product measurements.

| Parameter | Prototype target | Stretch target |
|---|---:|---:|
| Playback sample rates | 44.1–192 kHz | 44.1–384 kHz |
| Recording sample rates | 44.1–192 kHz | 44.1–192 kHz |
| Stored PCM depth | 24-bit | 24-bit |
| Internal project mix | 32-bit float | 64-bit float where practical |
| Line output dynamic range | ≥120 dB A-weighted | ≥125 dB A-weighted |
| Line output THD+N, 1 kHz | ≤-105 dB | ≤-115 dB |
| Line input dynamic range | ≥118 dB A-weighted | ≥123 dB A-weighted |
| Line crosstalk, 1 kHz | ≤-105 dB | ≤-115 dB |
| Frequency response | 20 Hz–20 kHz, ±0.15 dB | ±0.05 dB |
| Headphone output impedance | <1 Ω | <0.3 Ω |
| Analog monitor latency | ≤5 ms | ≤3 ms |
| Control-to-audio response | ≤10 ms | ≤5 ms |

Audio measurements shall be repeated at 44.1, 48, 96 and 192 kHz, on mains and battery, with the display at minimum and maximum brightness, and with wireless radios active.

## 5. Input requirements

The baseline system shall provide:

- two locking XLR/TRS combo inputs
- microphone, balanced line and high-impedance instrument modes
- digitally controlled gain
- switchable 48 V phantom power per channel
- input pad where required by the final preamplifier headroom
- 80 Hz high-pass filter
- phase invert
- independent input metering
- dry and processed recording choices
- hardware protection against phantom-power switching transients
- clear indication of active phantom power

Input gain shall not jump or click during normal adjustment. Phantom power shall default off after factory reset.

## 6. Output requirements

The baseline system shall provide:

- two balanced XLR or TRS line outputs
- one 6.35 mm single-ended headphone output
- one 4.4 mm balanced headphone output
- optical S/PDIF output
- coaxial S/PDIF output
- USB Audio Class 2 device mode
- internal stereo speakers
- independent speaker, line and headphone mute states
- safe startup and shutdown muting
- configurable maximum headphone level
- optional fixed-level line-output mode

The speaker amplifier shall be muted before any power rail becomes unstable.

## 7. Project and recording requirements

- five visible project tracks
- two simultaneous analog record channels in the baseline system
- bounce, overdub and import to populate additional tracks
- non-destructive edits
- WAV and FLAC recording
- BWF metadata where supported
- automatic project recovery after unexpected power loss
- recording to internal NVMe storage
- export to USB storage and network shares
- configurable pre-record buffer
- dropped-sample detection and logging

## 8. Connectivity requirements

### Wired

- Gigabit Ethernet
- two USB 3 host ports
- one USB-C service/device port
- full-size HDMI output
- optical and coaxial S/PDIF
- MIDI input/output
- two balanced inputs
- two balanced outputs
- headphone outputs
- service/debug connector inside the enclosure

### Wireless

- dual-band Wi-Fi 6 minimum for the product carrier
- Bluetooth 5.4-class radio
- Bluetooth LE Audio capability when the selected certified module and OS stack support it
- NFC or QR-assisted onboarding
- mDNS discovery
- local web control
- no mandatory cloud account

Proprietary protocols must be listed as “planned” until commercial certification has been completed.

## 9. Display and touch requirements

- 10.1-inch class IPS display
- 1920 × 1200 target resolution
- optically bonded PCAP touch
- ten touch points
- anti-glare and oleophobic cover treatment
- 500 nit indoor target
- 800–1,000 nit optional high-brightness SKU
- touch-to-visual response under 50 ms at the 95th percentile
- minimum 60 Hz interface update
- no visible tearing during normal interaction
- glove support only if validated with the chosen touch controller
- brightness control down to a comfortable dark-room level
- display-off mode that leaves transport controls operational

## 10. Physical-control requirements

- large master encoder with push action
- dedicated play, stop, record, previous and next buttons
- mode buttons for Player, Radio and Record
- 15 physical EQ controls
- tactile differentiation between record and transport controls
- high-contrast labels
- no critical function available only through a long press
- debounce and control scanning independent of Linux
- physical controls remain functional during UI restart

## 11. Accessibility requirements

The product shall be usable without relying on colour, touch or hearing alone.

- all web controls keyboard operable
- screen-reader labels for every control
- WCAG 2.2 AA target for the browser interface
- minimum 44 × 44 CSS-pixel touch targets
- high-contrast theme
- scalable text
- reduced-motion mode
- status conveyed by text, shape and sound, not colour alone
- optional spoken feedback
- adjustable haptic feedback
- tactile reference marks on critical controls
- headphone level warnings
- captions or text equivalents for spoken setup guidance
- remote control from a phone, tablet or computer browser
- accessible setup without requiring a visual QR-code scan

Accessibility testing shall include participants with visual, hearing, motor and cognitive access needs.

## 12. Power requirements

- universal external certified AC adapter
- no exposed mains voltage inside user-accessible service areas
- internal continuity battery
- no reboot during normal mains-to-battery transfer
- at least 60 minutes at the defined full-load continuity profile
- at least 4 hours at the reduced-power listening profile
- battery health and cycle count visible in diagnostics
- charge limit option for long-term desktop use
- thermal protection and cell balancing
- shipping mode
- replaceable battery by trained service personnel
- automatic recording finalisation before forced shutdown

## 13. Acoustic requirements

- isolated left and right speaker chambers
- no shared open air volume with the microphone inputs or display
- DSP crossover and excursion protection
- low-frequency limiter based on driver displacement limits
- structure-borne vibration controlled at the display and controls
- fan noise below the room noise floor in normal listening mode
- no audible buzz at 10 cm with no signal and normal gain
- external active monitors remain the reference monitoring path

## 14. Mechanical and material requirements

- aluminum front and structural chassis
- constrained-layer damping on large metal panels
- chemically strengthened cover glass
- RF-transparent antenna window
- replaceable feet
- no sharp edges
- service access with standard tools
- captive or retained internal fasteners where practical
- segregated battery, digital, analog and amplifier volumes
- product mass target: 6–10 kg depending on battery and speaker system
- enclosure temperature below 45 °C at normal touch points

## 15. Reliability requirements

- 24-hour continuous playback without dropout
- 8-hour continuous recording without dropped frames
- 500 power cycles without file-system corruption
- 100,000 operations for primary buttons
- 50,000 turns for the main encoder
- 100,000 travel cycles for EQ faders or the selected equivalent
- battery pack designed for at least 2,000 cycles to 80% capacity under the defined charge profile
- controlled recovery after audio-service or UI-process failure
- watchdogs for compute, DSP and control MCU

## 16. Security and privacy requirements

- unique device credentials
- no universal default password
- signed update packages
- rollback protection
- encrypted remote-control sessions after onboarding
- local account option
- published security-update period
- vulnerability-reporting contact
- microphone access visibly indicated
- recording never uploaded without explicit user action
- factory reset removes user content and credentials
- logs avoid storing audio content or unnecessary personal data

## 17. Acceptance rule

A feature is complete only when:

1. its functional behaviour is implemented
2. its failure state is defined
3. its latency or performance is measured
4. its accessibility path is tested
5. its security impact is reviewed
6. its documentation is updated
