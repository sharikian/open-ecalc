# Popular brand component supplement research

Research snapshot: 2026-09-29. The supplement contains 26 sourced fact records: 3 Tattu batteries, 14 motors (Hobbywing, T-Motor, iFlight, EMAX), 6 Gemfan propellers, and 3 Hobbywing standalone ESCs. These resolve to 11 new catalog models plus 15 enrichment records targeting 9 existing catalog records. Sources below are official manufacturer product pages or manufacturer product literature. Model options with distinct windings/KV or geometry are tracked distinctly; color and packaging variants are not.

## Source evidence and model distinctions

| Records | Primary source | Distinction / evidence used |
| --- | --- | --- |
| Tattu R-Line V6 1300/1480/1600 mAh 6S ST | [1300mAh ST product page](https://genstattu.com/tattu-r-line-v6-1300mah-6s-160c-22-2v-st-lipo-battery-with-xt60-plug/), [R-Line V6 model table](https://genstattu.com/blog/the-allnew-tattu-rline-version-6-0-a-bold-leap-in-fpv-battery-evolution/), [official R-Line 6.0 catalog](https://www.genstattu.com/tattu-r-line-version-6-0-batteries/) | Separate ST stick models; capacity and 6S1P from model identifiers; 1300mAh page states 22.2V and ±20g; the maker's model table gives mass ±5g for 1480 and 1600 models. Nominal voltage on latter entries follows the listed 6S LiPo designation and is called out as derived in conditions. |
| Hobbywing XRotor 2405 1800/2250/2850KV | [XRotor 2405 manufacturer page](https://www.hobbywing.com/en/products/xrotor-2405182) | The KV variants have distinct no-load current and winding resistance; source lists 4S and maximum continuous current/power. Mass is omitted because the page's headline weight (33.4 g) conflicts with its specification table (35.5 g). These records omit the test-curve data. |
| T-Motor F60PRO V 2207.5 1750/1950/2020/2550KV | [F60PRO V product page](https://store.tmotor.com/product/f60prov-fpv-motor.html) | Four separate winding choices. Mass includes cable. Peak current and max power are the maker's 10-second values; the 2550KV values use its 16.8V test row, other variants use 25.2V. |
| T-Motor F60PRO V-LV 1950/2020KV | [F60PRO V-LV product page](https://store.tmotor.com/product/f60prov-lv-fpv-motor.html) | Lightweight model is kept distinct from standard F60PRO V. Separate KV records use the page's matching row; weight includes cable, and peak current/max power are 10-second values. |
| iFlight XING2 2207 1855/2755KV | [XING2 2207 product page](https://shop.iflight.com/xing2-2207-4s-6s-fpv-motor-unibell-pro1464) | Two distinct KV selections; weight includes wire. The manufacturer provides variant-specific resistance, peak current, and maximum watts. |
| EMAX ECO II 2207 1700/1900/2400KV | [ECO II 2207 product page](https://emaxmodel.com/products/emax-eco-ii-series-2207-3-6s-1700kv-1900kv-2400kv-brushless-motor-for-rc-drone-fpv-racing) | Three KV options, 3–6S as stated in the product title. The page doesn't expose numeric mass/load values, so only KV and cell range are included. |
| Gemfan 51466 MCK V2, 51433, 51499, 5129 YUKI, 51366 MCK ReV3, 5127 | [51466 V2](https://www.gemfanhobby.com/hurricane-51466-v2-pc-3-blade.html), [51433](https://www.gemfanhobby.com/51433-hurricane-pc-3-blade.html), [51499](https://www.gemfanhobby.com/51499-hurricane-pc-3-blade.html), [5129 YUKI](https://www.gemfanhobby.com/5129-yuki-pc-3-blade.html), [51366 ReV3](https://www.gemfanhobby.com/mck-51366-rev3-pc-3-blade.html), [5127](https://www.gemfanhobby.com/5127-hurricane-pc-3-blade.html) | Each is a different manufacturer model/geometry. Diameter and pitch inches were converted to meters; explicitly published millimeter diameters were preserved in meters. Per-prop mass, three-blade count, and PC material are included where shown. |
| Hobbywing XRotor Pro H60A 6S FOC | [H60A 6S FOC product page](https://www.hobbywing.com/en/products/xrotorh60a6sfoc) | An individual motor ESC, 40A with good heat dissipation, 60A for 3 seconds, 12–27V input, mass without cable. |
| Hobbywing XRotor H60A 14S BLDC / Pro H60A 14S FOC | [H60A 14S product page](https://www.hobbywing.com/en/products/xrotor-h60a-14s-foc--bldc-v1126.html) | Two distinct drive types. Both list 25A with good heat dissipation, 60A for 3 seconds, and 44–63V input; weights differ and exclude wires. Neither is an FC/ESC stack. |

## Omitted facts and limits

No values were inferred for internal resistance, no-load current, efficiency, temperatures, or thermal behavior when the linked maker source did not provide that fact for the exact model. Test results are not transcribed into bench curves. Advertised peak ratings remain identified as peaks, with duration recorded only where the manufacturer gives it. The 1480mAh and 1600mAh battery nominal voltage is derived from the explicitly stated 6S LiPo configuration (3.7V nominal per LiPo cell), unlike the 1300mAh page that directly states 22.2V.

## Duplicate check

Compared model families, KV options/specifications, and variant names against `data/supplements/known-brand-products.v1.json`, `data/normalized/components.v1.json`, and `static/data/components.v1.json` on 2026-09-29. Fifteen records target existing entries rather than adding duplicate catalog rows:

- Tattu R-Line V6 1600mAh 6S ST targets `fpvdb-battery-tattu-r-line-v6-0-1600mah-6s`.
- EMAX ECO II 2207 1700/1900/2400KV target `fpvdb-motor-emax-eco-ii-series-2207`; all three KV values already exist in its `kvOptions`.
- iFlight XING2 2207 1855/2755KV target `fpvdb-motor-iflight-xing2-2207`. 1855KV already exists in `kvOptions`; 2755KV is a newly sourced option for that family.
- T-Motor F60PRO V 2207.5 variants target `fpvdb-motor-t-motor-f60-pro-v-2207-5`; 1750/2020/2550KV already exist, and 1950KV is a newly sourced option. The existing record has variant-level `kvSpecifications` that remain intact.
- T-Motor F60PRO V-LV 1950KV and 2020KV target their matching existing records `fpvdb-motor-t-motor-f60-pro-v-lv-2207-5` and `fpvdb-motor-t-motor-f60-2207-5-pro-v-lv` respectively.
- Gemfan 51433, 51466 MCK V2, and 51366 MCK ReV3 target `fpvdb-propeller-gemfan-hurricane-51433-durable-tri-blade-5-prop-choose-your`, `fpvdb-propeller-gemfan-hurricane-mck-51466-3-v2-tri-blade-5-1-prop-choose`, and `fpvdb-propeller-gemfan-mck-rev3-51366-3-durable-tri-blade-5-prop-choose-your`.

The other 11 records are new models: two Tattu R-Line V6 ST batteries (1300 and 1480mAh), three Hobbywing XRotor 2405 KV variants, three Gemfan propellers (51499, 5129 YUKI, and 5127), and three Hobbywing H60A ESC variants. Existing Hobbywing ESC data cover different H80/H110/40A products, not these H60A products.

This is a curated sample, not a complete brand catalog. No BrotherHobby, CNHL, Gens Ace, or HQProp entries were added in this pass; the supplement prioritizes sourced models that were checked against the existing catalog and maps overlaps to enrichments. No guessed or unsupported numeric values were added.
