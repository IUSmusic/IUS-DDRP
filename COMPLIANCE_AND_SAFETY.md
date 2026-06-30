# Compliance and safety plan

This document is an engineering checklist, not legal advice. A qualified compliance laboratory and market-access specialist must confirm the final obligations for each sales region and product configuration.

## 1. Intended launch markets

Initial planning basis:

- Great Britain
- Northern Ireland
- European Union
- later expansion to North America

Market-specific radio modules, power cords, labels and declarations may be required.

## 2. Product safety

Likely product-safety framework:

- IEC/EN/BS EN 62368-1 for audio/video and ICT equipment
- certified external AC/DC adapter
- SELV/ES1 internal architecture where practical
- fire enclosure and material flammability review
- creepage and clearance review
- abnormal-operation testing
- accessible temperature limits
- headphone acoustic-output safety assessment

The product should keep mains outside the enclosure through a certified external adapter.

## 3. EMC

Plan for:

- emissions
- immunity
- ESD
- EFT and surge at external ports
- conducted RF immunity
- radiated RF immunity
- amplifier-cable emissions
- display-cable emissions
- charger and battery modes

The exact standards depend on market and product classification.

## 4. Radio

Great Britain:

- Radio Equipment Regulations 2017
- current OPSS guidance
- UKCA or recognised CE route as applicable

Northern Ireland and EU:

- Radio Equipment Directive framework
- cybersecurity requirements for in-scope internet-connected radio equipment
- notified-body or harmonised-standard route where required

Use a pre-certified radio module but do not assume module approval removes host-product testing.

## 5. Product cybersecurity

For a consumer connectable product in the UK, plan for:

- no universal default password
- a published vulnerability-reporting route
- a defined security-update period
- a statement of compliance
- secure update and rollback
- unique device identity
- protection of stored credentials
- factory-reset behaviour
- software bill of materials
- incident-response process

The product-security regime has applied in the UK since 29 April 2024 and has been amended since; final legal review must use the current text at launch.

## 6. Battery

Required work:

- UN Manual of Tests and Criteria, subsection 38.3
- IEC 62133-2 assessment where applicable
- pack-level protection
- cell traceability
- shipping state of charge
- transport documents
- replaceable pack service instructions
- thermal propagation review
- fuse coordination
- BMS software validation
- charger fault tests

Do not ship prototype packs without the required transport evidence.

## 7. Environmental

Plan for:

- RoHS
- REACH
- WEEE
- battery regulations
- packaging waste
- material declarations
- conflict-mineral and supplier declarations where required
- repair and end-of-life instructions
- labelled battery chemistry

## 8. Accessibility

The browser interface targets WCAG 2.2 AA.

For EU sales, assess whether the product or related service falls within the European Accessibility Act scope. The EAA has applied to covered products and services placed on the market since 28 June 2025.

Accessibility evidence should include:

- conformance report
- keyboard test
- screen-reader test
- contrast test
- user testing
- accessible documentation
- support contact

## 9. HDMI and content ecosystems

### HDMI

- adopter obligations
- trademark rules
- eARC compliance
- HDCP requirements if protected video is handled
- interoperability
- approved test equipment and lab

### Streaming and codecs

Commercial approval may be required for:

- AirPlay
- Google Cast
- Spotify Connect
- TIDAL Connect
- Qobuz Connect
- Roon Ready
- aptX
- LDAC
- Dolby
- DTS

No trademark or logo appears in packaging or the UI before approval.

## 10. Electrical safety architecture

- external certified DC supply
- keyed or locking DC input
- input fuse
- reverse-polarity protection
- overvoltage clamp
- inrush limit
- battery fuse
- BMS
- hardware amplifier mute
- output DC detection
- temperature sensors
- flame-rated internal wiring
- strain relief
- protected service access
- no user access to hazardous energy

## 11. Acoustic safety

- configurable maximum headphone level
- warning before high-gain mode
- per-output saved limit
- child/guest profile
- no startup at previous unsafe level
- speaker limiter
- fault mute
- measurement against applicable acoustic-exposure guidance

## 12. Compliance file

Maintain:

- design description
- schematics
- PCB files
- BOM
- risk assessment
- test reports
- radio module evidence
- battery evidence
- software versions
- cybersecurity statement
- accessibility report
- user instructions
- labels
- declarations
- change-control history

Any board, antenna, enclosure, battery or firmware change receives a compliance-impact review.
