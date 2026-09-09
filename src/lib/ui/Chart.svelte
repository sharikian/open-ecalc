<script lang="ts">
  import * as echarts from 'echarts';
  import { onMount } from 'svelte';
  export let option: echarts.EChartsOption;
  export let ariaLabel = 'Engineering chart';
  export let height = 230;
  let host: HTMLDivElement;
  let chart: echarts.ECharts;
  $: if (chart && option) chart.setOption(option, true);
  onMount(() => {
    chart = echarts.init(host, undefined, { renderer: 'svg' });
    chart.setOption(option);
    const resize = () => chart.resize();
    const observer = new ResizeObserver(resize);
    window.addEventListener('resize', resize);
    observer.observe(host);
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); chart.dispose(); };
  });
</script>

<div class="chart" style={`--chart-height:${height}px`} bind:this={host} role="img" aria-label={ariaLabel}></div>

<style>
  .chart { width: 100%; height: var(--chart-height, 230px); min-height: var(--chart-height, 230px); }
</style>
