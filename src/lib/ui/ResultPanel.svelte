<script lang="ts">
  import { t } from '$lib/i18n';
  import type { MissionInput, MissionResult } from '$core/types';
  import Chart from './Chart.svelte';
  import RotorCoverage from './RotorCoverage.svelte';
  export let result: MissionResult;
  export let input: MissionInput;
  $: chartText = { color: 'oklch(48% 0.025 250)' };
  $: thrustOption = ({
    animationDuration: 520,
    grid: { left: 38, right: 14, top: 18, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: result.points.map((point) => point.name), axisLabel: chartText },
    yAxis: { type: 'value', name: 'N', axisLabel: chartText },
    series: [{ type: 'line', smooth: true, data: result.points.map((point) => point.thrustN), lineStyle: { color: 'oklch(52% 0.22 258)', width: 3 }, itemStyle: { color: 'oklch(52% 0.22 258)' } }]
  });
  $: powerOption = ({
    animationDuration: 520,
    grid: { left: 42, right: 14, top: 18, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: result.points.map((point) => point.name), axisLabel: chartText },
    yAxis: { type: 'value', name: 'W', axisLabel: chartText },
    series: [{ type: 'bar', barMaxWidth: 34, data: result.points.map((point) => point.totalPowerW), itemStyle: { color: 'oklch(62% 0.17 42)' } }]
  });
</script>

<section class="results" aria-labelledby="results-heading">
  <div class="result-heading"><div><span class="eyebrow">04 / OUTPUT</span><h2 id="results-heading">{$t('results')}</h2></div><span class="result-state">{result.warnings.filter((warning) => warning.severity === 'critical').length ? 'بررسی لازم است' : 'پایدار'}</span></div>
  <div class="metrics">
    <article><span>{$t('flightTime')}</span><strong class="mono">{result.flightTimeMin.toFixed(1)}<small> min</small></strong></article>
    <article><span>{$t('range')}</span><strong class="mono">{result.rangeKm.toFixed(1)}<small> km</small></strong></article>
    <article><span>{$t('ceiling')}</span><strong class="mono">{result.ceilingM == null ? '—' : `${result.ceilingM}`}<small>{result.ceilingM == null ? '' : ' m'}</small></strong></article>
    <article><span>{$t('totalPower')}</span><strong class="mono">{result.totalPowerW.toFixed(0)}<small> W</small></strong></article>
  </div>
  <div class="signal"><div><span>حاشیه رانش</span><strong class="mono">{(result.thrustToWeight * 100).toFixed(0)}%</strong></div><div class="meter"><i style={`--value: ${Math.min(100, result.thrustToWeight * 50)}%`}></i></div></div>
  <div class="chart-grid"><article class="chart-card"><div class="chart-title"><span>رانش نقطه‌های کاری</span><span class="mono">N</span></div><Chart option={thrustOption} /></article><article class="chart-card"><div class="chart-title"><span>توان مورد نیاز</span><span class="mono">W</span></div><Chart option={powerOption} /></article></div>
  <article class="coverage-card"><RotorCoverage rotorCount={input.airframe.rotorCount} frameSizeM={input.airframe.frameSizeM} propellerDiameterM={input.propeller.diameterM} layout={input.airframe.layout} /></article>
  <article class="warning-card" aria-labelledby="warning-heading"><div class="chart-title"><h3 id="warning-heading">{$t('warnings')}</h3><span class="mono">{result.warnings.length}</span></div>{#if result.warnings.length === 0}<p class="quiet">{$t('noWarnings')}</p>{:else}<ul>{#each result.warnings as warning}<li class:critical={warning.severity === 'critical'}><span aria-hidden="true">{warning.severity === 'critical' ? '!' : '·'}</span>{warning.code}</li>{/each}</ul>{/if}</article>
</section>

<style>
  .results { display: grid; gap: var(--space-md); }
  .result-heading, .chart-title { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-sm); }
  .eyebrow { color: var(--color-muted); font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: 0.08em; }
  h2, h3 { margin: var(--space-2xs) 0 0; font-size: var(--text-xl); letter-spacing: -0.025em; }
  h3 { font-size: var(--text-md); }
  .result-state { border-radius: 99px; background: var(--color-paper-2); color: var(--color-success); padding: var(--space-2xs) var(--space-sm); font-size: var(--text-xs); }
  .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--color-rule); border-radius: var(--radius-md); background: var(--color-rule); }
  .metrics article { display: grid; gap: var(--space-xs); background: var(--color-surface); padding: var(--space-md); }
  .metrics span, .signal span { color: var(--color-muted); font-size: var(--text-sm); }
  .metrics strong { font-size: var(--text-xl); line-height: 1; }
  .metrics small { color: var(--color-muted); font-size: var(--text-xs); font-weight: 400; }
  .signal { display: grid; gap: var(--space-xs); }
  .signal > div:first-child { display: flex; justify-content: space-between; }
  .meter { height: 8px; overflow: hidden; border-radius: 99px; background: var(--color-paper-2); }
  .meter i { display: block; width: var(--value); height: 100%; border-radius: inherit; background: var(--color-accent); }
  .chart-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: var(--space-md); }
  .chart-card, .coverage-card, .warning-card { border: 1px solid var(--color-rule); border-radius: var(--radius-md); background: var(--color-surface); padding: var(--space-md); }
  .chart-title { color: var(--color-ink-2); font-size: var(--text-sm); }
  .quiet { margin: var(--space-sm) 0 0; color: var(--color-muted); font-size: var(--text-sm); }
  ul { display: grid; gap: var(--space-xs); margin: var(--space-sm) 0 0; padding: 0; list-style: none; color: var(--color-warning); font-size: var(--text-sm); }
  li { display: flex; gap: var(--space-xs); align-items: center; }
  li.critical { color: var(--color-error); }
  @media (max-width: 60rem) { .chart-grid { grid-template-columns: 1fr; } }
</style>

