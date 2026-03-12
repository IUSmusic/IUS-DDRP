IUS DRRP Demo Build Notes

What works in this build
- Real browser audio playback through Web Audio API
- 15-band EQ with audible filter chain
- Visualizer driven from analyser data
- Three local track placeholders: sample01.mp3, sample02.mp3, sample03.mp3
- Free internet radio station list from curated stream URLs
- Browser microphone recording using MediaRecorder
- Download of recorded clip after stop

Important limits
- Internet radio depends on stream availability and browser CORS policies
- Browser recording saves compressed audio, not true FLAC
- Real FM/DAB, dedicated I/O, and embedded latency guarantees belong in the hardware build stage
