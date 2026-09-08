<script lang="ts">
  import type { LegacyResult } from '$core/types';
  import { locale } from '$lib/i18n';
  export let result: LegacyResult | null = null;
  $: latest = result?.points.at(-1);
  function copy(fa: string, en: string): string { return $locale === 'en' ? en : fa; }
</script>

{#if result}
<section class="legacy-results" aria-live="polite">
    <div class="result-head"><div><span class="kicker">{copy('نتیجه', 'Result')}</span><h2>{copy('خلاصهٔ محاسبه', 'Calculation summary')}</h2></div><span class="chip">{copy('مدل پایه', 'Base model')}</span></div>
    <div class="metric-grid"><article><span>{copy('وزن برخاست', 'Takeoff mass')}</span><strong class="data">{result.takeoffMassG.toFixed(0)}<small> g</small></strong></article><article><span>{copy('ظرفیت پک', 'Pack capacity')}</span><strong class="data">{result.packCapacityAh.toFixed(1)}<small> Ah</small></strong></article><article><span>{copy('زمان قابل استفاده', 'Usable flight time')}</span><strong class="data">{latest?.usableTimeMin.toFixed(1)}<small> min</small></strong></article><article><span>{copy('برد در سرعت انتخابی', 'Range at selected speed')}</span><strong class="data">{latest?.rangeKm.toFixed(1)}<small> km</small></strong></article></div>
    <div class="table-wrap"><table><thead><tr><th>{copy('نقطه', 'Point')}</th><th>{copy('جریان کل', 'Total current')}</th><th>{copy('زمان خام', 'Raw time')}</th><th>{copy('زمان قابل استفاده', 'Usable time')}</th><th>{copy('برد', 'Range')}</th></tr></thead><tbody>{#each result.points as point, index}<tr><td class="data">{String(index + 1).padStart(2, '0')}</td><td class="data">{point.totalCurrentA.toFixed(1)} A</td><td class="data">{point.rawTimeMin.toFixed(1)} min</td><td class="data">{point.usableTimeMin.toFixed(1)} min</td><td class="data">{point.rangeKm.toFixed(1)} km</td></tr>{/each}</tbody></table></div>
</section>
{/if}

<style>
  .legacy-results { min-height: 100%; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-soft); padding: 22px; }
  .result-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; }.kicker { color: var(--muted); font-size: 12px; }.result-head h2 { margin: 4px 0 0; font-size: 24px; }.chip { border-radius: 999px; background: var(--blue-soft); color: var(--blue-ink); padding: 5px 10px; font-size: 12px; }
  .metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }.metric-grid article { display: grid; gap: 7px; border: 1px solid var(--line); border-radius: 12px; padding: 14px; }.metric-grid span { color: var(--muted); font-size: 13px; }.metric-grid strong { font-size: 23px; }.metric-grid small { color: var(--muted); font-size: 12px; font-weight: 500; }
  .table-wrap { overflow-x: auto; margin-top: 22px; } table { width: 100%; min-width: 510px; border-collapse: collapse; font-size: 13px; } th, td { padding: 11px 8px; border-bottom: 1px solid var(--line); text-align: right; } th { color: var(--muted); font-size: 12px; font-weight: 500; }
  @media (max-width: 560px) { .legacy-results { padding: 16px; }.metric-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
