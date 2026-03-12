# Revised BOM — IUS DRRP Desktop

## BOM philosophy

The original BOM was a concept list.  
This revision separates:

1. **baseline concept path**
2. **builder-friendly path**
3. **items that still need a final decision**

---

## A. Compute

| Item | Baseline concept | Builder recommendation | Purpose |
|---|---|---|---|
| Compute platform | Raspberry Pi 4 class | Compute Module class carrier path preferred for product build | UI, state logic, local playback / record |
| Storage | microSD | eMMC or high-quality system storage + removable media for content | OS, projects, media |
| UI output | DSI / HDMI display path | native display path on carrier | main visual interface |

## B. Audio

| Item | Baseline concept | Builder recommendation | Purpose |
|---|---|---|---|
| DAC / ADC | stereo DAC + ADC path | single coherent audio architecture | playback / capture |
| Headphone stage | dedicated low-noise amp | dedicated monitor-grade output | phones / monitoring |
| Line output | stereo line out | fixed or switchable stereo line out | external monitors |
| Line input | stereo line in | shielded line-level input stage | capture |
| Digital sync | concept only | S/PDIF in / out recommended if required | digital source / sync path |
| Internal speakers | side speakers + top drivers | final driver count must match channel architecture | standalone playback |

## C. Amplification

| Item | Recommendation | Notes |
|---|---|---|
| Speaker amp | class-D path sized to real driver load | should match final channel count |
| Headphone amp | low-noise dedicated stage | keep separate from speaker power stage |
| Monitor output stage | dedicated, predictable output level | avoid consumer-only output behaviour |

## D. Controls

| Item | Recommendation | Notes |
|---|---|---|
| Main encoder | push encoder or equivalent | volume / navigation / selection |
| Transport controls | tactile buttons | play, stop, record, mode control |
| 15-band EQ | slider array + scan electronics | direct manual interaction |
| Secondary controls | mode buttons and quick switches | keep core functions accessible without menus |

## E. Radio

| Item | Recommendation | Notes |
|---|---|---|
| Tuner | region-appropriate FM / DAB path | must be selected based on certification and market |
| Antenna path | isolated from noisy digital / amp sections | critical for a usable radio mode |

## F. Power

| Item | Recommendation | Notes |
|---|---|---|
| Primary power | mains PSU | continuous desktop operation |
| Backup battery | internal continuity pack | goal is no-reboot switchover |
| Power management | charge / protect / switch / regulate | must protect storage and audio stability |

## G. Display

| Item | Recommendation | Notes |
|---|---|---|
| Main display | 7-inch class minimum | enough room for graph + 5-track view |
| Better UI option | 8–10 inch class if enclosure allows | improves readability of track overlay |

## H. Must-decide items

- stereo-first vs multichannel-first product
- final compute form factor
- final display size
- final radio module
- final speaker layout and amplifier channel count
- final battery size / chemistry / compliance path
