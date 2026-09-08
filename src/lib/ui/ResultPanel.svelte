<script lang="ts">
  import * as ECharts from 'echarts';
  import { t } from '$lib/i18n';
  import type { MissionInput, MissionResult } from '$core/types';
  import Chart from './Chart.svelte';
  import Icon from './Icon.svelte';
  import RotorCoverage from './RotorCoverage.svelte';
  export let result: MissionResult | null = null;
  export let input: MissionInput;
  const labels = { hover: 'هاور', cruise: 'کروز', climb: 'اوج‌گیری' };
  const warningLabels: Record<string, string> = {
    'battery-continuous-current': 'جریان دائم باتری',
    'battery-burst-current': 'جریان لحظه‌ای باتری',
    'esc-continuous-current': 'جریان دائم ESC',
    'esc-burst-current': 'جریان لحظه‌ای ESC',
    'motor-current': 'جریان مجاز موتور',
    'motor-power': 'توان مجاز موتور',
    'voltage-sag': 'افت ولتاژ باتری',
    'insufficient-thrust': 'رانش ناکافی',
    'propeller-clearance': 'فاصلهٔ آزاد ملخ',
    'missing-thermal-data': 'دادهٔ حرارتی موتور ناقص'
  };
  $: curveOption = result ? ({
    animationDuration: 680,
    animationEasing: 'cubicOut',
    grid: { left: 42, right: 42, top: 26, bottom: 32 },
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 8, textStyle: { color: '#304a79', fontFamily: 'Vazir' } },
    xAxis: { type: 'category', boundaryGap: false, data: result.points.map((point) => labels[point.name]), axisLine: { lineStyle: { color: '#a7bddc' } }, axisLabel: { color: '#60769d', fontFamily: 'Vazir' } },
    yAxis: { type: 'value', name: 'N', nameTextStyle: { color: '#60769d' }, axisLabel: { color: '#60769d' }, splitLine: { lineStyle: { color: '#d7e4f5' } } },
    series: [{ name: 'رانش', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8, data: result.points.map((point) => point.thrustN), lineStyle: { width: 3, color: '#1167fa' }, itemStyle: { color: '#1167fa', borderColor: '#fff', borderWidth: 2 }, areaStyle: { color: 'rgba(17,103,250,.12)' } }]
  }) as ECharts.EChartsOption : null;
  $: currentOption = result ? ({
    animationDuration: 760,
    animationEasing: 'cubicOut',
    grid: { left: 42, right: 42, top: 26, bottom: 32 },
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 8, textStyle: { color: '#304a79', fontFamily: 'Vazir' } },
    xAxis: { type: 'category', boundaryGap: false, data: result.points.map((point) => labels[point.name]), axisLine: { lineStyle: { color: '#a7bddc' } }, axisLabel: { color: '#60769d', fontFamily: 'Vazir' } },
    yAxis: [{ type: 'value', name: 'A', axisLabel: { color: '#60769d' }, splitLine: { lineStyle: { color: '#d7e4f5' } } }, { type: 'value', name: 'W', axisLabel: { color: '#60769d' }, splitLine: { show: false } }],
    series: [{ name: 'جریان', type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, data: result.points.map((point) => point.totalCurrentA), lineStyle: { width: 2.5, color: '#18b879' }, itemStyle: { color: '#18b879', borderColor: '#fff', borderWidth: 2 }, areaStyle: { color: 'rgba(24,184,121,.10)' } }, { name: 'توان', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 7, data: result.points.map((point) => point.totalPowerW), lineStyle: { width: 2.5, color: '#f28b22' }, itemStyle: { color: '#f28b22', borderColor: '#fff', borderWidth: 2 } }]
  }) as ECharts.EChartsOption : null;
  $: powerOption = result ? ({
    animationDuration: 620,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', formatter: '{b}: {c} W' },
    legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10 },
    series: [{ type: 'pie', radius: ['48%', '72%'], center: ['50%', '43%'], avoidLabelOverlap: true, itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { show: true, formatter: '{d}%', color: '#141c56', fontFamily: 'Vazir', fontWeight: 700 }, data: [{ value: result.power.propulsiveW, name: 'پروانه', itemStyle: { color: '#1167fa' } }, { value: result.power.motorLossW, name: 'موتور', itemStyle: { color: '#f28b22' } }, { value: result.power.escLossW, name: 'ESC', itemStyle: { color: '#18b879' } }, { value: result.power.batteryLossW, name: 'باتری', itemStyle: { color: '#8d63e8' } }] }]
  }) as ECharts.EChartsOption : null;
</script>

