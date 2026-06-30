# Interface specification

## 1. Interface philosophy

The product should connect without requiring a dedicated app. A local browser interface is the universal control surface; native apps are optional enhancements.

Connection priority:

1. direct physical controls
2. wired digital or analog connection
3. local browser interface
4. standards-based network control
5. certified proprietary ecosystems

## 2. Front and rear physical interfaces

| Interface | Direction | Purpose |
|---|---|---|
| XLR/TRS combo ×2 | input | mic, line, instrument |
| XLR or TRS ×2 | output | balanced monitors |
| 6.35 mm | output | headphones |
| 4.4 mm | output | balanced headphones |
| USB-C | bidirectional | UAC2, service, update |
| USB-A 3 ×2 | host | storage, controllers |
| Ethernet | bidirectional | network audio and control |
| HDMI | output | TV or monitor UI |
| Optical S/PDIF | in/out | TV and digital audio |
| Coaxial S/PDIF | in/out | digital audio |
| MIDI DIN or TRS | in/out | instruments and control |
| DC input | input | power and charging |

The final connector layout shall preserve finger clearance and allow cables to be inserted by users with limited dexterity.

## 3. Computer connection

### USB Audio Class 2

Minimum profile:

- two input channels
- two output channels
- 24-bit
- 44.1, 48, 88.2, 96, 176.4 and 192 kHz
- asynchronous feedback endpoint
- class-compliant operation on macOS, Linux, iPadOS and current Android devices where supported
- signed driver package only if Windows functionality requires it
- MIDI endpoint
- firmware-update endpoint separated from audio

Optional profile:

- multichannel loopback
- independent stream and monitor mixes
- 32-bit host samples
- ADAT expansion

## 4. Phone and tablet connection

### USB-C

- class-compliant audio
- no assumption that the phone can power the full device
- device advertises its power role correctly
- charge-through support only after USB-PD design validation

### Wi-Fi

- browser control through local network
- mDNS discovery
- QR and NFC onboarding
- local IP fallback shown on the device
- no cloud account required

### Bluetooth

Baseline:

- SBC and AAC where the selected stack supports them
- AVRCP control
- multipoint only after stability testing

Production options:

- LE Audio
- Auracast
- aptX Adaptive or aptX Lossless
- LDAC

Codec logos and claims require the relevant licence and certification.

## 5. TV and monitor connection

### Display output

- full-size HDMI output
- 1080p60 minimum
- 4K60 target if the carrier routing and thermal design validate it
- UI safe-area mode for televisions
- large-text living-room mode
- CEC control optional

### TV audio input

Priority order:

1. optical S/PDIF
2. HDMI eARC module
3. analog line input
4. Bluetooth

Optical S/PDIF is the baseline because it is simple and electrically isolated. HDMI eARC is a separate licensed hardware and compliance track.

### Lip sync

- adjustable output delay
- saved per input
- coarse range: 0–250 ms
- fine step: 1 ms
- default 0 ms for wired local playback

## 6. Active studio monitors

Preferred connection:

- balanced XLR or TRS
- selectable +4 dBu nominal level
- fixed-level mode for an external monitor controller
- variable-level mode for direct use
- output mute relay
- ground-lift strategy implemented internally, not through unsafe removal of protective earth

## 7. Digital audio

### S/PDIF

- optical and coaxial input/output
- PCM stereo through 192 kHz where the receiver and transmitter support it
- Dolby and DTS pass-through not promised in the baseline
- rate lock and error state visible
- automatic mute on loss of lock

### HDMI eARC

- input only in the first licensed module
- support defined by the selected receiver and software stack
- interoperability tested with representative LG, Samsung, Sony, Philips and Panasonic televisions
- no use of HDMI trademarks before adopter obligations are satisfied

## 8. Network audio

### Open and standards-based baseline

- HTTP/HTTPS local interface
- WebSocket state updates
- UPnP/DLNA renderer
- SMB read-only import option
- NFS optional for studio networks
- internet radio playlists
- local REST API
- mDNS/Bonjour discovery

### Certified integrations

Separate commercial tracks:

- AirPlay
- Google Cast
- Spotify Connect
- TIDAL Connect
- Qobuz Connect
- Roon Ready

A protocol is not listed as supported in public product material until the vendor approval process is complete.

## 9. Browser interface

### Supported clients

- current Chrome, Edge, Firefox and Safari
- iOS/iPadOS Safari
- Android Chrome
- desktop screen readers
- keyboard-only operation

### Accessibility contract

- WCAG 2.2 AA target
- semantic HTML
- labelled controls
- visible focus
- no keyboard trap
- minimum 44 × 44 touch targets
- text scaling to 200%
- high-contrast theme
- reduced motion
- status not conveyed by colour alone
- live regions for recording and fault messages

## 10. Local control API

### Transport

- play
- pause
- stop
- previous
- next
- seek
- record
- punch in/out

### Mixer

- input gain
- monitor level
- mute
- solo
- pan
- track arm
- route selection

### EQ

- 15 band gains
- bypass
- preset
- output trim
- room correction enable

### System

- source selection
- speaker/headphone state
- battery state
- temperature
- network state
- update status
- diagnostics export

State-changing calls return the confirmed hardware state, not only an accepted command.

## 11. Discovery and onboarding

- first boot creates a temporary local setup access point
- display shows a human-readable network name and passphrase
- QR code is optional convenience
- screen-reader-compatible text alternative is always available
- setup access point disables after onboarding
- physical reset can re-enter setup mode
- device credentials are unique per unit

## 12. Data formats

### Playback

- WAV
- AIFF
- FLAC
- ALAC
- AAC
- MP3
- Ogg Vorbis
- Opus

### Recording

- WAV PCM
- BWF
- FLAC
- optional compressed proxy

### Projects

- JSON metadata
- separate immutable audio assets
- transaction journal
- checksums
- versioned schema

## 13. Compatibility validation matrix

At DVT, test at least:

- Windows 11
- current macOS
- current Ubuntu LTS
- current iOS and iPadOS
- current Android
- five major TV brands
- two common active-monitor input standards
- three headphone impedance classes
- three USB hubs
- three Wi-Fi access-point vendors
- congested 2.4 GHz and 5 GHz environments
