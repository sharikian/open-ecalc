import type { LegacyInput, LegacyResult, MissionInput, MissionResult } from '$core/types';

export type CalculationReport = {
  id: string;
  mode: 'simple' | 'advanced';
  createdAt: string;
  input: MissionInput | LegacyInput;
  result: MissionResult | LegacyResult;
};

const KEY = 'open-ecalc.reports';
function read(): CalculationReport[] {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CalculationReport[]; } catch { return []; }
}
export function listReports(): CalculationReport[] { return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function deleteReport(id: string): void {
  const next = read().filter((report) => report.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}
export function saveReport(report: Omit<CalculationReport, 'id' | 'createdAt'>): CalculationReport {
  const next: CalculationReport = { ...report, id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
  const all = [next, ...read()].slice(0, 100);
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}
