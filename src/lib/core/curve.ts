import type { OperatingPoint } from './types';

export class CurveRangeError extends RangeError {
  readonly minimum: number;
  readonly maximum: number;
  readonly requested: number;

  constructor(requested: number, minimum: number, maximum: number) {
    super(`Operating point ${requested} is outside tested range ${minimum}–${maximum}`);
    this.name = 'CurveRangeError';
    this.minimum = minimum;
    this.maximum = maximum;
    this.requested = requested;
  }
}

type CurveAxis = 'throttle' | 'thrustN' | 'currentA' | 'rpm';

export function validateOperatingCurve(curve: OperatingPoint[], axis: CurveAxis = 'throttle'): void {
  if (curve.length < 2) throw new Error('An operating curve needs at least two points');
  curve.forEach((point, index) => {
    if (!Number.isFinite(point[axis])) throw new Error(`Curve ${axis} contains a non-finite value`);
    if (index > 0 && point[axis] <= curve[index - 1][axis]) {
      throw new Error(`Curve ${axis} values must be strictly increasing`);
    }
  });
}

export function interpolateOperatingPoint(
  curve: OperatingPoint[],
  requested: number,
  axis: CurveAxis = 'thrustN'
): OperatingPoint {
  const ordered = [...curve].sort((a, b) => a[axis] - b[axis]);
  validateOperatingCurve(ordered, axis);
  const minimum = ordered[0][axis];
  const maximum = ordered.at(-1)![axis];
  if (requested < minimum || requested > maximum) throw new CurveRangeError(requested, minimum, maximum);
  if (requested === minimum) return { ...ordered[0] };
  if (requested === maximum) return { ...ordered.at(-1)! };

  const upperIndex = ordered.findIndex((point) => point[axis] >= requested);
  const lower = ordered[upperIndex - 1];
  const upper = ordered[upperIndex];
  const ratio = (requested - lower[axis]) / (upper[axis] - lower[axis]);
  const interpolate = (from: number, to: number) => from + (to - from) * ratio;
  const efficiency = lower.efficiency != null && upper.efficiency != null
    ? interpolate(lower.efficiency, upper.efficiency)
    : undefined;

  return {
    throttle: interpolate(lower.throttle, upper.throttle),
    thrustN: interpolate(lower.thrustN, upper.thrustN),
    currentA: interpolate(lower.currentA, upper.currentA),
    voltageV: interpolate(lower.voltageV, upper.voltageV),
    rpm: interpolate(lower.rpm, upper.rpm),
    efficiency
  };
}
