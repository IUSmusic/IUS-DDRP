# Folder structure

This repository is now organised as a **static product demo + builder handoff pack**.

- `index.html` — GitHub Pages entry for the working desktop demo
- `web/ius-desktop.html` — standalone web prototype page
- `assets/css/` — shared demo styles
- `assets/js/` — shared demo logic and EQ response engine
- `assets/logo/` — reserved for official IUS branding assets
- `assets/screens/` — reserved for future screenshots / renders
- `docs/` — builder-facing system, BOM, EQ, and architecture documents

## Documentation map

- `BUILDERS_PLAN.md` — feature-to-implementation handoff
- `EQ_DSP_SPEC.md` — 15-band EQ truth model and routing policy
- `bom.md` — revised concept-to-builder BOM
- `characteristics.md` — product characteristics and UX targets
- `hardware-schematics.md` — block-level hardware mapping
- `system-architecture.md` — software / control / signal path overview

## Intent

The old structure was sufficient for a concept pack.  
This updated structure is intended to support:

1. web demo review
2. UI iteration
3. embedded-audio planning
4. small-batch builder handoff
