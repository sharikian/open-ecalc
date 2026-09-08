import { isComponentDatasetV1 } from './schema';
import type { ComponentDatasetV1 } from './types';

let seedPromise: Promise<ComponentDatasetV1> | undefined;

export function loadSeedDataset(): Promise<ComponentDatasetV1> {
  seedPromise ??= fetch('/data/components.v1.json?v=2026.09-catalog2')
    .then((response) => {
      if (!response.ok) throw new Error(`Component dataset unavailable (${response.status})`);
      return response.json() as Promise<unknown>;
    })
    .then((value) => {
      if (!isComponentDatasetV1(value)) throw new Error('Component dataset schema is invalid');
      return value;
    });
  return seedPromise;
}
