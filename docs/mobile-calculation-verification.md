# Mobile, calculation, and deployment verification

Date: 2026-09-29. Status: in progress; do not treat this as full model validation.

## Follow-up verification

- Production site opened in agent-browser with QUIC disabled and the Cloudflare host mapped to a reachable edge IP. The ordinary DNS path from this environment timed out; HTTPS/SNI remained the original hostname.
- Synthetic safe-area test at 375 x 812: 24 px top inset produces 32 px header padding; 20 px bottom inset produces 27 px navigation padding. No horizontal overflow; numeric input text is 16 px.
- Production simple calculator with the 5000 mAh scenario displays 5.9 min and **3.5 km usable range**; legacy raw table range stays 4.4 km.
- Advanced calculator was exercised through all four form steps using the documented DEFAULT_MISSION_INPUT dimensions; it produced a real results dialog and charts, not a blank/error page.
- A matched eCalc observed hover point produces 30.4 min with 5000 mAh, 85% usable capacity, 8.39 A total current and zero auxiliary draw. This validates the duration calculation, not an independent prediction of eCalc's motor model.
- Worker feedback delivery returned HTTP 200 / `{ "ok": true }` from Telegram both for the initial text delivery and the full JSON document delivery. The latter includes original inputs, client result and server-recomputed result.
- A scan of the built frontend found no Telegram token. Full static output is 8.46 MiB.
- Android CI run 36571175263 failed before compilation because setup-android attempted to install the removed SDK package `tools`. The workflow now requests only `platform-tools`; run 36572022158 reached the ARM universal compilation stage.
- Maximum-load sag now solves current and voltage together, avoiding the previous one-pass estimate and contradictory ceiling/warning outputs.

## Completed checks

- Mobile header, content, bottom navigation, sticky actions, and result dialog use shared safe-area variables.
- Mobile Field labels and numeric controls use 16 px text. Numeric values remain Latin digits.
- Battery capacity is displayed in mAh and converted to Ah before calculating in both input modes. A 5000 mAh pack is stored as 5 Ah.
- The simple form accepts zero payload and requires integer rotor and parallel-pack counts.
- Browser test: empty mass 850 g, battery mass 300 g, zero payload, one 5000 mAh pack, four motors drawing 10 A each, speed 10 m/s. Result: takeoff mass 1150 g, usable time 5.9 min, legacy raw range 4.4 km.
- Legacy raw range includes the full capacity. Usable range should be separately displayed rather than changing the preserved Excel model.
- Existing 15 unit tests pass; Svelte checking reports zero errors (existing unused styles and feedback label warning remain).
- Production image copies shrink from 25.73 MiB to 5.53 MiB; original source images remain intact. This is not an APK-size measurement.
- Rust release settings enable size optimization, LTO, one codegen unit, and symbol stripping. ARMv7 and ARM64 targets remain together.
- Wrangler successfully deployed to https://open-ecalc.wacoinseig.workers.dev.
- TELEGRAM_BOT and ADMIN_USERID were uploaded as Worker secrets. Neither is included in frontend assets.

## Public eCalc scenario

URL: https://www.ecalc.ch/xcoptercalc.php. Tested with agent-browser.

- All-up mass 850 g, 4 flat rotors, 400 mm frame, 500 m elevation, 25 C, pressure input 1013 hPa.
- LiPo 5000 mAh 80/120C, 3S1P, normal charge, 85% discharge.
- Generic 30 A ESC; motor manufacturer ID 28, model A2213-862; Generic normal propeller, 10 x 4.7 inches, 2 blades.
- eCalc hover current 2.10 A per motor / 8.39 A total; hover time 30.4 min; maximum current 43.10 A total; hover input power 93.1 W.
- eCalc estimated range was unavailable (`-`) for this scenario.

These are observations for comparison, not redistributable component records or copied formulas.

## Remaining verification

- Exercise the advanced calculator against matched physical inputs and investigate infeasible thrust / voltage-sag behavior; current finite-output tests alone do not prove accuracy.
- Distinguish legacy raw range and usable range in the results interface.
- Render with simulated top/bottom insets and inspect multiple mobile sizes; real Android system-bar testing remains needed.
- Verify final production UI and feedback delivery. A direct network attempt to workers.dev timed out; deployment success alone does not prove runtime delivery.
- Rebuild the signed ARM universal APK in CI and measure compressed native libraries and package size.
- Add feedback request validation/rate protection, full input/result attachment, and server-side result recomputation before treating reports as verified data.

Cloudflare references: https://developers.cloudflare.com/workers/static-assets/ and https://developers.cloudflare.com/workers/platform/limits/.