<section class="results" aria-labelledby="result-title">
  {#if result}
    <div class="result-heading"><div><span class="kicker">خلاصه نتایج</span><h2 id="result-title">نتیجهٔ پرواز</h2></div><span class:danger={result.warnings.some((warning) => warning.severity === 'critical')} class="state">{result.warnings.some((warning) => warning.severity === 'critical') ? 'نیازمند بررسی' : 'قابل قبول'}</span></div>
    <div class="metrics"><article><span class="metric__icon metric__icon--green"><Icon name="clock" size={23} /></span><div><small>{$t('flightTime')}</small><strong class="data">{result.flightTimeMin.toFixed(1)} <em>min</em></strong></div></article><article><span class="metric__icon metric__icon--blue"><Icon name="pin" size={23} /></span><div><small>{$t('range')}</small><strong class="data">{result.rangeKm.toFixed(1)} <em>km</em></strong></div></article><article><span class="metric__icon metric__icon--orange"><Icon name="rocket" size={23} /></span><div><small>رانش به وزن</small><strong class="data">{result.thrustToWeight.toFixed(1)} <em>: 1</em></strong></div></article><article><span class="metric__icon metric__icon--yellow"><Icon name="bolt" size={23} /></span><div><small>توان کل</small><strong class="data">{result.totalPowerW.toFixed(0)} <em>W</em></strong></div></article><article><span class="metric__icon metric__icon--purple"><Icon name="ceiling" size={23} /></span><div><small>{$t('ceiling')}</small><strong class="data">{result.ceilingM == null ? '—' : result.ceilingM} <em>{result.ceilingM == null ? '' : 'm'}</em></strong></div></article></div>
    <div class="chart-grid"><article><div class="chart-head"><h3>رانش در نقطه‌های کاری</h3><span class="data">N</span></div>{#if curveOption}<Chart option={curveOption} />{/if}</article><article><div class="chart-head"><h3>جریان و توان</h3><span class="data">A · W</span></div>{#if currentOption}<Chart option={currentOption} />{/if}</article><article class="chart-grid__power"><div class="chart-head"><h3>توزیع توان</h3><span class="data">{result.totalPowerW.toFixed(0)} W</span></div>{#if powerOption}<Chart option={powerOption} />{/if}</article></div>
    <article class="coverage"><div class="chart-head"><h3>پوشش روتورها</h3><span class="data">{(result.thrustMargin * 100).toFixed(0)}%</span></div><RotorCoverage rotorCount={input.airframe.rotorCount} frameSizeM={input.airframe.frameSizeM} propellerDiameterM={input.propeller.diameterM} layout={input.airframe.layout} /></article>
    <article class="warnings"><div class="chart-head"><h3>{$t('warnings')}</h3><span class="data">{result.warnings.length}</span></div>{#if result.warnings.length === 0}<p>موردی برای بررسی نیست.</p>{:else}<ul>{#each result.warnings as warning}<li class:critical={warning.severity === 'critical'}><b>{warning.severity === 'critical' ? '!' : '·'}</b><span>{warningLabels[warning.code] ?? 'نیازمند بررسی'}</span></li>{/each}</ul>{/if}</article>
  {/if}
</section>

<style>
  .results { display: grid; gap: 14px; }
  .result-heading, .chart-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }.kicker { color: var(--muted); font-size: 12px; }.result-heading h2 { margin: 3px 0 0; font-size: 27px; letter-spacing: -0.04em; }.state { border-radius: 999px; background: color-mix(in oklch, var(--green) 12%, transparent); color: var(--green); padding: 5px 11px; font-size: 12px; }.state.danger { background: color-mix(in oklch, var(--danger) 12%, transparent); color: var(--danger); }
  .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.metrics article { display: flex; align-items: center; gap: 12px; min-width: 0; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); padding: 14px; box-shadow: var(--shadow-soft); }.metric__icon { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: 13px; font-size: 22px; }.metric__icon--green { background: color-mix(in oklch, var(--green) 14%, transparent); color: var(--green); }.metric__icon--blue { background: var(--blue-soft); color: var(--blue); }.metric__icon--orange { background: var(--orange-soft); color: var(--orange); }.metric__icon--purple { background: color-mix(in oklch, #8d63e8 14%, transparent); color: #8d63e8; }.metrics small { display: block; color: var(--muted); font-size: 12px; }.metrics strong { display: block; margin-top: 2px; font-size: 23px; }.metrics em { color: var(--muted); font-size: 12px; font-style: normal; font-weight: 500; }
  .chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }.chart-grid > article, .coverage, .warnings { min-width: 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 16px; box-shadow: var(--shadow-soft); }.chart-grid__power { grid-column: 1 / -1; }.chart-head h3 { margin: 0; font-size: 15px; }.chart-head > span { color: var(--muted); font-size: 12px; }.warnings p { margin: 10px 0 0; color: var(--muted); font-size: 13px; }.warnings ul { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; color: var(--orange); font-size: 13px; }.warnings li { display: flex; gap: 8px; align-items: center; }.warnings li.critical { color: var(--danger); }.warnings li b { display: grid; width: 20px; height: 20px; place-items: center; border-radius: 50%; background: currentColor; color: var(--surface); font-size: 12px; }
  @media (max-width: 720px) { .chart-grid { grid-template-columns: minmax(0, 1fr); }.chart-grid__power { grid-column: auto; } }.coverage :global(.coverage) { margin-top: 12px; }
  @media (max-width: 420px) { .metrics { grid-template-columns: minmax(0, 1fr); } }
</style>
