# Reference bill of materials

This is an engineering BOM for prototyping. It is not a production purchase order. Availability, minimum order quantity, lifecycle, certification and supplier authorisation must be checked before design freeze.

## 1. Core compute and control

| Function | Reference selection | Notes |
|---|---|---|
| Application compute | Raspberry Pi Compute Module 5, 8 GB, eMMC | UI, network, storage |
| Storage | 512 GB or 1 TB NVMe | high-endurance model |
| USB audio bridge | XMOS XU316 | UAC2, S/PDIF, MIDI |
| Audio DSP | Analog Devices ADAU1467 | deterministic audio |
| Control MCU | STM32H7-class or equivalent | power and controls |
| Secure element | Microchip ATECC608-class | identity and keys |
| RTC | temperature-compensated RTC | offline timestamps |

## 2. Audio input

| Function | Reference selection | Notes |
|---|---|---|
| Combo sockets | Neutrik XLR/TRS ×2 | locking |
| Mic preamp | THAT1580 ×2 | low-noise analog gain |
| Gain controller | THAT5173 or 5263 | SPI control |
| Phantom supply | isolated 48 V module | per-channel switching |
| ADC | ESS ES9823PRO | supply/support gate |
| Input op-amps | OPA1612-class | filters and line mode |
| Instrument buffer | low-bias FET input stage | 1 MΩ target |
| Protection | TVS, RF filters, relays | connector-level |

## 3. Audio output

| Function | Reference selection | Notes |
|---|---|---|
| Digital modulator | AKM AK4191 | DAC digital stage |
| DAC | AKM AK4499EX | flagship stereo |
| I/V and line stage | TI OPA1612 | balanced output |
| Headphone stage | TI OPA1622 or INA1620 | compare in prototype |
| Line connectors | Neutrik XLR or TRS ×2 | balanced |
| Headphone sockets | 6.35 mm + 4.4 mm | independent detect |
| Mute relays | low-signal sealed relays | pop suppression |
| S/PDIF | optical + 75 Ω coax | input and output |

## 4. DSP and digital I/O

| Function | Reference selection | Notes |
|---|---|---|
| DSP memory | qualified serial flash | self-boot image |
| Audio oscillators | 22.5792/24.576 MHz | low phase noise |
| MIDI | isolated DIN or TRS interface | final connector TBD |
| HDMI output | CM5 carrier interface | full-size connector |
| eARC | licensed receiver module | phase 2 |
| USB hub | industrial USB 3 hub IC | two host ports |

## 5. Wireless and network

| Function | Reference selection | Notes |
|---|---|---|
| Wi-Fi/Bluetooth | NXP IW612 module class | pre-certified preferred |
| Ethernet PHY/magnetics | CM5 carrier reference | Gigabit |
| NFC | NFC Forum-compatible module | onboarding |
| Antennas | dual-band FPC or stamped | tuned in enclosure |
| RF window | glass-filled polycarbonate | no metal coating |

## 6. Display and controls

| Function | Reference selection | Notes |
|---|---|---|
| Prototype display | 10.1-inch 1920×1200 optically bonded IPS | HDMI + USB touch |
| Product display | industrial 10.1-inch PCAP | lifecycle agreement |
| Cover glass | strengthened aluminosilicate | anti-glare, oleophobic |
| Master encoder | sealed optical/magnetic | push action |
| EQ controls | 15 conductive-plastic faders | 100k cycle target |
| Transport buttons | high-cycle tactile switches | differentiated caps |
| Haptic motor | linear resonant actuator | adjustable feedback |
| Status lighting | white LEDs + shaped light pipes | no colour-only state |

## 7. Speaker system

| Function | Reference selection | Notes |
|---|---|---|
| Speaker amplifier | TI TPA3255 | 24–29 V |
| Midwoofers | 3–4 inch low-distortion ×2 | final after Klippel tests |
| Tweeters | 19–25 mm ×2 | matched pair |
| Crossover | passive mule, active product | measured design |
| Chambers | sealed or passive-radiator L/R | isolated |
| Damping | acoustic felt and foam | measured placement |
| Cabinet sensors | temperature, optional accelerometer | validation |

No driver model is frozen until enclosure volume and acoustic measurements are complete.

## 8. Power

| Function | Reference selection | Notes |
|---|---|---|
| External supply | certified 29 V, 200–250 W | market-specific cord |
| Battery | 8S LiFePO4, 100–160 Wh | service replaceable |
| BMS | balancing smart BMS | telemetry and ship mode |
| Power-path control | ideal-diode controller | no-reboot transfer |
| 5 V converter | 5 V, ≥5 A synchronous buck | CM5 and USB |
| 12 V converter | low-noise buck | display |
| Analog rails | isolated/buck + linear post-regulation | ±15 V |
| Converter rails | ultralow-noise LDOs | ADC, DAC, clocks |
| Protection | fuse, TVS, OVP, inrush | hardware |

## 9. Mechanical

| Function | Reference selection | Notes |
|---|---|---|
| Front panel | CNC 6061-T6 aluminum | anodized |
| Internal frame | formed aluminum | bonded ground points |
| Rear heat spreader | aluminum | amp coupling |
| Damping | viscoelastic constrained-layer sheets | large panels |
| Feet | silicone / vibration isolating | replaceable |
| Fasteners | stainless machine screws | thread inserts |
| Gaskets | silicone and closed-cell foam | display and drivers |

## 10. Prototype alternates

Use alternates when they reduce risk:

- AK4499EX evaluation board before custom DAC board
- XMOS multichannel audio board before custom XU316 carrier
- ADAU1467 evaluation board before custom DSP board
- certified TPA3255 amplifier module for the acoustic mule
- CM5 IO board for software development
- Compute Module built-in radio for early networking
- off-the-shelf 10.1-inch bonded touch display
- laboratory DC supply before battery integration

## 11. Procurement gates

Before EVT freeze:

- authorised distributor confirmed
- active lifecycle status
- 24-month forecast availability
- second-source or redesign plan
- data sheets and reference designs available
- no hidden production-only licence blocker
- thermal model complete
- compliance certificates collected for modules
- counterfeit-risk controls defined
