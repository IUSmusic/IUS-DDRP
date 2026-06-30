# Hardware architecture

## 1. Reference implementation strategy

The prototype is built in two layers:

1. **bench reference system** using evaluation boards and proven modules
2. **integrated product carrier** after the signal chain, thermal load and software interfaces are validated

This avoids committing to a custom mixed-signal PCB before the clocking, power, latency and acoustic requirements are measured.

## 2. Compute subsystem

### Reference part

**Raspberry Pi Compute Module 5**

Recommended configuration:

- 8 GB RAM
- 32 or 64 GB eMMC
- wireless-disabled variant if a separate certified radio module is used
- 512 GB or 1 TB NVMe SSD
- hardware watchdog
- RTC backup
- full-size HDMI routed through the carrier

The Compute Module performs:

- UI rendering
- media decoding
- recording file management
- project database
- network services
- remote browser interface
- update management
- diagnostics

It does not perform safety muting or the direct-monitor loop.

## 3. Deterministic USB audio bridge

### Reference part

**XMOS XU316 xcore.ai**

Functions:

- USB Audio Class 2 device
- low-latency, bit-accurate transfer
- I2S/TDM connection to the DSP
- S/PDIF transmit and receive
- MIDI
- firmware update endpoint
- optional loopback and mixer channels

The prototype may begin with the XMOS multichannel audio evaluation board. The integrated carrier uses the XU316 after USB descriptors, channel count and clock roles are frozen.

## 4. Real-time DSP

### Reference part

**Analog Devices ADAU1467**

DSP responsibilities:

- input trim
- DC blocking and high-pass filters
- 15-band EQ
- monitor routing
- playback routing
- crossover
- driver protection
- thermal and battery-dependent limiter curves
- speaker delay and polarity
- loudness compensation
- metering
- safe ramp and mute
- room correction hooks

A self-boot image stored in nonvolatile memory allows the DSP to start in a safe local-monitor configuration before Linux is ready.

## 5. Analog input subsystem

### Connectors

- 2 × locking XLR/TRS combo sockets
- balanced line and microphone support
- high-impedance instrument mode through a dedicated input buffer
- separate phantom-power status indicator

### Preamplifier

**THAT1580 + THAT5173** reference architecture

Design targets:

- 0–60 dB digitally controlled gain
- low equivalent input noise
- professional input headroom
- relay-controlled pad and mode switching
- per-channel 48 V phantom power
- 80 Hz analog or DSP high-pass filter
- RF filtering at the connector
- ESD and surge protection
- DC fault detection before the ADC

The phantom supply must be isolated from the low-voltage digital rail and sequenced to prevent pops.

## 6. ADC subsystem

### Reference part

**ESS ES9823PRO**, subject to commercial support and supply approval

Reasons:

- two-channel flagship capture path
- high dynamic-range target
- PCM rates through 192 kHz and above
- suitable for a premium stereo recorder

Prototype alternative:

- a proven professional two-channel ADC evaluation board
- AKM or Cirrus converter with public documentation and stable supply

The ADC board shall include:

- independent low-noise analog and digital regulators
- clock isolation
- differential input stage
- calibration memory
- test points
- shield connection strategy
- no shared high-current return with the speaker amplifier

## 7. DAC subsystem

### Reference part

**AKM AK4191 + AK4499EX**

Reasons:

- separated digital and analog conversion architecture
- premium stereo playback path
- asynchronous clocking support
- suitable for network audio and USB DAC applications

Analog output stage:

- OPA1612-class low-noise I/V and filter stages
- fully balanced routing
- relay mute
- DC detection
- selectable fixed or variable line level
- output protection without series impedance that compromises performance

Prototype alternative:

- AK4499EX evaluation platform
- ESS ES9039Q2M stereo design if supply and technical support are stronger

The final converter decision shall be based on complete board measurements, not brand preference.

## 8. Headphone subsystem

Reference devices:

- TI OPA1622 or INA1620
- relay-selected gain
- 6.35 mm single-ended output
- 4.4 mm balanced output
- output impedance below 1 Ω
- current and thermal protection
- jack detection
- click-free mute
- configurable safe-level limit

Target capability:

- at least 100 mW per channel into 32 Ω
- at least 4 Vrms into 300 Ω
- stretch target of 6 Vrms into 300 Ω in high-gain mode

The two headphone sockets shall not be assumed to support full rated output simultaneously unless validated thermally.

## 9. Speaker amplification

### Reference part

**TI TPA3255**

Recommended first implementation:

- 24–29 V amplifier rail
- stereo bridge-tied-load configuration
- post-filter feedback if the selected reference design is stable and validated
- low-noise input buffer
- hardware mute from the control MCU
- current, temperature and DC-fault monitoring
- shielded output inductors
- LC filter selected for the actual speaker impedance

The built-in speaker target is 2 × 40–60 W continuous, not the device headline maximum from the amplifier data sheet.

Battery mode shall reduce rail voltage or DSP limiter thresholds.

## 10. Internal acoustic system

Baseline arrangement:

- isolated left and right sealed or passive-radiator chambers
- one 3–4 inch long-excursion midwoofer per channel
- one 19–25 mm tweeter per channel
- passive crossover for the first acoustic prototype
- active crossover after driver measurements are complete
- removable baffles
- gasketed drivers
- accelerometer mounting points for cabinet-vibration testing

The earlier “top spatial driver” idea is optional. It shall not enter the baseline design until stereo imaging, enclosure volume and amplifier channel count are validated. Extra drivers must not be added only for appearance.

