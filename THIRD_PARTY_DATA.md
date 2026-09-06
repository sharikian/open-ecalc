# Third-party data

Open eCalc separates the MIT-licensed application code from component data.
Every bundled or imported record must retain its original licence and source.

## Bundled data

Version `2026.09` contains only synthetic reference components authored for
this project under CC0-1.0. They are intended for exercising calculations and
must not be treated as manufacturer specifications.

## Approved import tooling

- `tzi4/Multicopter_Battery_and_Range_Calculations` — MIT. The project may be
  used as a validation reference; no data from it is currently bundled.
- `ramcdona/PropDBTools` — BSD-2-Clause. File-format behaviour may be used by
  the UIUC importer; no UIUC measurements are currently bundled.
- `ndrewwang/liiondb` — MIT. Records may be imported after their individual
  provenance fields have been normalized; none are currently bundled.

## Explicit exclusions

- UIUC Propeller Database measurements are not bundled until redistribution
  permission is confirmed. Public download does not by itself establish a
  redistribution licence.
- eCalc, Tyto Robotics, APC and SplineCloud records are not bundled without an
  explicit redistributable licence or written permission.

Imported user datasets remain the user's responsibility. The importer refuses
records without a source URL and SPDX licence identifier.

