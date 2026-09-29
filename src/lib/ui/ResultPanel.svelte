<script lang="ts">
  import * as ECharts from 'echarts';
  import { locale } from '$lib/i18n';
  import { batteryCurrentLimitA, coefficientOperatingPoint } from '$core/physics';
  import type { MissionInput, MissionResult } from '$core/types';
  import Chart from './Chart.svelte';
  import Icon from './Icon.svelte';
  import RotorCoverage from './RotorCoverage.svelte';
  import Feedback from './Feedback.svelte';

  export let result: MissionResult | null = null;
  export let input: MissionInput;

  $: en = $locale === 'en';
  const text = (fa: string, english: string) => en ? english : fa;
  const number = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : '—';
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const css = (name: string, fallback: string) => typeof document === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const labels = (name: 'hover' | 'cruise' | 'climb') => en ? ({ hover: 'Hover', cruise: 'Cruise', climb: 'Climb' }[name]) : ({ hover: 'هاور', cruise: 'کروز', climb: 'اوج‌گیری' }[name]);
  const warningLabels: Record<string, [string, string]> = {
    'battery-continuous-current': ['Battery continuous current', 'جریان دائم باتری'], 'battery-burst-current': ['Battery burst current', 'جریان لحظه‌ای باتری'], 'esc-continuous-current': ['ESC continuous current', 'جریان دائم ESC'], 'esc-burst-current': ['ESC burst current', 'جریان لحظه‌ای ESC'], 'motor-current': ['Motor current limit', 'جریان مجاز موتور'], 'motor-power': ['Motor power limit', 'توان مجاز موتور'], 'voltage-sag': ['Battery voltage sag', 'افت ولتاژ باتری'], 'insufficient-thrust': ['Insufficient thrust', 'رانش ناکافی'], 'propeller-clearance': ['Propeller clearance', 'فاصلهٔ آزاد ملخ'], 'curve-range': ['Operating point outside test curve', 'نقطهٔ کاری بیرون از منحنی تست'], 'missing-thermal-data': ['Motor thermal data missing', 'دادهٔ حرارتی موتور ناقص']
  };

  $: hover = result?.points[0] ?? null;
  $: batteryLimitA = result ? batteryCurrentLimitA(input.battery) : 0;
  $: batteryLoadPct = hover && batteryLimitA > 0 ? hover.totalCurrentA / batteryLimitA * 100 : 0;
  $: motorPowerLimitW = Math.max(0, input.motor.maxPowerW * input.airframe.rotorCount);
  $: motorLoadPct = hover && motorPowerLimitW > 0 ? hover.totalPowerW / motorPowerLimitW * 100 : 0;
  $: thrustMarginPct = result ? result.thrustMargin * 100 : 0;
  $: targetThrustN = result ? result.takeoffMassKg * 9.80665 * input.targetThrustMargin : 0;

  // Prefer measured data; otherwise sample the coefficient model used by the engine.
  $: curvePoints = result ? (input.propeller.curve?.length
    ? [...input.propeller.curve].sort((a, b) => a.throttle - b.throttle)
    : Array.from({ length: 21 }, (_, index) => coefficientOperatingPoint(input.propeller, input.motor, input.esc, result.airDensityKgM3, result.loadedVoltageV, index / 20))) : [];

  const gaugeOption = (label: string, value: number, min: number, max: number, unit: string, color: string, digits = 0): ECharts.EChartsOption => ({
    animationDuration: 720,
    animationEasing: 'cubicOut',
    series: [{
      type: 'gauge', min, max, startAngle: 220, endAngle: -40, center: ['50%', '59%'], radius: '86%',
      axisLine: { lineStyle: { width: 13, color: [[0.62, css('--blue-soft', '#e8f1ff')], [0.82, css('--orange-soft', '#fff2dc')], [1, css('--line', '#d7e4f5')]] } },
      progress: { show: true, width: 13, roundCap: true, itemStyle: { color } },
      pointer: { show: false }, anchor: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { offsetCenter: [0, '-42%'], color: css('--muted', '#60769d'), fontSize: 12, fontFamily: 'Vazir, sans-serif' },
      detail: { offsetCenter: [0, '8%'], valueAnimation: true, color: css('--ink', '#071744'), fontSize: 23, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', formatter: (v: number) => `\u200E${number(v, digits)}${unit ? ` ${unit}` : ''}\u200E` },
      data: [{ value: clamp(value, min, max), name: label }]
    }]
  });

  $: gaugeThrust = result ? gaugeOption(text('نسبت رانش به وزن', 'Thrust / weight'), result.thrustToWeight, 0, 3, ':1', css('--blue', '#1167fa'), 2) : null;
  $: gaugeBattery = result ? gaugeOption(text('بار جریان باتری', 'Battery current load'), batteryLoadPct, 0, 120, '%', css('--green', '#18b879')) : null;
  $: gaugeMotor = result ? gaugeOption(text('بار توان موتور', 'Motor power load'), motorLoadPct, 0, 120, '%', css('--orange', '#f28b22')) : null;
  $: gaugeMargin = result ? gaugeOption(text('حاشیهٔ رانش', 'Thrust margin'), Math.max(0, thrustMarginPct), 0, 100, '%', thrustMarginPct < 0 ? css('--danger', '#e04b4b') : css('--purple', '#8d63e8')) : null;

  const axisStyle = { color: '#60769d', fontFamily: 'Vazir, Inter, sans-serif' };
  const chartGrid = { left: 52, right: 52, top: 38, bottom: 42 };
  $: performanceOption = result ? ({
    animationDuration: 760, animationEasing: 'cubicOut', grid: chartGrid,
    tooltip: { trigger: 'axis', confine: true, formatter: (items: any[]) => {
      const first = items.find((item) => item.seriesName === text('رانش', 'Thrust')) ?? items[0];
      const second = items.find((item) => item.seriesName === text('جریان موتور', 'Motor current'));
      const marker = items.find((item) => item.seriesName === text('نقاط کاری', 'Operating points'));
      const title = `${number(Number(first?.axisValue), 0)}%`;
      return [title, first ? `${text('رانش', 'Thrust')}: ${number(Number(first.value?.[1] ?? first.value), 1)} N` : '', second ? `${text('جریان موتور', 'Motor current')}: ${number(Number(second.value?.[1] ?? second.value), 1)} A` : '', marker?.data?.[2] ? `${text('نقطه', 'Point')}: ${labels(marker.data[2])}` : ''].filter(Boolean).join('<br/>');
    } },
    legend: { top: 0, left: 'center', itemGap: 16, textStyle: axisStyle },
    xAxis: { type: 'value', min: 0, max: 100, name: text('دریچه گاز %', 'Throttle %'), nameLocation: 'middle', nameGap: 28, nameTextStyle: axisStyle, axisLabel: axisStyle, axisLine: { lineStyle: { color: '#a7bddc' } }, splitLine: { show: false } },
    yAxis: [{ type: 'value', name: 'N', nameTextStyle: axisStyle, axisLabel: axisStyle, splitLine: { lineStyle: { color: '#d7e4f5' } } }, { type: 'value', name: 'A', nameTextStyle: axisStyle, axisLabel: axisStyle, splitLine: { show: false } }],
    series: [
      { name: text('رانش', 'Thrust'), type: 'line', smooth: true, showSymbol: false, data: curvePoints.map((point) => [point.throttle * 100, point.thrustN]), lineStyle: { width: 3, color: css('--blue', '#1167fa') }, areaStyle: { color: css('--blue-soft', '#e8f1ff'), opacity: .62 } },
      { name: text('جریان موتور', 'Motor current'), type: 'line', yAxisIndex: 1, smooth: true, showSymbol: false, data: curvePoints.map((point) => [point.throttle * 100, point.currentA]), lineStyle: { width: 2, color: css('--green', '#18b879'), type: 'dashed' } },
      { name: text('نقاط کاری', 'Operating points'), type: 'scatter', data: result.points.map((point) => [point.throttle * 100, point.thrustN, point.name]), symbolSize: 12, itemStyle: { color: css('--orange', '#f28b22'), borderColor: css('--surface', '#fff'), borderWidth: 2 }, label: { show: true, position: 'top', color: css('--ink', '#071744'), fontSize: 11, formatter: (params: any) => labels(params.data[2]) } }
    ]
  }) as ECharts.EChartsOption : null;

  $: altitudeOption = result ? ({
    animationDuration: 820, animationEasing: 'cubicOut', grid: chartGrid,
    tooltip: { trigger: 'axis', confine: true, formatter: (items: any[]) => { const altitude = items[0]?.axisValue; return [`${altitude} m`, ...items.map((item) => `${item.seriesName}: ${number(Number(item.value?.[1] ?? item.value), 1)} N`)].join('<br/>'); } },
    legend: { top: 0, left: 'center', itemGap: 16, textStyle: axisStyle },
    xAxis: { type: 'value', name: 'm', nameLocation: 'middle', nameGap: 28, nameTextStyle: axisStyle, axisLabel: axisStyle, axisLine: { lineStyle: { color: '#a7bddc' } }, min: result.altitudeProfile[0]?.altitudeM, max: result.altitudeProfile.at(-1)?.altitudeM },
    yAxis: { type: 'value', name: 'N', nameTextStyle: axisStyle, axisLabel: axisStyle, splitLine: { lineStyle: { color: '#d7e4f5' } } },
    series: [
      { name: text('رانش موجود', 'Available thrust'), type: 'line', smooth: true, showSymbol: true, symbolSize: 8, data: result.altitudeProfile.map((point) => [point.altitudeM, point.availableThrustN]), lineStyle: { width: 3, color: css('--purple', '#8d63e8') }, areaStyle: { color: css('--purple', '#8d63e8'), opacity: .1 } },
      { name: text('حاشیهٔ هدف', 'Target margin'), type: 'line', showSymbol: false, data: result.altitudeProfile.map((point) => [point.altitudeM, targetThrustN]), lineStyle: { width: 2, color: css('--orange', '#f28b22'), type: 'dashed' } }
    ]
  }) as ECharts.EChartsOption : null;
</script>

{#if result}
  <section class="results" aria-labelledby="result-title">
    <header class="result-heading"><div><span class="kicker">{text('خروجی محاسبه', 'Calculation output')}</span><h2 id="result-title">{text('عملکرد پرنده', 'Aircraft performance')}</h2></div><span class:danger={result.warnings.some((warning) => warning.severity === 'critical')} class="state">{result.warnings.some((warning) => warning.severity === 'critical') ? text('نیازمند بررسی', 'Review required') : text('در محدوده', 'Within limits')}</span></header>
    <div class="headline-stats" aria-label={text('اعداد کلیدی', 'Key values')}>
      <div><Icon name="clock" size={18} /><span>{text('زمان پرواز', 'Flight time')}</span><b class="data">{number(result.flightTimeMin)} <small>min</small></b></div>
      <div><Icon name="pin" size={18} /><span>{text('برد', 'Range')}</span><b class="data">{number(result.rangeKm)} <small>km</small></b></div>
      <div><Icon name="bolt" size={18} /><span>{text('ولتاژ زیر بار', 'Loaded voltage')}</span><b class="data">{number(result.loadedVoltageV)} <small>V</small></b></div>
      <div><Icon name="ceiling" size={18} /><span>{text('سقف پیشنهادی', 'Suggested ceiling')}</span><b class="data">{result.ceilingM == null ? '—' : number(result.ceilingM, 0)} <small>{result.ceilingM == null ? '' : 'm'}</small></b></div>
    </div>

    <section class="gauge-section" aria-labelledby="gauge-title"><div class="section-head"><div><h3 id="gauge-title">{text('گیج‌های اصلی', 'Primary gauges')}</h3><p>{text('سه نقطهٔ کاری روی منحنی‌ها مشخص شده‌اند.', 'Hover, cruise and climb are marked on the curves.')}</p></div><span class="data">{number(result.totalPowerW, 0)} W</span></div><div class="gauges">
      {#if gaugeThrust}<article class="gauge-card"><Chart option={gaugeThrust} ariaLabel={text('گیج نسبت رانش به وزن', 'Thrust to weight gauge')} height={154} /><small>{text('هدف پیشنهادی: بالاتر از ۱٫۲', 'Target: above 1.2')}</small></article>{/if}
      {#if gaugeBattery}<article class="gauge-card"><Chart option={gaugeBattery} ariaLabel={text('گیج بار جریان باتری', 'Battery current load gauge')} height={154} /><small class:bad={batteryLoadPct > 100}>{number(batteryLimitA, 0)} A {text('حد دائم باتری', 'battery continuous limit')}</small></article>{/if}
      {#if gaugeMotor}<article class="gauge-card"><Chart option={gaugeMotor} ariaLabel={text('گیج بار توان موتور', 'Motor power load gauge')} height={154} /><small class:bad={motorLoadPct > 100}>{number(motorPowerLimitW, 0)} W {text('حد کل موتورها', 'total motor limit')}</small></article>{/if}
      {#if gaugeMargin}<article class="gauge-card"><Chart option={gaugeMargin} ariaLabel={text('گیج حاشیه رانش', 'Thrust margin gauge')} height={154} /><small class:bad={thrustMarginPct < 0}>{thrustMarginPct < 0 ? text('کمتر از وزن مورد نیاز', 'Below required thrust') : text('ذخیرهٔ رانش نسبت به وزن', 'Reserve over vehicle weight')}</small></article>{/if}
    </div></section>

    <section class="curve-section" aria-labelledby="curve-title"><div class="section-head"><div><h3 id="curve-title">{text('منحنی رانش و جریان', 'Thrust and current curve')}</h3><p>{input.propeller.curve?.length ? text('بر پایهٔ منحنی تست قطعه.', 'Based on the component test curve.') : text('بر پایهٔ مدل ضرایب ملخ.', 'Sampled from the propeller coefficient model.')}</p></div><span class="data">0–100 %</span></div>{#if performanceOption}<Chart option={performanceOption} ariaLabel={text('منحنی رانش و جریان نسبت به دریچه گاز', 'Thrust and current versus throttle')} height={310} />{/if}</section>
    <section class="curve-section" aria-labelledby="altitude-title"><div class="section-head"><div><h3 id="altitude-title">{text('سقف پرواز', 'Altitude ceiling')}</h3><p>{text('رانش موجود با خط نیازمندی مقایسه می‌شود.', 'Available thrust is compared with the required margin.')}</p></div><span class="data">{result.hoverCeilingM == null ? '—' : `${number(result.hoverCeilingM, 0)} m`}</span></div>{#if altitudeOption}<Chart option={altitudeOption} ariaLabel={text('منحنی رانش نسبت به ارتفاع', 'Thrust versus altitude curve')} height={290} />{/if}</section>

    <div class="lower-grid"><article class="coverage card"><div class="section-head"><h3>{text('چیدمان روتورها', 'Rotor layout')}</h3><span class="data">{number(result.thrustMargin * 100, 0)}%</span></div><RotorCoverage rotorCount={input.airframe.rotorCount} frameSizeM={input.airframe.frameSizeM} propellerDiameterM={input.propeller.diameterM} layout={input.airframe.layout} /></article><article class="warnings card"><div class="section-head"><h3>{text('کنترل محدودیت‌ها', 'Limit checks')}</h3><span class="data">{result.warnings.length}</span></div>{#if result.warnings.length === 0}<p>{text('محدودیت بحرانی دیده نشد.', 'No critical limit detected.')}</p>{:else}<ul>{#each result.warnings as warning}<li class:critical={warning.severity === 'critical'}><b>{warning.severity === 'critical' ? '!' : '·'}</b><span>{warningLabels[warning.code]?.[en ? 0 : 1] ?? text('نیازمند بررسی', 'Review required')}</span></li>{/each}</ul>{/if}</article></div>
    {#if result.currentScenarios?.length}
      <section class="card scenario-section" aria-labelledby="scenario-title"><h3 id="scenario-title">{text('مقایسهٔ جریان‌ها', 'Current comparison')}</h3><p>{text('برآورد با جریان ثابت؛ مستقل از منحنی رانش.', 'Constant-current estimates; independent of the thrust curve.')}</p>
        {#each result.currentScenarios as scenario, index}<article class="scenario-row"><b>{index + 1}</b><dl><div><dt>{text('هر موتور', 'Per motor')}</dt><dd>{number(scenario.currentPerMotorA)} A</dd></div><div><dt>{text('جریان کل', 'Total current')}</dt><dd>{number(scenario.totalCurrentA)} A</dd></div><div><dt>{text('مداومت', 'Duration')}</dt><dd>{number(scenario.flightTimeMin)} min</dd></div><div><dt>{text('برد', 'Range')}</dt><dd>{number(scenario.rangeKm)} km</dd></div></dl>{#if scenario.warnings.length}<ul>{#each scenario.warnings as warning}<li>{warningLabels[warning.code]?.[en ? 0 : 1]}</li>{/each}</ul>{/if}</article>{/each}
      </section>
    {/if}
    <Feedback calculation={{ mode: 'advanced', input, result }} />
  </section>
{/if}

<style>
  .results { display: grid; gap: 16px; }.result-heading, .section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }.kicker { color: var(--muted); font-size: 12px; }.result-heading h2 { margin: 3px 0 0; font-size: 28px; letter-spacing: -.04em; }.state { border-radius: 999px; background: color-mix(in oklch, var(--green) 12%, transparent); color: var(--green); padding: 6px 12px; font-size: 12px; white-space: nowrap; }.state.danger { background: color-mix(in oklch, var(--danger) 12%, transparent); color: var(--danger); }
  .headline-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-block: 1px solid var(--line); }.headline-stats div { display: grid; grid-template-columns: 24px 1fr; align-items: center; gap: 2px 8px; min-width: 0; padding: 12px 14px; border-inline-start: 1px solid var(--line); }.headline-stats div:first-child { border-inline-start: 0; }.headline-stats :global(svg) { grid-row: 1 / span 2; color: var(--blue); }.headline-stats span { color: var(--muted); font-size: 11px; }.headline-stats b { color: var(--ink); font-size: 18px; }.headline-stats small { color: var(--muted); font-size: 10px; font-weight: 500; }
  .gauge-section, .curve-section, .card { min-width: 0; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 16px; box-shadow: var(--shadow-soft); }.section-head { align-items: start; }.section-head h3 { margin: 0; font-size: 15px; }.section-head p { margin: 3px 0 0; color: var(--muted); font-size: 11px; }.section-head > .data { color: var(--muted); font-size: 12px; white-space: nowrap; }
  .gauges { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }.gauge-card { display: grid; min-width: 0; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); padding: 4px 8px 10px; text-align: center; }.gauge-card :global(.chart) { min-height: 154px; }.gauge-card small { min-height: 26px; color: var(--muted); font-size: 10px; line-height: 1.45; }.gauge-card small.bad { color: var(--danger); }
  .curve-section :global(.chart) { margin-top: 8px; }.lower-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 16px; }.coverage :global(.coverage) { margin-top: 12px; }.warnings p { margin: 14px 0 0; color: var(--muted); font-size: 13px; }.warnings ul { display: grid; gap: 9px; margin: 15px 0 0; padding: 0; list-style: none; color: var(--orange); font-size: 13px; }.warnings li { display: flex; gap: 8px; align-items: center; }.warnings li.critical { color: var(--danger); }.warnings li b { display: grid; width: 21px; height: 21px; place-items: center; border-radius: 50%; background: currentColor; color: var(--surface); font-size: 12px; }
  @media (max-width: 900px) { .gauges { grid-template-columns: repeat(2, minmax(0, 1fr)); }.lower-grid { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 620px) { .result-heading h2 { font-size: 24px; }.headline-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }.headline-stats div:nth-child(3) { border-inline-start: 0; border-block-start: 1px solid var(--line); }.headline-stats div:nth-child(4) { border-block-start: 1px solid var(--line); }.gauge-section, .curve-section, .card { padding: 12px; }.section-head { gap: 8px; }.section-head p { max-width: 220px; }.curve-section :global(.chart) { min-height: 250px; } }
  @media (max-width: 380px) { .gauges { grid-template-columns: minmax(0, 1fr); }.gauge-card :global(.chart) { min-height: 145px; }.gauge-card small { min-height: 0; }.headline-stats b { font-size: 16px; } }
  @media (max-width: 620px) {
    .headline-stats span, .headline-stats small, .section-head p, .section-head > .data, .gauge-card small { font-size: 14px; }
    .section-head h3 { font-size: 17px; }
    .warnings ul, .warnings p { font-size: 15px; }
  }
  .scenario-section h3 { margin: 0; font-size: 17px; }.scenario-section > p { font-size: 14px; color: var(--muted); }
  .scenario-row { border-top: 1px solid var(--line); padding-block: 14px; }
  .scenario-row > b { color: var(--blue); }.scenario-row dl { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-block: 8px; }.scenario-row dt { font-size: 14px; color: var(--muted); }.scenario-row dd { margin: 4px 0 0; font: 16px var(--font-data); direction: ltr; text-align: start; }.scenario-row ul { color: var(--danger); font-size: 14px; }
  @media (max-width: 620px) { .scenario-row dl { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
