import type { Battery, MissionInput } from '$core/types';
import type { ComponentRecord } from '$data/types';

/** Replace all properties belonging to the selected component; never inherit unknown specs. */
export function applyComponent(input: MissionInput, component: ComponentRecord): MissionInput {
  const data = component as unknown as Record<string, unknown>;
  const numeric = (key: string): number => typeof data[key] === 'number' && Number.isFinite(data[key]) ? data[key] as number : NaN;
  if (component.kind === 'battery') {
    const series = numeric('series');
    const cellV = Number.isFinite(numeric('nominalCellVoltageV')) ? numeric('nominalCellVoltageV')
      : Number.isFinite(series) && series > 0 ? numeric('nominalVoltageV') / series : NaN;
    const chemistry = ['LiPo', 'Li-ion', 'LiFePO4'].includes(component.chemistry ?? '') ? component.chemistry as Battery['chemistry'] : '' as Battery['chemistry'];
    return { ...input, battery: { ...input.battery, chemistry,
      capacityAh: numeric('capacityAh'), series, nominalCellVoltageV: cellV,
      internalResistanceOhm: numeric('internalResistanceOhm'), continuousC: numeric('continuousC'),
      burstC: Number.isFinite(numeric('burstC')) ? numeric('burstC') : undefined, massKg: numeric('massKg') } };
  }
  if (component.kind === 'motor') return { ...input, motor: { kv: numeric('kv'), noLoadCurrentA: numeric('noLoadCurrentA'),
    resistanceOhm: numeric('resistanceOhm'), maxCurrentA: numeric('maxCurrentA'), maxPowerW: numeric('maxPowerW'),
    massKg: numeric('massKg'), poles: Number.isFinite(numeric('poles')) ? numeric('poles') : undefined,
    thermalResistanceCPerW: Number.isFinite(numeric('thermalResistanceCPerW')) ? numeric('thermalResistanceCPerW') : undefined },
    propeller: { ...input.propeller, curve: undefined } };
  if (component.kind === 'esc') return { ...input, esc: { continuousCurrentA: numeric('continuousCurrentA'), burstCurrentA: numeric('burstCurrentA'),
    resistanceOhm: numeric('resistanceOhm'), efficiency: numeric('efficiency'), massKg: numeric('massKg') } };
  return { ...input, propeller: { diameterM: numeric('diameterM'), pitchM: numeric('pitchM'), bladeCount: numeric('bladeCount'),
    thrustCoefficient: Number.isFinite(numeric('thrustCoefficient')) ? numeric('thrustCoefficient') : undefined,
    powerCoefficient: Number.isFinite(numeric('powerCoefficient')) ? numeric('powerCoefficient') : undefined, curve: undefined } };
}
