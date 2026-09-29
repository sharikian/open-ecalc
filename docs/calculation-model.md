# Calculation model

Open eCalc exposes two deliberately separate calculation paths. All public
inputs are converted to SI before either path runs.

## Legacy workbook model

`calculateLegacyExcel` preserves the equations in `drone design.xlsx` without
reinterpreting them:

- takeoff mass = empty mass + payload + battery mass × parallel packs;
- pack capacity = listed capacity × parallel packs;
- total current = current per motor × rotor count;
- raw time = capacity Ah ÷ (total current + 1 A) × 60;
- usable time = raw time × 0.8;
- range = capacity Ah ÷ (total current + 1 A) × speed in km/h;
- cruise, climb and emergency thrust factors are 1.5, 2.0 and 2.2.

The `+1 A` term is treated as an avionics/auxiliary allowance. The 80% factor
is treated as usable battery capacity. Both are workbook assumptions, not
universal physical constants. They remain unchanged until the drone engineer
approves a revision.

The interface accepts battery capacity in mAh and converts it to Ah. The
headline range uses the same 80% available capacity as headline duration;
the workbook table retains the original full-capacity range.

## Physical mission model

The complementary model uses static propeller coefficients or a measured
operating curve. Measured curves are interpolated piecewise; a requested point
outside their tested range raises `CurveRangeError` and is never silently
extrapolated.

Air density is computed from pressure and temperature. If pressure is absent,
the ISA troposphere relation estimates it from altitude. Battery voltage sag
uses pack internal resistance; motor, ESC and battery resistive losses are
reported separately. Endurance uses the hover point and range uses the cruise
point. Ceiling is solved where available thrust equals weight; the recommended
ceiling applies a configurable margin with a default of 1.2.

Battery terminal voltage and operating current are solved together by bisection,
including the auxiliary current. Configurations that cannot satisfy hover,
cruise or climb thrust are rejected instead of substituting maximum throttle.
Measured curves differing from the calculated battery voltage by more than
10% are rejected; the engine does not silently transfer a curve to another supply.

Motor temperature is intentionally absent unless a thermal-resistance value is
supplied. A missing temperature is rendered as `—`, not guessed.

## Boundaries

The coefficient model is an engineering estimate, not a certification model.
It currently treats propeller coefficients as static, models the troposphere
only to 10 km and does not model forward-flight drag from airframe geometry.
Measured powertrain curves should be preferred whenever available.
