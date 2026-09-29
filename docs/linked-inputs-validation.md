# Linked inputs and catalog validation

Date: 2026-09-29.

Final automated checks: 43 tests across 10 files pass; production static build succeeds. Dataset regeneration twice yields stable snapshot hashes (recorded in the data manifests).

## Input contract

- Advanced mode shows one of four steps on every viewport. Previous values survive navigation; later steps stay locked until preceding steps validate.
- Numeric fields start empty. Derived values appear only with finite prerequisites. Propeller coefficients must be entered or provided by the chosen component; the advanced form does not silently reuse the example coefficients.
- Automatic pressure uses the existing standard-atmosphere function on `-500…11000 m`. UI pressure is hPa; persisted/core pressure is Pa. This is a standard-atmosphere estimate, not a weather observation. Out-of-range altitude is an error. Explicit pressure in older projects resolves to manual mode; absent pressure resolves to automatic mode.
- Conventional nominal cell voltages are explicit UI choices: LiPo 3.7 V, Li-ion 3.6 V and LiFePO4 3.2 V. A voltage choice sets series count too. Custom pack voltage divides by the entered series count; changing series preserves cell voltage. These conventions are not filled in as manufacturer specifications during catalog import.
- Total capacity is pack Ah × parallel count. Continuous current allowance is total Ah × continuous C. Takeoff mass follows the core definition including battery packs, motors and ESCs.
- Selecting a component replaces its fields. Unknown electrical/thermal specifications are cleared, not copied from the last model. Multi-KV motor selection applies the documented variant's fields together. Peak-limit duration and no-load test voltage are retained and shown with their labels.
- Complete-aircraft mass is not silently treated as empty airframe mass. Aircraft selection can copy documented wheelbase, but leaves unknown empty mass and rotor count for manual entry.

## Independent current comparisons

For each optional per-motor current:

```
total A = motor A × rotor count + auxiliary A
usable Ah = pack Ah × parallel count × usable fraction
minutes = usable Ah / total A × 60
range km = minutes / 60 × speed m/s × 3.6
```

Battery sag and electrical-limit warnings are evaluated for that row. A collapsed battery voltage produces zero endurance. These constant-current comparisons do not replace the hover/cruise/climb points or change ceiling. They are not a new thrust model or a validated discharge simulation.

The browser, reports and feedback Worker retain `currentScenariosA` and pressure mode. Worker regression tests use the shared calculation engine. Golden workbook tests remain unchanged.

## Browser evidence

`scripts/verify-linked-ui.mjs` runs the built static preview with agent-browser. Two matrix runs each checked 80 stages: widths 320, 375, 414, 768 and 1440; Persian/English; light/dark; all four steps and calculated current comparisons. No horizontal overflow, off-viewport controls, incorrect language direction or multiple active steps were found. The script supports `UI_TEST_URL` and `UI_TEST_WIDTHS` for repeatable local/deployed checks.

Additional checks:

- First-run numeric fields are blank and there are no results.
- 1000 m produces approximately 898.7 hPa automatically. A manual 920 hPa stays unchanged when altitude changes to 3000 m.
- Choosing 11.1 V sets 3S; changing series to 6 updates pack voltage to 22.2 V.
- Selecting an Auline 3000 mAh 6S battery fills documented capacity/series/C/mass and leaves unknown voltage/resistance blank.
- Catalog shows ten rows per page; search works and estimated references are opt-in. Imported records without licensed product photos use icons rather than unrelated model photos.
- A final 375 px rerun checked 16 more stages without failures. Selecting T-Motor F1507 and 3800 KV applied 23 A / 372 W (60 s limits), 0.9 A no-load at 5 V and 0.081 Ω together. Catalog edits preserve unknown values; empty new records are rejected.
- Escape closes the component picker and restores trigger focus. The result dialog focuses Close, makes the background inert, traps keyboard focus and restores Calculate on dismissal. It is above the mobile navigation/header layers.
- At 375 px, all 18 propulsion controls could be focused and scrolled between the header and bottom navigation without a hidden focused control.
- Reduced-motion emulation, keyboard focus rings and simulated 24/34 px safe-area variables were checked.
- A 720×450 CSS viewport at device scale 2 checked the layout equivalent of a 1440×900 desktop at 200% zoom. This is emulation, not a manual browser-toolbar zoom test.

Screenshots were inspected locally (`/tmp/linked-*-step-*.png`, `/tmp/linked-mobile-propulsion.png`). Full-page screenshots place fixed bars at their capture scroll position; viewport captures were used for actual occlusion checks.

## Limits

Browser checks use Chromium, not a physical Android/iOS keyboard or Firefox. Native number spinners are disabled with both WebKit and Firefox CSS rules. Mobile safe-area and zoom checks are emulated. Eight existing unused-CSS warnings remain; type checking has no errors. This work does not claim new native platform build verification.

FPV-DB coverage, primary-source supplements, deduplication and distribution restrictions are recorded in [data-sources.md](data-sources.md) and [THIRD_PARTY_DATA.md](../THIRD_PARTY_DATA.md). Most imported motors still lack some solver-required electrical parameters. Listing a real product does not imply that it is calculation-ready; missing parameters require manual entry. Measured curve rows preserve incomplete columns and test conditions and are not automatically turned into a generic motor curve at an arbitrary voltage.

## Deployment evidence

Published to the existing `open-ecalc` Worker on 2026-09-29, version `97f4b4fe-7f83-40a5-9555-22c01ea75e58`. The existing API bindings and custom domain were retained.

`https://uav.sharik.dev/`, `/data/components.v1.json` and `/data/aircraft.v1.json` all returned HTTP 200. Both remote dataset hashes matched the final local build: 1,583 component records (851 default, 732 reference-only) and 257 deduplicated aircraft. The complete catalog also includes 20 locations, so its default UI total is 1,128 records, not a claim of 1,128 engineering-ready components.

Live Chromium checks on the custom domain confirmed an empty initial advanced form and a complete 320 px four-step calculation with the current comparison visible, no horizontal overflow, and an inert background behind the result dialog. Local checks included 80-stage matrices and a final 16-stage mobile rerun. The screenshot `/tmp/linked-production-result.png` was inspected for actual viewport layering. No feedback was sent to Telegram during the deployment check.

Changes were grouped into feature branches with 5, 6 and 5 commits respectively, using the required message format and `--no-ff` merges to `master`. This final documentation update is a follow-up merge of the existing validation branch; no direct commit was made on `master`.
