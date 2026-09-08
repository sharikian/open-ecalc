<script lang="ts">
  import * as ECharts from 'echarts';
  import { t } from '$lib/i18n';
  import type { MissionInput, MissionResult } from '$core/types';
  import Chart from './Chart.svelte';
  import RotorCoverage from './RotorCoverage.svelte';
  export let result: MissionResult | null = null;
  export let input: MissionInput;
  const labels = { hover: 'هاور', cruise: 'کروز', climb: 'اوج‌گیری' };
  $: curveOption = result ? ({
    animationDuration: 620,
    animationEasing: 'cubicOut',
    grid: { left: 45, right: 18, top: 24, bottom: 34 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', boundaryGap: false, data: result.points.map((point) => labels[point.name]) },
    yAxis: { type: 'value', name: 'N' },
    series: [{ name: 'رانش', type: 'line', smooth: true, symbolSize: 8, data: result.points.map((point) => point.thrustN), lineStyle: { width: 3, color: '#2f6fed' }, itemStyle: { color: '#2f6fed' }, areaStyle: { color: 'rgba(47,111,237,.10)' } }]
  }) as ECharts.EChartsOption : null;
  $: powerOption = result ? ({
    animationDuration: 620,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', formatter: '{b}: {c} W' },
    legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
    series: [{ type: 'pie', radius: ['48%', '72%'], center: ['50%', '43%'], avoidLabelOverlap: true, label: { show: true, formatter: '{d}%' }, data: [{ value: result.power.propulsiveW, name: 'پروانه', itemStyle: { color: '#2f6fed' } }, { value: result.power.motorLossW, name: 'موتور', itemStyle: { color: '#f28b35' } }, { value: result.power.escLossW, name: 'ESC', itemStyle: { color: '#26b777' } }, { value: result.power.batteryLossW, name: 'باتری', itemStyle: { color: '#8d63e8' } }] }]
  }) as ECharts.EChartsOption : null;
</script>

<section class="results" aria-labelledby="result-title">
  {#if !result}
    <div class="empty"><span class="empty__mark">×</span><h2>خروجی اینجا نمایش داده می‌شود</h2><p>پس از تکمیل ورودی‌ها، محاسبه را اجرا کنید.</p></div>
  {:else}
    <div class="result-heading"><div><span class="kicker">خلاصه</span><h2 id="result-title">نتیجهٔ پرواز</h2></div><span class:danger={result.warnings.some((warning) => warning.severity === 'critical')} class="state">{result.warnings.some((warning) => warning.severity === 'critical') ? 'نیازمند بررسی' : 'قابل قبول'}</span></div>
    <div class="metrics"><article><span class="metric__icon metric__icon--green">◷</span><div><small>{$t('flightTime')}</small><strong class="data">{result.flightTimeMin.toFixed(1)} <em>min</em></strong></div></article><article><span class="metric__icon metric__icon--blue">⌖</span><div><small>{$t('range')}</small><strong class="data">{result.rangeKm.toFixed(1)} <em>km</em></strong></div></article><article><span class="metric__icon metric__icon--orange">↗</span><div><small>رانش به وزن</small><strong class="data">{result.thrustToWeight.toFixed(1)} <em>: 1</em></strong></div></article><article><span class="metric__icon metric__icon--purple">⌃</span><div><small>{$t('ceiling')}</small><strong class="data">{result.ceilingM == null ? '—' : result.ceilingM} <em>{result.ceilingM == null ? '' : 'm'}</em></strong></div></article></div>
    <div class="chart-grid"><article><div class="chart-head"><h3>رانش در نقطه‌های کاری</h3><span class="data">N</span></div>{#if curveOption}<Chart option={curveOption} />{/if}</article><article><div class="chart-head"><h3>توزیع توان</h3><span class="data">{result.totalPowerW.toFixed(0)} W</span></div>{#if powerOption}<Chart option={powerOption} />{/if}</article></div>
    <article class="coverage"><div class="chart-head"><h3>پوشش روتورها</h3><span class="data">{(result.thrustMargin * 100).toFixed(0)}%</span></div><RotorCoverage rotorCount={input.airframe.rotorCount} frameSizeM={input.airframe.frameSizeM} propellerDiameterM={input.propeller.diameterM} layout={input.airframe.layout} /></article>
    <article class="warnings"><div class="chart-head"><h3>{$t('warnings')}</h3><span class="data">{result.warnings.length}</span></div>{#if result.warnings.length === 0}<p>موردی برای بررسی نیست.</p>{:else}<ul>{#each result.warnings as warning}<li class:critical={warning.severity === 'critical'}><b>{warning.severity === 'critical' ? '!' : '·'}</b><span>{warning.code}</span></li>{/each}</ul>{/if}</article>
  {/if}
</section>

<style>
  .results { display: grid; gap: 14px; }.empty { display: grid; min-height: 540px; place-content: center; justify-items: center; gap: 10px; border: 1px dashed var(--line-strong); border-radius: var(--radius); color: var(--muted); text-align: center; }.empty__mark { display: grid; width: 60px; height: 60px; place-items: center; border: 1px dashed var(--line-strong); border-radius: 20px; font-size: 28px; }.empty h2, .empty p { margin: 0; }.empty h2 { color: var(--ink); font-size: 20px; }.empty p { font-size: 14px; }
  .result-heading, .chart-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }.kicker { color: var(--muted); font-size: 12px; }.result-heading h2 { margin: 3px 0 0; font-size: 27px; letter-spacing: -0.04em; }.state { border-radius: 999px; background: color-mix(in oklch, var(--green) 12%, transparent); color: var(--green); padding: 5px 11px; font-size: 12px; }.state.danger { background: color-mix(in oklch, var(--danger) 12%, transparent); color: var(--danger); }
  .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.metrics article { display: flex; align-items: center; gap: 12px; min-width: 0; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); padding: 14px; box-shadow: var(--shadow-soft); }.metric__icon { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: 13px; font-size: 22px; }.metric__icon--green { background: color-mix(in oklch, var(--green) 14%, transparent); color: var(--green); }.metric__icon--blue { background: var(--blue-soft); color: var(--blue); }.metric__icon--orange { background: var(--orange-soft); color: var(--orange); }.metric__icon--purple { background: color-mix(in oklch, #8d63e8 14%, transparent); color: #8d63e8; }.metrics small { display: block; color: var(--muted); font-size: 12px; }.metrics strong { display: block; margin-top: 2px; font-size: 23px; }.metrics em { color: var(--muted); font-size: 12px; font-style: normal; font-weight: 500; }
  .chart-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 14px; }.chart-grid > article, .coverage, .warnings { min-width: 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 16px; box-shadow: var(--shadow-soft); }.chart-head h3 { margin: 0; font-size: 15px; }.chart-head > span { color: var(--muted); font-size: 12px; }.warnings p { margin: 10px 0 0; color: var(--muted); font-size: 13px; }.warnings ul { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; color: var(--orange); font-size: 13px; }.warnings li { display: flex; gap: 8px; align-items: center; }.warnings li.critical { color: var(--danger); }.warnings li b { display: grid; width: 20px; height: 20px; place-items: center; border-radius: 50%; background: currentColor; color: var(--surface); font-size: 12px; }
  @media (max-width: 720px) { .chart-grid { grid-template-columns: minmax(0, 1fr); } }.coverage :global(.coverage) { margin-top: 12px; }
  @media (max-width: 420px) { .metrics { grid-template-columns: minmax(0, 1fr); }.empty { min-height: 320px; } }
</style>
