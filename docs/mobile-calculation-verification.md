# Mobile, calculation, and deployment verification

Date: 2026-09-29. Status: in progress; do not treat this as full model validation.

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
