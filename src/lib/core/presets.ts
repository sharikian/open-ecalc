import type { MissionInput, ProjectFileV1 } from './types';

export const DEFAULT_MISSION_INPUT: MissionInput = {
  airframe: {
    emptyMassKg: 3.4,
    payloadMassKg: 1.2,
    rotorCount: 4,
    layout: 'flat',
    frameSizeM: 0.82
  },
  environment: {
    altitudeM: 500,
    temperatureC: 25,
    pressurePa: 95460
  },
  battery: {
    chemistry: 'LiPo',
    capacityAh: 12,
    series: 6,
    parallel: 1,
    nominalCellVoltageV: 3.7,
    internalResistanceOhm: 0.018,
    continuousC: 20,
    burstC: 30,
    massKg: 1.65,
    usableFraction: 0.8
  },
  esc: {
    continuousCurrentA: 60,
    burstCurrentA: 80,
    resistanceOhm: 0.0025,
    efficiency: 0.96,
    massKg: 0.072
  },
  motor: {
    kv: 380,
    noLoadCurrentA: 1.1,
    resistanceOhm: 0.065,
    maxCurrentA: 65,
    maxPowerW: 1450,
    massKg: 0.205,
    poles: 14
  },
  propeller: {
    diameterM: 0.4572,
    pitchM: 0.1651,
    bladeCount: 2,
    thrustCoefficient: 0.105,
    powerCoefficient: 0.052
  },
  cruiseSpeedMps: 10,
  auxiliaryCurrentA: 1,
  targetThrustMargin: 1.2
};

export function createProject(name = 'پروژه تازه'): ProjectFileV1 {
  const timestamp = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}`,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    units: 'metric',
    input: structuredClone(DEFAULT_MISSION_INPUT)
  };
}

export function exportProject(project: ProjectFileV1): ProjectFileV1 {
  return structuredClone({ ...project, schemaVersion: 1, updatedAt: new Date().toISOString() });
}
