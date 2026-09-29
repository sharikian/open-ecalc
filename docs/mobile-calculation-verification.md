# Mobile, calculation, and deployment verification

Date: 2026-09-29. Status: implementation and available-environment verification complete; not a general physical-model accuracy certification.

## Follow-up verification

- Independent generic-coefficient comparison (no measured curve): hover current 8.0968 A vs eCalc 8.39 A, RPM 4019.86 vs 4047, duration 31.4938 min vs 30.4 min. Differences are 3.49%, 0.67%, and 3.60% respectively. These are specific to the documented scenario and are not a general accuracy guarantee.
- Production feedback was sent as a JSON document with deliberately incorrect client result data; the Worker recomputed the valid inputs and Telegram returned success. Automated Worker tests additionally inspect the attachment, reject cross-origin/invalid requests, and check upstream failure reporting.

- Production site opened in agent-browser with QUIC disabled and the Cloudflare host mapped to a reachable edge IP. The ordinary DNS path from this environment timed out; HTTPS/SNI remained the original hostname.
- Synthetic safe-area test at 375 x 812: 24 px top inset produces 32 px header padding; 20 px bottom inset produces 27 px navigation padding. No horizontal overflow; numeric input text is 16 px.
- Production simple calculator with the 5000 mAh scenario displays 5.9 min and **3.5 km usable range**; legacy raw table range stays 4.4 km.
- Advanced calculator was exercised through all four form steps using the documented DEFAULT_MISSION_INPUT dimensions; it produced a real results dialog and charts, not a blank/error page.
- A matched eCalc observed hover point produces 30.4 min with 5000 mAh, 85% usable capacity, 8.39 A total current and zero auxiliary draw. This validates the duration calculation, not an independent prediction of eCalc's motor model.
- Worker feedback delivery returned HTTP 200 / `{ "ok": true }` from Telegram both for the initial text delivery and the full JSON document delivery. The latter includes original inputs, client result and server-recomputed result.
- A scan of the built frontend found no Telegram token. Full static output is 8.46 MiB.
- Android CI run 36571175263 failed before compilation because setup-android attempted to install the removed SDK package `tools`. The workflow now requests only `platform-tools`. Final run [36573142231](https://github.com/sharikian/open-ecalc/actions/runs/36573142231), built from application commit 38a2ae3, passed Android, Windows and both macOS jobs. Its ARM artifact ZIP is 20,620,206 bytes; the earlier v0.1.3 APK was 82,499,538 bytes. ZIP and APK are different containers, so this is not an exact APK-to-APK percentage comparison. The successful collection step checks that ARM64 and ARMv7 libraries are both present and x86/x86_64 are absent.
- Maximum-load sag now solves current and voltage together, avoiding the previous one-pass estimate and contradictory ceiling/warning outputs.

## Completed checks

- Mobile header, content, bottom navigation, sticky actions, and result dialog use shared safe-area variables.
- Mobile Field labels and numeric controls use 16 px text. Numeric values remain Latin digits.
- Battery capacity is displayed in mAh and converted to Ah before calculating in both input modes. A 5000 mAh pack is stored as 5 Ah.
- The simple form accepts zero payload and requires integer rotor and parallel-pack counts.
- Browser test: empty mass 850 g, battery mass 300 g, zero payload, one 5000 mAh pack, four motors drawing 10 A each, speed 10 m/s. Result: takeoff mass 1150 g, usable time 5.9 min, legacy raw range 4.4 km.
- Legacy raw range includes the full capacity. Usable range should be separately displayed rather than changing the preserved Excel model.
- All 25 tests across 7 files pass, including the independent coefficient comparison, invalid mission cases, and server-side feedback verification. Svelte checking reports zero errors and 7 existing unused-style warnings in ComponentGallery.
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

## Final runtime verification

- Production was rechecked at https://uav.sharik.dev: 5000 mAh, four motors at 10 A, speed 10 m/s yields 5.9 min and 3.5 km usable range. Browser feedback delivery returned the visible success message on this domain.
- Final static build checks at 320, 375 and 414 px found no horizontal document overflow and 16 px numeric input text. The 1440 px desktop and 375 px mobile renderings were visually inspected. With synthetic 24/20 px insets, header top padding is 32 px and the visible bottom navigation padding is 27 px.

## Verification limits

Real-device Android system-bar behavior has not been tested in this environment; safe-area CSS was verified with injected non-zero insets in Chromium. The final artifact download from GitHub stalled in this environment, so its exact unwrapped APK size was not independently measured locally. Forward-flight drag remains outside the static coefficient model as documented in calculation-model.md. The eCalc comparison validates one observed hover scenario, not all aircraft or forward-flight range predictions.

Cloudflare references: https://developers.cloudflare.com/workers/static-assets/ and https://developers.cloudflare.com/workers/platform/limits/.