## 11. Digital and physical I/O

### Required

- 2 × USB 3 host
- 1 × USB-C service/UAC2
- 1 × Gigabit Ethernet
- 1 × full-size HDMI output
- 1 × optical S/PDIF input
- 1 × optical S/PDIF output
- 1 × coaxial S/PDIF input
- 1 × coaxial S/PDIF output
- MIDI input/output
- 2 × balanced analog input
- 2 × balanced analog output
- 6.35 mm headphone
- 4.4 mm balanced headphone

### Optional after licensing review

- HDMI eARC input
- word clock
- ADAT
- passive speaker binding posts

## 12. Display and touch

### Prototype display

10.1-inch Waveshare-class module:

- 1920 × 1200 IPS
- HDMI
- USB touch
- ten-point PCAP
- optical bonding
- toughened cover glass

### Product display requirements

- industrial lifecycle commitment
- custom front glass
- anti-glare and oleophobic coating
- 500 nit standard backlight
- higher-brightness option only if thermal and battery tests pass
- EMI-tested display cable
- isolated backlight converter
- replaceable display assembly
- no visible air gap
- no touch dead zones at the bezel

## 13. Physical controls

Recommended components:

- sealed optical or magnetic main encoder
- ALPS, Bourns or equivalent conductive-plastic EQ faders
- high-cycle tactile transport switches
- separate red record actuator
- haptic motor under the front control deck
- white status LEDs with shaped light pipes
- no colour-only state indication

The 15 EQ channels shall be scanned by the control MCU. Potentiometer or fader values are filtered and rate-limited before being sent to the DSP.

## 14. Wireless subsystem

### Production direction

**NXP IW612-class certified module**

Capabilities:

- 2.4/5 GHz Wi-Fi 6
- Bluetooth/BLE 5.4
- 802.15.4 if future Matter integration is required

Implementation rules:

- use a pre-certified module where possible
- preserve antenna keep-out
- provide a non-metal RF window
- isolate antenna volume from display and amplifier switching nodes
- perform coexistence testing under audio load
- do not claim aptX, LDAC, AirPlay or Google Cast support before licensing and interoperability validation

The first bench prototype can use the Compute Module radio. It is not the final product-radio decision.

## 15. Power architecture

### Input

- certified external 29 V DC adapter
- 200–250 W class for full speaker output and charging
- locking DC connector
- input surge, reverse-polarity and overvoltage protection
- inrush control

### Battery

- 8S LiFePO4
- 25.6 V nominal
- approximately 100–160 Wh
- service-replaceable pack
- pack fuse
- balancing BMS
- temperature sensors at cell groups
- UN38.3 documentation
- shipping mode

### Rails

| Rail | Loads |
|---|---|
| 24–29 V | speaker amplifier |
| 12 V | display and auxiliaries |
| 5 V high current | Compute Module and USB |
| ±15 V | preamps and line stages |
| 5 V / 3.3 V low noise | converters and clocks |
| 3.3 V | DSP, MCU and logic |

Analog rails use dedicated regulators and post-regulation. Switching nodes are kept away from ADC, DAC and clock areas.

### Transfer behaviour

Mains and battery are combined through a monitored ideal-diode power path. The control MCU confirms stable rails before removing mute. A hold-up capacitor covers switching transients. The unit must not reboot during a normal transfer.

## 16. Thermal architecture

- speaker amplifier coupled to the rear or bottom aluminum heat spreader
- Compute Module heat pipe or vapor chamber to the chassis
- converter board kept away from hot amplifier components
- slow, large fan permitted only under sustained high load
- fan remains off in normal listening mode
- separate temperature sensors on compute, amplifier, battery and DAC board
- DSP output limiter reduces heat before emergency shutdown
- no touch surface above 45 °C in the normal ambient test

## 17. Enclosure and materials

### Primary structure

- 6061-T6 CNC-machined front panel
- formed aluminum internal chassis
- anodized or powder-coated finish
- stainless threaded inserts
- serviceable panel construction

### Damping

Aluminum is rigid but has low inherent damping. Use:

- constrained-layer damping on large panels
- butyl or viscoelastic sheets
- isolated speaker chambers
- silicone PCB mounts where needed
- gasketed display and drivers
- asymmetric ribs to break panel modes

### Touch surface

- chemically strengthened aluminosilicate glass
- anti-glare coating
- oleophobic top coat
- bonded directly to the touch sensor and display

### RF section

- glass-filled polycarbonate antenna window
- no carbon-fibre overlay above antennas
- conductive gasket around the RF window boundary
- antenna tuning performed in the final enclosure

### Feet and controls

- silicone or sorbothane-style feet
- machined aluminum knob with tactile reference mark
- replaceable fader caps
- no polished surface in high-touch areas

## 18. PCB partitioning

Recommended boards:

1. compute carrier
2. control and power-management board
3. DSP / XMOS digital-audio board
4. ADC / preamp board
5. DAC / line / headphone board
6. speaker amplifier board
7. front-panel control board
8. display interface board
9. battery pack

High-current amplifier loops, DC/DC converters and radio antennas must remain physically separated from the converter and clock boards.

## 19. Hardware safety functions

Implemented in hardware, not only software:

- speaker mute
- headphone mute
- DC output detection
- amplifier overtemperature response
- battery overcurrent and overtemperature cutoff
- input overvoltage protection
- phantom-power current limiting
- fan fail detection if a fan is fitted
- watchdog reset
- brownout detection
- recording-safe shutdown signal
