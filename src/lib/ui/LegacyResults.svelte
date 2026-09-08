<script lang="ts">
  import type { LegacyResult } from '$core/types';
  export let result: LegacyResult | null = null;
  $: latest = result?.points.at(-1);
</script>

<section class="legacy-results" aria-live="polite">
  {#if !result}
    <div class="empty"><span class="empty__mark">+</span><h2>نتیجه هنوز آماده نیست</h2><p>نقاط کاری را وارد کنید و محاسبه را بزنید.</p></div>
  {:else}
    <div class="result-head"><div><span class="kicker">نتیجه</span><h2>خلاصهٔ محاسبه</h2></div><span class="chip">مدل پایه</span></div>
    <div class="metric-grid"><article><span>وزن برخاست</span><strong class="data">{result.takeoffMassG.toFixed(0)}<small> g</small></strong></article><article><span>ظرفیت پک</span><strong class="data">{result.packCapacityAh.toFixed(1)}<small> Ah</small></strong></article><article><span>زمان قابل استفاده</span><strong class="data">{latest?.usableTimeMin.toFixed(1)}<small> min</small></strong></article><article><span>برد در سرعت انتخابی</span><strong class="data">{latest?.rangeKm.toFixed(1)}<small> km</small></strong></article></div>
    <div class="table-wrap"><table><thead><tr><th>نقطه</th><th>جریان کل</th><th>زمان خام</th><th>زمان قابل استفاده</th><th>برد</th></tr></thead><tbody>{#each result.points as point, index}<tr><td class="data">{String(index + 1).padStart(2, '0')}</td><td class="data">{point.totalCurrentA.toFixed(1)} A</td><td class="data">{point.rawTimeMin.toFixed(1)} min</td><td class="data">{point.usableTimeMin.toFixed(1)} min</td><td class="data">{point.rangeKm.toFixed(1)} km</td></tr>{/each}</tbody></table></div>
  {/if}
</section>

<style>
  .legacy-results { min-height: 100%; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-soft); padding: 22px; }
  .empty { display: grid; min-height: 310px; place-content: center; justify-items: center; gap: 10px; text-align: center; }.empty__mark { display: grid; width: 60px; height: 60px; place-items: center; border: 1px dashed var(--line-strong); border-radius: 18px; color: var(--muted); font-size: 28px; }.empty h2, .empty p { margin: 0; }.empty h2 { font-size: 20px; }.empty p { color: var(--muted); font-size: 14px; }
  .result-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; }.kicker { color: var(--muted); font-size: 12px; }.result-head h2 { margin: 4px 0 0; font-size: 24px; }.chip { border-radius: 999px; background: var(--blue-soft); color: var(--blue-ink); padding: 5px 10px; font-size: 12px; }
  .metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }.metric-grid article { display: grid; gap: 7px; border: 1px solid var(--line); border-radius: 12px; padding: 14px; }.metric-grid span { color: var(--muted); font-size: 13px; }.metric-grid strong { font-size: 23px; }.metric-grid small { color: var(--muted); font-size: 12px; font-weight: 500; }
  .table-wrap { overflow-x: auto; margin-top: 22px; } table { width: 100%; min-width: 510px; border-collapse: collapse; font-size: 13px; } th, td { padding: 11px 8px; border-bottom: 1px solid var(--line); text-align: right; } th { color: var(--muted); font-size: 12px; font-weight: 500; }
  @media (max-width: 560px) { .legacy-results { padding: 16px; }.metric-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
