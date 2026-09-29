# Third-party data

Open eCalc separates the MIT-licensed application code from component data.
Every bundled or imported record must retain its original licence and source.

## Bundled data

The component bundle includes a pinned FPV-DB snapshot from commit
`5333aba81229e1d0e7b1585e165136fd1187174c`, licensed CC BY 4.0. Attribute it
as “FPV-DB — https://fpv-db.com”. The imported subset is 206 motors, 326
batteries, 207 propellers, 112 combined FC/ESC stacks, and 101 quad profiles;
cameras and VTX are excluded. Raw source files and the license are retained in
`data/raw/fpvdb/2026-09-29/`; generated counts and hashes are in
`data/manifests/fpvdb-snapshot.v1.json`.

No product photos are bundled. Unavailable specifications remain absent rather
than being inferred or filled with defaults. The 732 older generic/estimated
records remain available only as opt-in references (`referenceOnly: true`),
excluded from the default catalog. They are not manufacturer specifications
and are not copied from eCalc, Tyto, APC, or a manufacturer.

## Approved import tooling

- `tzi4/Multicopter_Battery_and_Range_Calculations` — MIT (commit
  `bdc1ce02f48b570cd13c0788a80a3ddaeb263fc0`). The project may be used as a
  validation reference; no binary calibration data is currently bundled.
- `ramcdona/PropDBTools` — BSD-2-Clause (commit
  `4fa41c8c9e07369474768567e968f1b16c453f48`). File-format behaviour may be
  used by the UIUC importer; no UIUC measurements are currently bundled.
- `ndrewwang/liiondb` — MIT. Records may be imported after their individual
  provenance fields have been normalized; none are currently bundled.
- `StrawsonDesign/motor_propeller_testing` — MIT candidate for test-stand
  curves; snapshot and attribution review is pending.
- `Setuav/PyThrust` — Apache-2.0 candidate catalog; upstream licence is
  audited per record before any bundle is produced.
- `uavdb.org` — flight-test CSV/MAT archives and heavy-lift product records.
  Not bundled: no clear, verified redistribution license for the dataset was
  established. Public access or a citation request alone is not a data license.
- PX4 airframe taxonomy — BSD-3-Clause reference only; no product image or
  specification is copied into the runtime dataset.

## Explicit exclusions

- UIUC Propeller Database measurements are not bundled until redistribution
  permission is confirmed. Public download does not by itself establish a
  redistribution licence.
- eCalc, Tyto Robotics, APC and SplineCloud records are not bundled without an
  explicit redistributable licence or written permission.

Imported user datasets remain the user's responsibility. The importer refuses
records without a source URL and SPDX licence identifier.
