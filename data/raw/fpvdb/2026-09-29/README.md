# FPV-DB Open Dataset

Structured specifications for **1000+ FPV drone components** — BNF quads,
motors (including manufacturer thrust bench tables), batteries, props,
FC/ESC stacks, cameras and video transmitters.

Exported daily from [fpv-db.com](https://fpv-db.com) - an independent FPV component database. Only entries passing the site's completeness gate are
included; every entry carries the source URLs its specs were verified
against.

## Files

| File | Contents |
|---|---|
| `quads.json` / `.csv` | BNF quads: class, weight, battery recommendation, props, video system |
| `motors.json` / `.csv` | Motors: stator, KV options, weight, cells; `thrust_table` holds full manufacturer bench data (per-KV, per-prop rows: current, RPM, thrust, efficiency) |
| `batteries.json` / `.csv` | Packs: chemistry, cells, capacity, C-rating, weight, connector |
| `props.json` / `.csv` | Propellers: diameter, pitch, blades, mount |
| `stacks.json` / `.csv` | FC/ESC stacks and AIOs: mount pattern, MCU, ESC rating |
| `cameras.json` / `.csv` | FPV cameras: video system, size class, sensor |
| `vtx.json` / `.csv` | Video transmitters: system, max power |
| `manifest.json` | Export date and per-type counts |

JSON files carry nested structures intact; in CSV, nested fields
(`thrust_table`, `recommended_battery`) are JSON-encoded strings and
lists are `|`-joined.

## License

**[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** — free for
any use, including commercial, on one condition: **attribute with a link
to [fpv-db.com](https://fpv-db.com)** (per component page where practical,
or a general credit).

## Caveats

- Specs are aggregated from manufacturer pages and retailer listings;
  version differences (analog vs HD builds, per-KV weights) are flagged in
  `note` fields. Verify before you fly.
- Regenerated daily; component slugs are stable identifiers.
- Missing a component or found an error? contact@fpv-db.com or
  [fpv-db.com/contact](https://fpv-db.com/contact/).
