# EQ and DSP specification

## 1. Processing objectives

The DSP must provide predictable, measurable processing with no zipper noise, no unstable filter states and no hidden gain changes.

The direct-monitor path runs independently of Linux.

## 2. Internal processing rate

- default real-time rate: 96 kHz
- optional low-power rate: 48 kHz
- 24-bit converter data
- at least 32-bit internal coefficient and accumulator precision
- denormal and saturation behaviour defined for the chosen DSP
- all coefficient updates smoothed

The final fixed-point scaling is validated with worst-case simultaneous boosts.

## 3. Fifteen-band equalizer

### Centre frequencies

`25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000 Hz`

### Control range

- ±12 dB per band
- 0.5 dB physical/UI step
- software automation resolution may be finer
- flat default
- per-output bypass
- global gain compensation

### Filter model

- peaking biquad
- constant-Q target
- nominal Q: 2.145
- RBJ cookbook coefficient form or an equivalent validated implementation
- frequency clamped below Nyquist margin
- coefficient interpolation over 5–20 ms
- no abrupt coefficient replacement while audio is active

## 4. Gain management

Fifteen simultaneous boosts can create severe clipping. The DSP shall:

- calculate predicted peak gain
- apply automatic pre-trim when necessary
- show the applied trim
- retain at least 6 dB internal headroom
- run the final limiter after summing
- never hide permanent loudness normalisation inside an EQ preset

## 5. Signal-chain order

### Input monitor chain

1. input protection status
2. polarity
3. DC blocker
4. high-pass filter
5. input trim
6. optional gate
7. channel EQ
8. monitor send
9. track record split

### Playback chain

1. decoder output
2. sample-rate conversion
3. track trim
4. track pan
5. project mix
6. 15-band master EQ
7. loudness compensation
8. room correction
9. output routing
10. speaker crossover and protection
11. limiter
12. DAC trim

Dry recording taps before creative EQ by default.

## 6. Crossovers

Initial two-way stereo target:

- Linkwitz-Riley fourth order
- acoustic crossover determined by measured drivers
- expected range: 2–3.5 kHz
- independent polarity and delay per driver
- driver-EQ blocks separate from user EQ
- factory crossover locked in normal mode

A passive crossover may be used in the first acoustic mule. The product decision follows measurements.

## 7. Speaker protection

Protection functions:

- high-pass excursion control
- RMS thermal limiter
- peak limiter
- battery-mode power curve
- amplifier-temperature derating
- driver-temperature model if sensors are not fitted
- clip detection
- DC fault mute

Limiter release must not pump audibly during normal music.

## 8. Headphone and line protection

- separate maximum-level policies
- soft start and stop
- relay mute
- DC detection
- headphone impedance class detection optional
- no speaker-room correction on line outputs unless explicitly enabled

## 9. Presets

Factory presets:

- Flat
- Bass
- Vocal
- Air
- Warm
- Studio

Rules:

- preset names are descriptive, not claims of accuracy
- every preset stores EQ, global trim and bypass state
- factory presets are read-only
- user presets are versioned
- preset changes crossfade or ramp
- no preset may exceed the validated headroom envelope

## 10. Metering

### Input

- peak
- RMS
- clipping
- phantom state
- gain
- pre/post selection

### Track

- peak
- RMS
- mute, solo and arm
- dropped-sample warning

### Output

- peak
- true-peak where processing permits
- limiter gain reduction
- amplifier clip/fault
- speaker thermal estimate

Meter update:

- internal detection at audio rate
- UI refresh 30–60 Hz
- control packets rate-limited
- peak hold configurable

## 11. Recording modes

### Dry

- preamp, ADC and essential safety filtering only
- user EQ not printed
- monitor EQ remains available

### Printed

- selected channel processing recorded
- UI displays “PRINTED PROCESSING”
- setting stored in project metadata

### Dual

- dry master plus processed proxy
- optional due storage load

## 12. Room correction

Room correction is optional and shall not delay the direct headphone monitor path.

Possible implementation:

- measured FIR correction on speaker bus
- maximum user-selectable filter length
- bypass safety
- per-room profiles
- target-curve import
- microphone calibration file support

The product must remain usable without room correction.

## 13. Latency rules

- direct monitor ≤5 ms analog-to-analog
- fader/encoder audio response ≤10 ms
- no network process in the direct-monitor path
- no long FIR filter in live monitor mode
- Bluetooth not presented as live monitoring

## 14. Test vectors

The DSP build shall include automated tests for:

- unity gain
- each EQ band at ±12 dB
- all bands at maximum boost
- all bands at maximum cut
- coefficient transitions
- impulse response
- polarity
- mute ramp
- limiter attack and release
- clock-rate changes
- NaN, overflow or saturation equivalents
- power-state transitions
