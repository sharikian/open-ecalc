# Selected brand additions — 2026-09-29

Twelve real standalone ESC models were added, separate from the FPV-DB FC/ESC stacks:

| Manufacturer | Models |
| --- | --- |
| Hobbywing | XRotor Pro 40A 6S BLDC A/B; XRotor Pro H80A 14S FOC; XRotor Pro H110A 14S BLDC (non-IPC) |
| APD | 40F3; 80F3[X]; 100F3[X]; 120F3[X]; 200F3[X] |
| T-Motor | FLAME 60A 12S V2.0; FLAME 80A 12S V2.0; FLAME 100A 14S |

Primary sources are linked per field in `data/supplements/known-brand-products.v1.json` and generated records. Hobbywing specifications: [40A A/B](https://www.hobbywing.com/en/products/xrotor-pro-40a120), [H80A](https://www.hobbywing.com/en/products/xrotorh80a14sfoc), [H110A](https://www.hobbywing.com/en/products/xrotor-pro-h110a-14s-bldc). APD specifications: [F Series](https://docs.powerdrives.net/products/f_series). T-Motor specifications: [60A](https://store.tmotor.com/goods.php?id=370), [80A](https://store.tmotor.com/goods.php?id=830), [100A](https://store.tmotor.com/goods.php?id=387).

Important distinctions:

- H80A's listed sustained limit is 40 A with effective cooling, not 80 A. Its peak is 100 A for 3 seconds.
- H110A's listed sustained limit is 50 A at 28 C with 7 m/s airflow; 110 A is a 15-second peak under that airflow.
- APD's sustained ratings use a 60-second full-throttle test with 33 m/s airflow. They are not an unconditional indefinite-current guarantee. The family-level “up to 14S” statement is not assigned to every model.
- Hobbywing 40A variants retain separate masses. T-Motor FLAME weights were not available as reliable text in these sources and remain absent.
- Resistance and efficiency are unknown, not inferred from ratings. Selecting a model leaves those required solver inputs blank for manual entry. The source conditions stay in the catalog; the core remains an approximate electrical model, not a thermal qualification tool.

No product images, marketing prose, full manuals or manufacturer catalog databases are copied. These are a small set of attributed factual specifications, not an open-licensed manufacturer dataset. Rights remain `NOASSERTION`; no MIT/CC licence is invented for the source pages.

FPV-DB counts are unchanged. Default selectable components increase from 851 to 863; the 732 estimated references stay opt-in. Total bundled components are 1,595. Aircraft remain 257. With 20 locations, the default catalog has 1,140 records.

The importer discards its previous generated brand rows before rebuilding, hashes each source fact record, records the snapshot hash in manifests and rejects duplicated normal brand/model identities. User-created records and overrides are untouched. Regression tests verify counts, provenance, missing fields and name-vs-rating distinctions.

Verification: 45 tests across 11 files passed; type checking reported zero errors (eight pre-existing CSS warnings); the static production build succeeded. Checks ran in an isolated checkout so concurrent interface/image edits were not included in this change.
