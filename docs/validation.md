# Validation record

## Workbook golden tests

Four sheets from `drone design.xlsx` are represented in automated tests. The
`Z30 - X11 plus`, `G620 - X9 PLUS` and `X9` sheets are byte-for-byte equivalent
in their input region and must produce identical results. `S10-X8` uses the
same motor points with a lighter airframe and 32 Ah pack; its cached results are
asserted separately.

## Property checks

The test suite asserts that added capacity cannot reduce endurance when mass is
held fixed, added payload cannot improve ceiling or endurance, scalar outputs
remain finite and non-negative, and measured curves reject out-of-range points.
Ceiling cases cover normal, hot/high and insufficient-thrust conditions.

## External benchmark

An eCalc comparison is retained as a manual benchmark, not as a source of code,
formulae or component data. The documented scenario uses a 500 m site, 25 °C,
four flat rotors, a 3S 4 Ah battery, 10 × 4.7 propellers and an 850 g airframe.
The observed eCalc hover time was 24.8 min and total maximum electrical power
was 1126.1 W. Open eCalc does not claim parity until the same physical component
curve can be redistributed and the input definitions are aligned.

Bench tests take precedence over either calculator. Record future comparisons
with source files, ambient conditions, instrumentation and uncertainty.
