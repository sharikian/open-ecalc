# Open eCalc

Open eCalc is an open-source, offline drone and multicopter mission calculator. It helps engineers size a propulsion system and turn airframe, battery, motor, propeller, ESC, and environment data into practical flight estimates.

The same SvelteKit + TypeScript codebase targets a static website, Windows, macOS, and Android through Tauri 2.

[![MIT licensed](https://img.shields.io/badge/license-MIT-245EEA.svg)](LICENSE)
[![SvelteKit](https://img.shields.io/badge/frontend-SvelteKit-FF3E00.svg)](https://svelte.dev/docs/kit)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Targets](https://img.shields.io/badge/targets-Web%20%7C%20Windows%20%7C%20macOS%20%7C%20Android-14171A.svg)](docs/release-pipeline.md)

## Why Open eCalc?

Commercial calculators are useful references, but their models and component databases are not open. This project keeps the calculation engine inspectable, works without an account or network connection, and records the source and licence of every bundled data record.

Open eCalc is inspired by the workflow of tools such as eCalc. It does not copy eCalc code, private formulas, or its component database.

## What it calculates

- Takeoff mass, pack capacity, loaded voltage, current, power, and efficiency
- Estimated usable flight time and range at a selected speed
- Thrust-to-weight ratio and thrust margin for hover, cruise, climb, and emergency points
- Hover and recommended ceiling from altitude, temperature, pressure, and air-density changes
- Battery voltage sag, C-rate load, ESC and motor limits, and other compatibility warnings
- Measured throttle/thrust/current curves when a test curve is available
- Live engineering charts, four key gauges, power-loss breakdown, and rotor coverage layout
- Local projects and presets stored in IndexedDB, with portable JSON export/import

Results are estimates for engineering decisions. Validate a final configuration on a test stand and in controlled flight; this project is not a flight-safety certification tool.

## Screens and language

The workbench is designed for a dense engineering workflow rather than a marketing dashboard:

- step-by-step inputs on the left and a sticky results view on larger screens
- short full-width steps, fixed calculate action, and a separate results view on mobile
- Persian and English UI with automatic language detection, manual switching, and correct RTL/LTR layout
- metric and imperial display while calculations remain in SI units
- reduced-motion support for users who prefer less animation

## Technology

- **SvelteKit + TypeScript** — static output with SSR disabled for simple hosting
- **Tauri 2** — native Windows, macOS, and Android shells around the same frontend
- **ECharts** — responsive curves and engineering gauges
- **IndexedDB** — offline project and preset storage
- **Vitest + svelte-check** — calculation and type-safety checks

The calculation engine lives in `src/lib/core` and has no dependency on Svelte or Tauri. It can be tested and reused independently from the interface.

## Quick start

Requirements: Node.js 20+, Corepack, and pnpm 10.

```bash
corepack enable
pnpm install
pnpm dev
```

Open the local URL printed by Vite. To test the static build locally:

```bash
pnpm build
pnpm preview
```

## Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the static web application |
| `pnpm preview` | Serve the production build locally |
| `pnpm check` | Run Svelte and TypeScript checks |
| `pnpm test` | Run the calculation and data tests |
| `pnpm data:aircraft` | Rebuild the versioned aircraft snapshot |
| `pnpm tauri dev` | Run the native Tauri shell |

## Data, images, and provenance

Runtime component data is versioned under `static/data`. Source snapshots and import work happen under `data/raw`, validated records under `data/verified`, and rejected or unaudited material under `data/quarantine`.

Each accepted record must carry a source URL, SPDX licence identifier, retrieval timestamp, reproducible source hash, and quality label. Images follow the same provenance rules. See:

- [`data/README.md`](data/README.md) for the data pipeline and import formats
- [`THIRD_PARTY_DATA.md`](THIRD_PARTY_DATA.md) for licences, attribution, and exclusions
- [`docs/calculation-model.md`](docs/calculation-model.md) for the preserved Excel model and its assumptions

The bundled starter records are clearly marked as estimates. Manufacturer and community datasets are added only when redistribution terms are documented; public availability alone is not treated as permission to re-bundle data.

## Desktop and Android releases

The GitHub Actions workflow in [`.github/workflows/release.yml`](.github/workflows/release.yml) builds:

- one signed ARM APK containing ARMv8a and ARMv7
- separate signed x86 and x86_64 emulator APKs
- Windows NSIS installer
- macOS Intel and Apple Silicon DMGs

Push a version tag such as `v0.1.0` or start the workflow manually to publish the build artifacts. Android signing uses masked repository secrets; the keystore is never committed. The complete setup and artifact names are documented in [`docs/release-pipeline.md`](docs/release-pipeline.md).

## Project layout

```text
src/lib/core       Calculation models, curves, physics, ceiling, and warnings
src/lib/data       Component schemas, catalog, importers, and validation
src/lib/storage    IndexedDB projects and JSON file format
src/lib/ui         Svelte workbench, forms, charts, gauges, and navigation
static/data        Versioned offline runtime datasets and images
data/raw           Source snapshots kept with their original licences
data/verified      Records that passed provenance and validation checks
docs                Calculation, validation, data, and release documentation
src-tauri           Native desktop and Android shell
```

## Contributing

Before opening a pull request, run `pnpm check` and `pnpm test`. Keep the calculation model explicit and add tests for new formulas or limits. New component data must include provenance and licence metadata, and proprietary or scraped databases are not accepted.

## Licence

The application code is released under the [MIT Licence](LICENSE). Third-party data and images keep their original licences and attribution requirements; see [`THIRD_PARTY_DATA.md`](THIRD_PARTY_DATA.md).
