# Changelog

## 30 June 2026

### Package structure

- flattened the package
- moved every document to the repository root
- moved `license-badge.png` to the root
- retained `DRRP1.png`, `SD1.png`, `SDS2.png` and the licence badge
- removed the duplicate `LICENSE.md`
- removed the obsolete draft HTML file
- removed unused split CSS and JavaScript files
- removed temporary syntax-check scripts
- removed the empty `docs` and `images` folders

### Documentation

- rewrote the README while preserving its image header
- replaced the old high-level architecture with a detailed multi-controller design
- added measurable product requirements
- added a realistic prototype BOM
- added hardware, software and interface specifications
- expanded the EQ specification into a full DSP contract
- added prototype phases and exit criteria
- added audio, latency, thermal, battery and accessibility validation plans
- added compliance, cybersecurity and licensing workstreams
- added primary-source references

### Browser demo

- removed the dependency on missing `assets` folders
- added generated local demonstration audio
- corrected the fifteen EQ frequency labels
- removed external web-font dependencies
- added keyboard and ARIA support
- updated displayed hardware direction from Raspberry Pi 4 / HiFiBerry to the new reference architecture
