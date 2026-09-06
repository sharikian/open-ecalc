export interface StoredProject<TPayload = unknown> {
  id: string;
  name: string;
  schemaVersion: 1;
  updatedAt: string;
  payload: TPayload;
}

export interface PreferenceRecord {
  key: string;
  value: string;
}

