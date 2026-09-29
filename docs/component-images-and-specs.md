# Component images, common brands and numeric precision

## Generated assets

Five transparent component illustrations were generated with the built-in `image_gen` tool, inspected, and converted to 256px WebP thumbnails with their alpha retained. They are category illustrations, not manufacturer photographs or exact depictions of named models. No logos, copied product photos or marketing text are included.

The final files are `static/data/images/generated-catalog-v2/{motor,battery,propeller,esc,stack}.webp`. Together they occupy 71,594 bytes. The complete prompt set, original generation filenames and final SHA-256 hashes are saved in [the image manifest](../data/supplements/catalog-images.v1.json).

The prompts request a single realistic, centered engineering-component rendering with transparent background, no text or brand marks: a black/copper FPV motor, a wrapped LiPo pack with XT60 connector, a three-blade propeller, a heat-sink standalone ESC, and a two-board FC/ESC stack. The full wording is retained in the manifest rather than repeated here. `scripts/prepare-catalog-images.mjs` regenerates the optimized assets from the selected source PNGs supplied as a directory argument.

All 874 default component records use the appropriate generated category thumbnail. FC/ESC stacks remain distinguished from standalone controllers. Images have independent provenance; assigning an illustration does not change component source rights or imply an exact product photograph. Airframes and user-created images are not replaced.

## Reviewed dataset additions

Luna researched official manufacturer pages; manager review checked representative primary sources and semantic model/KV duplicates. This was primary-source web research, not an invocation of a separate hosted Deep Research plugin.

The supplement contains 26 sourced model/variant fact rows: 11 genuinely new catalog entries and 15 enrichments for 9 existing catalog IDs. The new entries are two Tattu battery packs, three Hobbywing XRotor motor KV variants, three Hobbywing standalone ESCs and three Gemfan propellers. Existing T-Motor, iFlight, EMAX, Tattu and Gemfan entries are enriched without duplicate rows. Two additional selectable KV variants are included within existing motor families.

Default component count: 874. Estimated references: 732, still opt-in. Bundled component count: 1,606. With 257 aircraft and 20 locations, the default catalog shows 1,151 records. These are catalog counts, not claims of eCalc coverage.

Per-field source URLs, rights and operating conditions are retained, including T-Motor's 10-second peak limits. Conflicting XRotor 2405 mass values are omitted. Unpublished motor no-load current, internal resistance, ESC efficiency and battery resistance remain absent rather than guessed. [Research details and mappings](popular-brands-research.md) list all included models and enrichment targets. Small attributed manufacturer facts retain `NOASSERTION` rights; the base FPV-DB data retains CC BY 4.0. Full proprietary catalogs are not copied or relicensed.

## Display precision and verification

Numeric fields and component editors show at most three fractional digits, without trailing zero padding. All stored SI values and engine calculations keep their original precision. Saving an editor without changing a rounded numeric field retains its source value, including values that round below 0.001. Explicit edits are applied as entered.

51 tests across 14 files passed; the importer reproduced the same dataset hash on a repeated run. Type checking found zero errors (eight existing unused-CSS warnings), and the production build passed. Browser checks passed in eight combinations of Persian/English, light/dark and 375/1440px: thumbnails loaded, no horizontal overflow occurred, the editor displayed at most three fractional digits, and saving unchanged fields retained their exact diameter and pitch. Desktop and mobile viewport screenshots were visually reviewed. Chromium full-page RTL captures were offset despite correct DOM bounds; viewport captures were used for visual inspection instead.

Published to the existing Cloudflare Worker as version `30f32ed1-4285-4e8e-89a7-4511efd79e26`. The custom domain `uav.sharik.dev` returned the matching build version, a catalog containing 1,606 bundled/874 default component rows (all 874 with illustration metadata), and the exact motor thumbnail hash. Concurrent edits in the original checkout were preserved and excluded from this isolated change.
