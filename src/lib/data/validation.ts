import type {
  BatteryComponent,
  ComponentRecord,
  EscComponent,
  ImportIssue,
  MotorComponent,
  PropellerComponent
} from './types';

function positive(value: number | undefined): boolean {
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

    const required = record.kind === 'battery'
      ? [record.capacityAh, record.nominalVoltageV, record.continuousC, record.internalResistanceOhm, record.massKg]
      : record.kind === 'esc'
        ? [record.continuousCurrentA, record.burstCurrentA, record.efficiency, record.massKg]
        : record.kind === 'motor'
          ? [record.kv, record.maxCurrentA, record.maxPowerW, record.massKg]
          : [record.diameterM, record.pitchM, record.bladeCount];
    if (!required.every(positive)) issues.push({ row, code: 'invalid', message: 'Physical quantities must be finite and positive' });

    if (record.kind === 'esc' && record.efficiency > 1) {
      issues.push({ row, field: 'efficiency', code: 'invalid', message: 'Efficiency cannot exceed 1' });
    }
    if (record.kind === 'propeller' && record.testCurve) {
      const ordered = record.testCurve.every((point, pointIndex, curve) =>
        pointIndex === 0 || point.rpm >= curve[pointIndex - 1].rpm
      );
      if (!ordered) issues.push({ row, field: 'testCurve', code: 'unordered-curve', message: 'Test points must be ordered by RPM' });
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
  const batteryLimitA = battery.capacityAh * battery.continuousC;
  const systemDemandA = motor.maxCurrentA * rotorCount;
  if (motor.maxCurrentA > esc.continuousCurrentA) issues.push('motor-current-exceeds-esc');
  if (systemDemandA > batteryLimitA) issues.push('system-current-exceeds-battery');
  if (battery.nominalVoltageV * motor.maxCurrentA > motor.maxPowerW * 1.1) issues.push('motor-power-limit');
  return { compatible: issues.length === 0, issues };
}

export function propellerTipClearance(propeller: PropellerComponent, frameSizeM: number, rotorCount: number): number {
  if (rotorCount !== 4) return frameSizeM - propeller.diameterM;
  return frameSizeM / Math.SQRT2 - propeller.diameterM;
}
