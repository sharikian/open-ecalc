# RTL and centered calculator layout

Verified on 2026-09-29.

- Removed hard-coded LTR directions from the application header, desktop grid and calculator layout. They now inherit the selected language; Persian navigation is on the right, English on the left. Numeric input controls retain LTR direction.
- Centered mode tabs and limited empty calculator forms to 760 px. Results use the two-column layout only after a calculation. Advanced steps share the form's width and center.
- At tablet widths the hidden desktop sidebar no longer reserves an empty grid column. Mobile header, bottom navigation and safe-area padding are retained.
- The next-step arrow follows the selected language.

`scripts/verify-rtl-layout.mjs` passed 40 browser cases: widths 320, 375, 414, 768 and 1440; Persian/English; light/dark; simple/advanced. It checks direction, sidebar mirroring, centered bounds, viewport overflow, numeric direction and empty initial state. Desktop and mobile screenshots were visually reviewed.

All 45 unit tests passed. Type checking found zero errors and eight existing unused-CSS warnings. The static production build succeeded.

Cloudflare Worker deployment succeeded: `4225136f-c1bc-4383-9f7a-cf759fb6718c`. The custom domain returned HTTP 200; its `/_app/version.json` matched the local build (`1790697626956`). Live browser navigation timed out from this environment, so the live browser matrix is not claimed as passed.

Concurrent interface/image edits in the original checkout were preserved, not committed or included in this isolated deployment.
