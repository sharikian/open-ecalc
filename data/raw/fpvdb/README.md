# FPV-DB pinned snapshot

- Upstream: https://github.com/fpv-wtf/fpv-db
- Commit: `5333aba81229e1d0e7b1585e165136fd1187174c`
- License: CC BY 4.0 (license text is stored beside the source files)
- Attribution: FPV-DB — https://fpv-db.com
- Snapshot date: 2026-09-29
- Imported files: `motors.json`, `batteries.json`, `props.json`, `stacks.json`,
  `quads.json`; cameras and VTX are deliberately excluded.
- Expected counts: 206 motors, 326 batteries, 207 props, 112 stacks, 101 quads.

The snapshot is immutable input to `scripts/import-fpvdb-data.mjs`. The
generated manifest records file hashes and normalized entity counts. Preserve
the upstream records and license text verbatim; make changes in the importer,
not in these raw files.

