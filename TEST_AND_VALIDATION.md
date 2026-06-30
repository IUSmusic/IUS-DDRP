# Test and validation plan

## 1. Test philosophy

All headline claims require repeatable system-level measurements on representative hardware. Component data sheets are design inputs, not product results.

## 2. Audio playback tests

Measure:

- frequency response
- THD+N versus level
- THD+N versus frequency
- dynamic range
- idle noise
- intermodulation distortion
- crosstalk
- channel balance
- jitter sensitivity
- output impedance
- mute transient
- startup and shutdown pop

Conditions:

- 44.1, 48, 96 and 192 kHz
- mains and battery
- wireless on and off
- display minimum and maximum brightness
- speaker amplifier idle and loaded
- line and headphone outputs

## 3. Audio recording tests

Measure:

- input dynamic range
- EIN for microphone mode
- THD+N versus gain
- gain accuracy
- phantom-power noise
- common-mode rejection
- overload recovery
- input impedance
- channel crosstalk
- sample-rate accuracy
- dropped-sample count

Record:

- silence
- full-scale sine
- multitone
- swept sine
- burst
- long-form program material

## 4. Latency tests

### Direct monitor

Method:

- inject electrical pulse or MLS
- capture input and headphone output simultaneously
- calculate sample delay
- repeat at all supported rates

Target: ≤5 ms at 96 kHz.

### Control response

Method:

- trigger physical control with electrical marker
- capture output parameter change
- calculate p50, p95 and maximum

Target: ≤10 ms p95.

### Touch response

Method:

- high-speed camera or instrumented touch
- measure contact to visible update

Target: ≤50 ms p95.

## 5. Clock and digital-interface tests

- 44.1/48 kHz family changes
- S/PDIF lock and loss
- malformed S/PDIF stream
- USB reconnect
- host sleep and wake
- hub connection
- long cable
- USB packet stress
- HDMI hot plug
- eARC interoperability if fitted
- MIDI throughput

No output transient may exceed the safe mute threshold during clock loss.

## 6. Recording endurance

- 8-hour 2-channel recording
- 24-hour playback
- simultaneous recording and UI activity
- simultaneous recording and file export
- low-storage condition
- sudden mains removal
- battery exhaustion
- recorder process restart
- full project recovery

Acceptance:

- zero dropped samples in nominal conditions
- recoverable file after forced shutdown
- clear fault log if storage cannot keep up

## 7. Speaker and acoustic tests

- on-axis frequency response
- horizontal and vertical response
- distortion versus SPL
- maximum linear output
- port or passive-radiator noise
- cabinet vibration
- panel resonances
- limiter behaviour
- thermal compression
- left/right matching
- structure-borne noise at controls
- microphone-input contamination from speakers

Test with the device on wood, glass and a soft desk mat.

## 8. Headphone tests

Loads:

- 16 Ω
- 32 Ω
- 80 Ω
- 300 Ω
- 600 Ω

Measure:

- maximum clean voltage
- maximum current
- THD+N
- output impedance
- channel balance
- mute pop
- thermal rise
- short-circuit response
- plug insertion transient

## 9. Power and battery tests

- mains-to-battery transfer
- battery-to-mains transfer
- full-charge runtime
- reduced-power runtime
- cold battery
- warm battery
- charge while playing
- charge while recording
- cell imbalance
- pack sensor failure
- BMS trip
- adapter overvoltage
- adapter brownout
- inrush current
- shipping mode
- safe forced shutdown

Acceptance:

- no reboot during normal transfer
- no recording corruption
- no exposed surface above temperature limit
- no unsafe restart after BMS trip

## 10. Thermal tests

Ambient:

- 10 °C
- 25 °C
- 35 °C
- 40 °C where component ratings permit

Modes:

- idle
- full display
- playback
- record
- maximum speaker load
- battery charge
- simultaneous charge and load

Record:

- compute temperature
- amplifier temperature
- battery cell temperatures
- DAC board temperature
- enclosure touch temperatures
- fan speed
- limiter action

## 11. Network and wireless tests

- congested 2.4 GHz
- congested 5 GHz
- Ethernet handover
- weak signal
- roaming
- access-point reboot
- DHCP failure
- DNS failure
- internet loss
- local control without internet
- Bluetooth coexistence with Wi-Fi
- RF activity during low-level ADC measurement

Acceptance:

- local playback unaffected by internet loss
- no measurable RF spur above audio target
- remote UI reconnects without reboot

## 12. Accessibility tests

Automated:

- semantic structure
- accessible names
- contrast
- keyboard operation
- focus order
- touch-target size

Human:

- screen-reader setup
- keyboard-only operation
- low-vision high-contrast use
- reduced-motion mode
- physical-control identification
- one-handed operation
- limited-dexterity operation
- spoken feedback
- haptic confirmation

No critical task may require colour recognition or a precise multi-finger gesture.

## 13. Mechanical and reliability tests

- button cycle
- fader cycle
- encoder cycle
- connector insertion
- drop and tip-over for the defined product class
- packaging vibration
- thermal cycling
- humidity storage
- screw retention
- service disassembly
- display-bond inspection
- speaker-gasket leak
- RF-window durability

## 14. EMC and pre-compliance

- conducted emissions
- radiated emissions
- ESD
- EFT
- surge
- RF immunity
- conducted immunity
- harmonic current if applicable
- amplifier-cable emissions
- Wi-Fi/Bluetooth transmit modes
- worst-case display and charging state

Pre-scan before every major board freeze.

## 15. End-of-line production test

Each unit:

- identity and serial
- secure key provision
- rail check
- button/fader scan
- display and touch
- Wi-Fi/Bluetooth
- USB enumeration
- S/PDIF
- microphone preamp gain
- ADC loop
- DAC loop
- headphone output
- speaker output
- battery telemetry
- fault-line test
- short audio sweep
- calibration storage
