import type { StoredProject } from './types';

export function serializeProject(project: StoredProject): string {
  return JSON.stringify(project, null, 2);
}

export function parseProject(raw: string): StoredProject {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') throw new Error('Project file is not an object');
  const candidate = parsed as Partial<StoredProject>;
  if (candidate.schemaVersion !== 1 || typeof candidate.id !== 'string' || typeof candidate.name !== 'string') {
    throw new Error('Unsupported project file');
  }
  return candidate as StoredProject;
}

export function downloadProject(project: StoredProject): void {
  const blob = new Blob([serializeProject(project)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `${project.name.replace(/[^a-z0-9\u0600-\u06ff-_]+/gi, '-')}.open-ecalc.json`;
  anchor.click();
  URL.revokeObjectURL(href);
}
