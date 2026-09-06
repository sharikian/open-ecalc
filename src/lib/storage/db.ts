import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PreferenceRecord, StoredProject } from './types';

interface OpenEcalcDatabase extends DBSchema {
  projects: {
    key: string;
    value: StoredProject;
    indexes: { 'by-updated': string };
  };
  preferences: {
    key: string;
    value: PreferenceRecord;
  };
}

let databasePromise: Promise<IDBPDatabase<OpenEcalcDatabase>> | undefined;

export function openLocalDatabase(): Promise<IDBPDatabase<OpenEcalcDatabase>> {
  databasePromise ??= openDB<OpenEcalcDatabase>('open-ecalc', 1, {
    upgrade(database) {
      const projects = database.createObjectStore('projects', { keyPath: 'id' });
      projects.createIndex('by-updated', 'updatedAt');
      database.createObjectStore('preferences', { keyPath: 'key' });
    }
  });
  return databasePromise;
}

export async function saveProject(project: StoredProject): Promise<void> {
  const database = await openLocalDatabase();
  await database.put('projects', project);
}

export async function listProjects(): Promise<StoredProject[]> {
  const database = await openLocalDatabase();
  return (await database.getAllFromIndex('projects', 'by-updated')).reverse();
}

export async function loadProject(id: string): Promise<StoredProject | undefined> {
  const database = await openLocalDatabase();
  return database.get('projects', id);
}

export async function removeProject(id: string): Promise<void> {
  const database = await openLocalDatabase();
  await database.delete('projects', id);
}

export async function setPreference(key: string, value: string): Promise<void> {
  const database = await openLocalDatabase();
  await database.put('preferences', { key, value });
}

export async function getPreference(key: string): Promise<string | undefined> {
  const database = await openLocalDatabase();
  return (await database.get('preferences', key))?.value;
}

