import type {
  BatteryComponent,
  ComponentRecord,
  EscComponent,
  ImportIssue,
  MotorComponent,
  PropellerComponent
} from './types';

function positive(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function validateComponentRecords(records: ComponentRecord[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const ids = new Set<string>();
  const hashes = new Set<string>();

  records.forEach((record, index) => {
    const row = index + 1;
    if (ids.has(record.id)) issues.push({ row, field: 'id', code: 'duplicate', message: `Duplicate id: ${record.id}` });
    ids.add(record.id);
    const identityHash = `${record.kind}:${record.sourceHash}:${record.model}`;
    if (hashes.has(identityHash)) issues.push({ row, field: 'sourceHash', code: 'duplicate', message: 'Duplicate source record' });
    hashes.add(identityHash);

    if (!record.sourceUrl || !record.licenseSpdx || !record.sourceHash) {
      issues.push({ row, code: 'missing', message: 'Source URL, licence and hash are required' });
    }

    // Legacy hand-authored records keep their completeness requirements. Imported
    // product listings can be partial: absent fields are unknown, not zeros/defaults.
    const required = !record.referenceOnly && !record.productType
      ? record.kind === 'battery'
        ? [record.capacityAh, record.nominalVoltageV, record.continuousC, record.internalResistanceOhm, record.massKg]
        : record.kind === 'esc'
          ? [record.continuousCurrentA, record.burstCurrentA, record.efficiency, record.massKg]
          : record.kind === 'motor'
            ? [record.kv, record.maxCurrentA, record.maxPowerW, record.massKg]
            : [record.diameterM, record.pitchM, record.bladeCount]
      : [];
    if (!required.every(positive)) issues.push({ row, code: 'invalid', message: 'Required physical quantities must be finite and positive' });

    const numericFields: Array<[string, number | undefined]> = record.kind === 'battery'
      ? [['capacityAh', record.capacityAh], ['nominalVoltageV', record.nominalVoltageV], ['nominalCellVoltageV', record.nominalCellVoltageV], ['continuousC', record.continuousC], ['burstC', record.burstC], ['internalResistanceOhm', record.internalResistanceOhm], ['massKg', record.massKg], ['energyWh', record.energyWh]]
      : record.kind === 'esc'
        ? [['continuousCurrentA', record.continuousCurrentA], ['burstCurrentA', record.burstCurrentA], ['resistanceOhm', record.resistanceOhm], ['efficiency', record.efficiency], ['massKg', record.massKg]]
        : record.kind === 'motor'
          ? [['kv', record.kv], ['noLoadCurrentA', record.noLoadCurrentA], ['resistanceOhm', record.resistanceOhm], ['maxCurrentA', record.maxCurrentA], ['maxPowerW', record.maxPowerW], ['massKg', record.massKg], ['maxThrustN', record.maxThrustN]]
          : [['diameterM', record.diameterM], ['pitchM', record.pitchM], ['bladeCount', record.bladeCount], ['massKg', record.massKg]];
    for (const [field, value] of numericFields) {
      if (value !== undefined && !positive(value)) issues.push({ row, field, code: 'invalid', message: `${field} must be finite and positive when present` });
    }

    if (record.kind === 'motor' && record.kvOptions?.some((kv) => !positive(kv))) {
      issues.push({ row, field: 'kvOptions', code: 'invalid', message: 'KV options must be finite and positive' });
    }

    if (record.kind === 'esc' && positive(record.efficiency) && record.efficiency > 1) {
      issues.push({ row, field: 'efficiency', code: 'invalid', message: 'Efficiency cannot exceed 1' });
    }
    if (record.kind === 'propeller' && record.testCurve) {
      const ordered = record.testCurve.every((point, pointIndex, curve) =>
        pointIndex === 0 || point.rpm >= curve[pointIndex - 1].rpm
      );
      if (!ordered) issues.push({ row, field: 'testCurve', code: 'unordered-curve', message: 'Test points must be ordered by RPM' });
    }
    if (record.kind === 'motor' && record.benchCurves) {
      record.benchCurves.forEach((curve, curveIndex) => {
        const ordered = curve.points.every((point, pointIndex, points) =>
          Number.isFinite(point.throttlePercent) &&
          Number.isFinite(point.rpm) &&
          Number.isFinite(point.thrustN) &&
          (pointIndex === 0 || point.throttlePercent >= points[pointIndex - 1].throttlePercent)
        );
        if (curve.points.length < 3 || !ordered) {
          issues.push({ row, field: `benchCurves.${curveIndex}`, code: 'unordered-curve', message: 'Motor bench curves need at least three finite, throttle-ordered points' });
        }
      });
    }
  });
  return issues;
}

export interface CompatibilityReport {
  compatible: boolean;
  issues: string[];
}

export function validatePowertrainCompatibility(
  battery: BatteryComponent,
  esc: EscComponent,
  motor: MotorComponent,
  rotorCount: number
): CompatibilityReport {
  const issues: string[] = [];
  if (esc.productType === 'fc-esc-stack') issues.push('integrated-stack-is-not-a-standalone-esc');
  if (positive(motor.maxCurrentA) && positive(esc.continuousCurrentA) && motor.maxCurrentA > esc.continuousCurrentA) issues.push('motor-current-exceeds-esc');
  if (positive(battery.capacityAh) && positive(battery.continuousC) && positive(motor.maxCurrentA)) {
    const batteryLimitA = battery.capacityAh * battery.continuousC;
    const systemDemandA = motor.maxCurrentA * rotorCount;
    if (systemDemandA > batteryLimitA) issues.push('system-current-exceeds-battery');
  }
  if (positive(battery.nominalVoltageV) && positive(motor.maxCurrentA) && positive(motor.maxPowerW) && battery.nominalVoltageV * motor.maxCurrentA > motor.maxPowerW * 1.1) issues.push('motor-power-limit');
  if (!positive(battery.capacityAh) || !positive(battery.continuousC)) issues.push('battery-limit-data-incomplete');
  if (!positive(esc.continuousCurrentA)) issues.push('esc-limit-data-incomplete');
  if (!positive(motor.maxCurrentA) || !positive(motor.maxPowerW)) issues.push('motor-limit-data-incomplete');
  return { compatible: issues.length === 0, issues };
}

export function propellerTipClearance(propeller: PropellerComponent, frameSizeM: number, rotorCount: number): number | undefined {
  if (!positive(propeller.diameterM)) return undefined;
  if (rotorCount !== 4) return frameSizeM - propeller.diameterM;
  return frameSizeM / Math.SQRT2 - propeller.diameterM;
}
