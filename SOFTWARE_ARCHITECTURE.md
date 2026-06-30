# Software architecture

## 1. Software goals

- deterministic control of the hardware
- recoverable recording
- offline-first operation
- accessible local and remote interfaces
- signed updates
- service isolation
- auditable state changes
- no cloud dependency for core functions

## 2. Platform split

### Compute Module 5

Runs Linux and owns:

- graphical interface
- local web server
- media library
- decoders
- project database
- recorder process
- network discovery
- streaming integrations
- updates
- diagnostics

### XMOS XU316

Runs fixed firmware and owns:

- USB Audio Class
- MIDI
- S/PDIF transport
- sample buffering
- host clock feedback
- low-level audio routing

### Control MCU

Runs RTOS or bare-metal firmware and owns:

- button and fader scanning
- power state machine
- safe mute
- watchdogs
- thermal sensors
- battery telemetry
- fan control
- fault logs
- DSP bootstrap

### ADAU1467

Runs a signed or checksum-verified DSP image and owns:

- live monitoring
- EQ
- crossover
- limiter
- meter generation
- output routing
- safe ramps

## 3. Linux base

Recommended:

- minimal Debian-derived image
- read-only or A/B root file systems
- PREEMPT_RT only where it benefits host playback
- PipeWire or JACK for host audio routing
- systemd service supervision
- Wayland kiosk UI
- no unnecessary desktop packages
- full-disk encryption optional for studio projects
- secure boot path evaluated for the final carrier

The deterministic audio path does not depend on PREEMPT_RT.

## 4. Core services

| Service | Responsibility |
|---|---|
| `ius-ui` | local touchscreen interface |
| `ius-web` | responsive browser interface |
| `ius-audio-host` | decode, host mix and USB stream |
| `ius-recorder` | capture, journal and file finalisation |
| `ius-project` | project metadata and asset indexing |
| `ius-control` | MCU/DSP state bridge |
| `ius-network` | onboarding, discovery and radio |
| `ius-update` | signed A/B updates |
| `ius-diagnostics` | logs, metrics and support bundle |

Each service has a restart policy and health check.

## 5. State model

The hardware-confirmed state is authoritative.

Example flow:

1. UI requests output mute off.
2. control service sends the request to MCU.
3. MCU checks rail, clock and fault conditions.
4. MCU commands DSP ramp and relay state.
5. MCU returns confirmed state.
6. UI updates.

The UI shall not display a safety-critical state before confirmation.

## 6. Recording architecture

- pre-allocated audio buffers
- separate real-time capture and file-writer threads
- bounded queues
- dropped-frame counters
- write-ahead project journal
- periodic file header update
- automatic recovery on boot
- low-space warning
- recording priority over artwork scanning or network indexing
- NVMe health and temperature monitoring

## 7. Project format

Root structure on the device may use directories, but the repository package remains flat.

Project data:

- immutable audio assets
- JSON project manifest
- edit decision list
- waveform cache
- checksums
- schema version
- recovery journal
- source and converter metadata
- sample-rate history
- printed-processing flag

## 8. UI framework

Recommended options:

- Qt Quick for the embedded display
- a shared TypeScript component model for the browser interface
- design tokens shared across both interfaces

The browser demo in this repository is not the production UI framework.

## 9. Accessibility

Required:

- semantic roles
- screen-reader names
- keyboard navigation
- visible focus
- no gesture-only action
- minimum target size
- high-contrast mode
- reduced motion
- scalable text
- audible and haptic feedback options
- error messages that identify the corrective action
- localised text architecture
- accessible setup path without QR code

Automated accessibility tests are supplemented with human testing.

## 10. Remote API

- HTTPS after onboarding
- WebSocket for state changes
- REST for commands and resources
- local authentication token
- role separation for owner and guest
- rate limiting
- CSRF protection
- origin validation
- no unauthenticated microphone or recording control

## 11. Network behaviour

- local operation survives internet loss
- internet radio failures do not block local playback
- network services restart independently
- Wi-Fi credentials encrypted at rest
- setup access point time-limited
- Ethernet preferred when present
- NTP failure does not prevent recording
- RTC maintains time through offline periods

## 12. Updates

- signed image
- A/B system partitions
- rollback after failed health check
- separate DSP, MCU, XMOS and Linux versions
- compatibility manifest
- update notes shown before installation
- recordings blocked only during the final safe update window
- offline USB update path
- documented security-support period

## 13. Security

- unique credentials
- no shared default password
- least-privilege services
- read-only system partition
- signed software artefacts
- dependency inventory
- SBOM generation
- vulnerability disclosure address
- audit log for remote recording actions
- microphone active indicator controlled by MCU, not UI only
- factory reset with secure credential deletion

## 14. Boot and recovery targets

| Event | Target |
|---|---:|
| Cold boot to basic audio monitor | ≤3 s |
| Cold boot to UI ready | ≤15 s |
| Wake from standby | ≤2 s |
| UI service restart | ≤5 s |
| Network service restart | no audio interruption |
| Recorder recovery scan | ≤30 s for typical project |

Basic monitor availability comes from DSP self-boot, not Linux boot completion.

## 15. Diagnostics

Support bundle contains:

- firmware versions
- hardware revisions
- fault history
- battery health
- temperatures
- USB audio statistics
- network status
- dropped-frame counters
- storage SMART data
- anonymised service logs

It does not include audio recordings unless the user explicitly selects them.
