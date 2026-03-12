# EQ DSP specification


## 1) Band layout

The demo implements a **15-band graphic EQ** using these center frequencies:

`25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000 Hz`

This is a practical 2/3-octave-style layout for a compact hardware EQ.

## 2) Gain range

- Per band range: **-12 dB to +12 dB**
- Slider resolution: **0.5 dB**
- Default preset: **Flat**

## 3) Filter model

Each band is modeled as a **peaking biquad**.

Reference assumptions used by the demo:

- Sample-rate reference: **48 kHz**
- Filter family: **RBJ / Audio EQ Cookbook style peaking EQ**
- Default Q: **2.145** (approximately aligned to a 2/3-octave band width)

The front-end graph is calculated by:

1. creating one peaking biquad per band
2. evaluating each filter magnitude on a log-spaced frequency axis
3. multiplying magnitudes across all active bands
4. converting the summed magnitude to dB for display

## What this demo does not yet do

- no real-time audio filtering
- no convolution / speaker correction
- no oversampling
- no measured room or speaker compensation
- no true radio decoder or record engine

This document is here so the next phase can be implemented against a clear DSP contract.
