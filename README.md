12 MARCH 2026
## Update:

- Replaced the text-only preview with a working demo.
- Added a real front-end EQ model with 15 bands and plotted response.
- Added presets, routing controls, mode switching, and a track overlay.
- Added builder docs, BOM update, EQ DSP spec, and implementation plan.

## IUS DRRP Desktop Demo
https://iusmusic.github.io/IUS-DDRP/


## IUS DRRP Prototype Demo
https://iusmusic.github.io/IUS-DRRP/
Standalone HTML Preview:
https://iusmusic.github.io/DRRPDEMO/


IUS DRRP Desktop is a mains-powered high-fidelity playback and recording device developed as the desktop version of the IUS DRRP concept. It is designed for studio, home, and creative audio use, combining tactile hardware control, upgraded audio architecture, visible interface feedback, and offline-first operation.

The desktop version is intended as the more advanced and premium model in the DRRP range. Compared with the portable version, it offers improved audio quality, larger physical controls, integrated speaker architecture, expanded monitoring capability, and a more complete recording and playback workflow.

Official Product Name
IUS DRRP Desktop



## Core Purpose
IUS DRRP Desktop is designed as a self-contained audio instrument for:

- high-quality local playback

- high-quality recording

- monitoring

- offline radio compatibility

- tactile physical interaction

- studio and home listening


## Main Characteristics

- mains-powered desktop unit

- internal backup battery with approximately 1 hour of operation under heavy use

- upgraded audio path based on HiFiBerry DAC+ ADC HAT

- built-in speaker system

- side speakers positioning

- enhanced top-channel spatial speaker design direction

- physical EQ control

- dedicated display-based monitoring interface

- offline concept



## Audio Architecture

The desktop version is based around an upgraded dedicated DAC/ADC system using a HiFiBerry DAC+ ADC HAT. The purpose of this architecture is to provide a cleaner and more reliable playback and recording path than standard onboard audio.

Expected audio features include:

hi-fi playback
line input recording
line output
headphone monitoring
dedicated analogue audio path
transparent signal flow
improved studio and home recording/playback quality
Display and Interface

The main screen is designed to operate in multiple visual modes.
Default screen mode:

EQ graph display
live signal and monitoring feedback
playback and recording status information


Track mode:

when the user slides through the interface, the display changes from EQ view to DAW-style track view
the desktop version supports up to 5 visible tracks


tracks are intended for:
recording
playback
monitoring

This track view is designed to give the user a more direct, hardware-based recording workflow without requiring a traditional software DAW interface for basic operations.


## Control System

IUS DRRP Desktop uses tactile physical controls rather than touchscreen-first interaction.

Control philosophy:
low-latency hardware response
visible UI status
direct manipulation of audio functions
physical EQ access
simple navigation between playback, recording, monitoring, and radio functions
Controls are intended to include:
transport controls
track navigation
slider-based interaction
EQ controls
radio access
playback and recording management


Speaker Design:

The desktop version includes built-in speakers.
Speaker layout direction:

side-mounted speakers architecture
enhanced top-channel spatial audio design direction
intended emphasis on wider and more immersive desktop listening
integrated monitoring and standalone playback capability without requiring external speakers for basic operation


Power System:

direct mains power
internal backup battery
approximately 1 hour battery operation under heavy use
intended mainly as a backup/mobile continuity feature rather than full portable operation


Product Positioning
The desktop version is positioned as the more complete and higher-spec version of the DRRP platform.

Portable version:

more limited

designed to attract attention and provide a compact form factor


Desktop version:

higher-quality audio path

more capable playback and recording architecture

more complete monitoring workflow

physical EQ

built-in speaker system

better suited for studio and home use


IUS DRRP Desktop combines:
- dedicated hi-fi playback
- recording capability
- offline radio compatibility
- physical EQ
- integrated speaker design
- visible DAW-style track feedback
- a tactile retro-modern hardware interface
- It is intended to function as a dedicated audio object with its own identity, not as a generic smart device or software wrapper.



Current design direction includes:

Raspberry Pi 4 class compute platform

HiFiBerry DAC+ ADC HAT

dedicated display interface

local/offline playback workflow

physical transport and EQ controls

built-in speaker architecture

internal power management

local monitoring and recording workflow

radio integration compatibility


Use Cases

studio playback

home listening

home recording

quick multitrack-style monitoring

offline radio listening

local playback from stored media

desktop audio experimentation and creative workflow

Project Status
IUS DRRP Desktop is currently in concept and prototype development stage.

This version represents the desktop flagship direction of the DRRP system and is intended to serve as the more advanced hardware platform for future development, demonstration, and possible small-batch production.

## MIT License


## Copyright (c) 2026 Pezhman Farhangi
I/US Music

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Trademark and Brand Notice

“IUS” and “I/US Music®” are proprietary brand identifiers of I/US Music®.

The source code in this repository is licensed separately under the MIT License.
That license does not grant any right to use the IUS name, the I/US Music®
name, official logos, visual identity, artwork, images, music, or other brand
assets included in or referenced by this repository.

All such rights are reserved. Any use of protected brand features requires
prior written permission from I/US Music®.
