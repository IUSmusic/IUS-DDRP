# Browser demo build notes

## What is included

`index.html` is a single-file interface demonstration.

It provides:

- Player, Radio and Record modes
- generated local test audio
- fifteen audible Web Audio EQ filters
- transport controls
- visual meters and waveforms
- five-track interface overlay
- internet-radio presets
- browser microphone recording
- keyboard control
- basic ARIA labelling
- no required local asset folders

## Run

Open `index.html` in a current desktop browser.

A local web server is recommended for microphone and media permissions:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Keyboard

- Space: play or pause
- Left/Right: previous, next or radio scan
- P: Player
- R: Radio
- D: Record
- T: toggle track overlay
- Up/Down on the volume control: adjust volume

## Important limits

- generated demo audio is not a product-quality reference file
- browser recording depends on browser codec support
- internet radio depends on network access, stream availability and CORS policy
- the demo does not implement the proposed XMOS, DSP, ADC or DAC hardware
- it does not prove the target latency
- it does not implement real DAB/FM hardware
- proprietary streaming services are not certified
- browser meters are illustrative
- project recovery and BWF metadata belong to the embedded build

## Offline behaviour

The interface and generated local test tracks work without internet access. External radio streams and web fonts are not required for the local demonstration.

## Source packaging

The package is intentionally flat. All documents and assets are in the repository root.
