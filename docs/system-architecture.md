# System architecture

```mermaid
flowchart LR
    PSU[Mains PSU] --> PMIC[Power management
+ backup battery]
    PMIC --> PI[Raspberry Pi 4]
    PI --> HIFI[HiFiBerry DAC+ ADC HAT]
    HIFI --> AMP[Speaker / headphone amplifier stage]
    AMP --> SPK[Side speakers + top-firing spatial drivers]
    HIFI --> HP[Headphones out]
    HIFI --> LO[Line out]
    LI[Line in] --> HIFI
    XLR[XLR input concept] --> HIFI
    SD[microSD / USB library] --> PI
    TUNER[FM / DAB tuner module] --> HIFI
    UI[Buttons / knob / 15-band EQ] --> PI
    OLED[Main display system] <-- PI
```

## Functional modes

1. **Player** — local playback, EQ graph view, transport control.
2. **Radio** — offline FM/DAB tuner mode.
3. **Record** — line or radio source recording with monitoring.
4. **Mixer view** — on-demand 5-track DAW-style overview triggered by slider activity.
